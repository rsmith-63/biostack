# Task: Fix JSON Parsing Crash on MCP Errors

**Objective:** Add defensive checks to the Koa server so it doesn't attempt to `JSON.parse()` plain-text error messages returned by the MCP client, and ensure the correct tool names are used.

## File to Update
**Path:** `/Users/robsmith/biostack/server/src/api/pubmed.js` (or your main router file)

## Instructions for Agent
Locate the `/api/pubmed/search` route and update the MCP tool execution logic to check if the returned text starts with "MCP error" before parsing.

```javascript
// ... inside router.post('/api/pubmed/search', ...)

    // STEP 1: Call the search tool
    // NOTE TO DEVELOPER: Update "ppubmed_search_articles below to the exact tool name 
    // you found when running inspect-tools.js
    const searchResponse = await mcpClient.callTool({
      name: pubmed_search_articles", 
      arguments: { query: query, max_results: maxResults || 10 }
    });

    const searchText = searchResponse.content[0].text;

    // --- NEW DEFENSIVE CHECK ---
    if (searchText.startsWith("MCP error") || searchText.includes("not found")) {
      ctx.status = 502; // Bad Gateway / Upstream Error
      ctx.body = { success: false, message: `Upstream MCP Error: ${searchText}` };
      return;
    }

    const searchData = JSON.parse(searchText);
    const pmids = searchData.pmids || [];

    if (!pmids || pmids.length === 0) {
      ctx.body = { success: true, data: [] };
      return;
    }

    // STEP 2: Call the fetch tool
    // NOTE TO DEVELOPER: Update "pubmed_fetch_articles" below to the exact tool name 
    // you found when running inspect-tools.js
    const fetchResponse = await mcpClient.callTool({
      name: "pubmed_fetch_articles",
      arguments: { pmids: pmids }
    });

    const fetchText = fetchResponse.content[0].text;

    // --- NEW DEFENSIVE CHECK ---
    if (fetchText.startsWith("MCP error") || fetchText.includes("not found")) {
      ctx.status = 502;
      ctx.body = { success: false, message: `Upstream MCP Error on Fetch: ${fetchText}` };
      return;
    }

    const fetchedContent = JSON.parse(fetchText);
    
    const articles = Array.isArray(fetchedContent) 
      ? fetchedContent 
      : (fetchedContent.articles || fetchedContent.results || []);

    ctx.body = { success: true, data: articles };
    
// ... existing catch block remains the same ...