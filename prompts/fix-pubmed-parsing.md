# Task: Fix NCBI MCP Server Data Parsing and Fetch Flags

**Objective:** Update the Koa server to explicitly request article summaries from the NCBI MCP server, and update the React frontend to properly parse the resulting `briefSummaries` array into `CitationCard` components.

## Step 1: Update the Koa Server Tool Call
**File:** `server/src/api/pubmed.js` (or your primary server entry point)

**Action:** Locate the `mcpClient.callTool` execution inside the `/api/pubmed/search` route. Update the `arguments` object to explicitly include the flag to fetch summaries (often `fetchBriefSummaries: 1` or `true` based on the payload).

```javascript
// ... inside router.post('/api/pubmed/search', ...)

    const result = await mcpClient.callTool({
      name: "pubmed_search", // (Or your dynamically discovered search tool name)
      arguments: {
        query: query,
        maxResults: maxResults,
        // ADD THIS FLAG so the MCP server fetches titles/abstracts, not just PMIDs
        fetchBriefSummaries: 1 
      }
    });

// ...