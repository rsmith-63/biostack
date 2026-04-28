# Task: Implement Two-Step MCP Fetch and Responsive UI

**Objective:** Update the Koa server to chain `pubmed_search_articles` and `pubmed_fetch_articles` to guarantee full abstracts are retrieved. Update the React frontend to display these results in a responsive grid of citation cards.

## Step 1: Update Koa Server Route
**File:** `/Users/robsmith/biostack/server/src/api/pubmed.js` (or your main router file like `index.js`)

**Action:** Rewrite the `/api/pubmed/search` route. The new logic must explicitly call the search tool, parse the PMIDs, and then immediately call the fetch tool using those PMIDs.

```javascript
// ... existing imports and MCP client setup ...

router.post('/api/pubmed/search', async (ctx) => {
  try {
    const { query, maxResults } = ctx.request.body;

    if (!query) {
      ctx.status = 400;
      ctx.body = { success: false, message: "Query is required" };
      return;
    }

    // STEP 1: Call pubmed_search_articles to get the PMIDs
    const searchResponse = await mcpClient.callTool({
      name: "pubmed_search_articles", 
      arguments: { query: query, max_results: maxResults || 10 }
    });

    const searchData = JSON.parse(searchResponse.content[0].text);
    const pmids = searchData.pmids || [];

    // If no PMIDs found, return early
    if (!pmids || pmids.length === 0) {
      ctx.body = { success: true, data: [] };
      return;
    }

    // STEP 2: Call pubmed_fetch_articles using the extracted PMIDs
    const fetchResponse = await mcpClient.callTool({
      name: "pubmed_fetch_articles",
      arguments: { pmids: pmids }
    });

    const fetchedContent = JSON.parse(fetchResponse.content[0].text);
    
    // Normalize the output to ensure we are sending an array of articles to the client
    const articles = Array.isArray(fetchedContent) 
      ? fetchedContent 
      : (fetchedContent.articles || fetchedContent.results || []);

    ctx.body = { success: true, data: articles };
    
  } catch (error) {
    console.error("MCP Tool Chain Error:", error);
    ctx.status = 500;
    ctx.body = { success: false, message: error.message };
  }
});