# 🛠️ Fix: Forcing usehistory=y in NCBI ESearch

**Problem:** The ESearch URL shows `&usehistory=n`, causing `WebEnv` and `QueryKey` to be `undefined`.
**Solution:** Align the MCP tool argument with the raw NCBI parameter name.

## 1. Correct the Koa Controller
Update the `arguments` object in your `pubmed_search_articles` call.

**File:** `src/server/index.js`
```javascript
const searchResponse = await mcpClient.callTool({
  name: "pubmed_search_articles",
  arguments: {
    queryTerm: cleanQuery,
    maxResults: maxResults,
    usehistory: true // ✅ Change from 'useHistory' to 'usehistory'
  }
});