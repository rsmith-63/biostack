# Task: Implement Query Sanitization for PubMed Searches

**Objective:** Add a sanitization layer to the Koa search route to process incoming query strings. This prevents syntax collisions (such as `+` characters being read as literals) when querying the NCBI MCP server.

## File to Update
**Path:** `/Users/robsmith/biostack/server/src/api/pubmed.js`

## Instructions for Agent
1. Locate the `/api/pubmed/search` POST route.
2. Find the section where `query` is extracted from `ctx.request.body`.
3. Insert a new sanitization variable `cleanQuery` immediately after validation.
4. Update the `pubmed_search` tool call to use `cleanQuery` instead of the raw `query`.

## Code Implementation

```javascript
// ... inside router.post('/api/pubmed/search', ...)

    const { query, maxResults } = ctx.request.body;

    if (!query) {
      ctx.status = 400;
      ctx.body = { success: false, message: "Query is required" };
      return;
    }

    // --- NEW: SANITIZATION LAYER ---
    // 1. Replace all '+' characters with standard spaces
    // 2. Decode any other URL-encoded characters (e.g., %20, %22)
    // 3. Trim leading/trailing whitespace
    const cleanQuery = decodeURIComponent(query.replace(/\+/g, ' ')).trim();

    // ... continue to tool execution ...

    const searchResponse = await mcpClient.callTool({
      name: "pubmed_search", // (or your specific tool name)
      arguments: { 
        // USE THE SANITIZED QUERY HERE
        query: cleanQuery, 
        max_results: maxResults || 10 
      }
    });

// ... rest of the route remains unchanged ...