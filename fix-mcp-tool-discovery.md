# Task: Implement Dynamic MCP Tool Discovery

**Objective:** Refactor the Koa server's search route to automatically discover the correct search tool name from the NCBI MCP server at runtime, preventing "Tool not found" errors.

## Context
The `@iflow-mcp/pubmed-mcp-server` exposes tools, but the exact string name for the search tool (e.g., `"search"`, `"pubmed_search"`, `"query"`) needs to be retrieved dynamically via the MCP Client's `listTools()` method before calling `callTool()`.

## Instructions for Agent
1. Read the current implementation of the server file (located at `server/src/api/pubmed.js` or similar).
2. Locate the HTTP POST route handling the search request (`router.post('/api/pubmed/search', ...)`).
3. Modify the route handler to query the MCP server for its available tools before executing the search.
4. Filter the returned tools to find the one responsible for searching (typically containing the word "search" or "pubmed" in its name).
5. Pass that dynamically discovered name into the `callTool` execution.

## Code Implementation Guide
Inject the following logic into the route handler:

```javascript
router.post('/api/pubmed/search', async (ctx) => {
  try {
    const { query, maxResults } = pubmedSearchSchema.parse(ctx.request.body);

    // 1. Fetch available tools dynamically
    const { tools } = await mcpClient.listTools();
    
    // 2. Find the correct search tool by matching expected naming conventions
    const searchTool = tools.find(t => 
      t.name.toLowerCase().includes('search') || 
      t.name.toLowerCase().includes('query')
    );

    if (!searchTool) {
      ctx.status = 500;
      ctx.body = { 
        success: false, 
        message: "Search tool not found on the NCBI MCP server. Available tools: " + tools.map(t => t.name).join(', ') 
      };
      return;
    }

    // 3. Execute the call using the discovered tool name
    const result = await mcpClient.callTool({
      name: searchTool.name, 
      arguments: {
        // Fallback argument names based on common MCP implementations
        query: query,
        term: query, 
        max_results: maxResults,
        maxResults: maxResults
      }
    });

    ctx.body = { success: true, data: result.content };
    
  } catch (error) {
    // ... existing error handling ...
  }
});