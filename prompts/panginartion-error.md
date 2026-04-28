# 🚑 Resolving Zod Validation Error: Missing webEnv & queryKey

**Error Trace:**
`ZodError: Invalid input: expected string, received undefined` at `src/server/index.js`

**Diagnosis:**
This 400 HTTP error happens when the `pubmed_fetch_contents` route in Koa receives a request from the React frontend that is missing the Entrez History tokens (`webEnv` and `queryKey`). Zod blocks the request before it even reaches the MCP server.

This typically happens for one of two reasons:
1. The initial search never generated the tokens.
2. The Zod schema is too strict, requiring tokens even when the frontend is just trying to fetch by raw `pmids`.

---

## 🛠️ Fix 1: Generate the Tokens During Search
To get a `webEnv` and `queryKey` from NCBI, your initial search request must explicitly set `usehistory: true`. If this is false or omitted, the tokens will be `undefined`.

**Update your Search Controller:**
```javascript
// src/server/index.js (or pubmedController.js)

const searchResponse = await mcpClient.callTool("pubmed_search_articles", { 
  queryTerm: ctx.query.queryTerm, 
  maxResults: 20,
  usehistory: true // 👈 CRITICAL: This forces NCBI to generate webEnv & queryKey
});

const searchResults = JSON.parse(searchResponse.content[0].text);

// Now you can safely send these back to the React client
ctx.body = {
  success: true,
  totalCount: searchResults.total || searchResults.count,
  webEnv: searchResults.webEnv,     // Send to client
  queryKey: searchResults.queryKey, // Send to client
  pmids: searchResults.pmids
};