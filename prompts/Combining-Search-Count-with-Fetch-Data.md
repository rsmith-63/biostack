# 🛠️ Fixing the PubMed Controller: Combining Search Count with Fetch Data

This document outlines the required changes to the Koa backend controller to ensure the frontend receives both the `totalCount` of available articles and the rich metadata for the current pagination batch.

## The Problem

The `@iflow-mcp/pubmed-mcp-server` mirrors the NCBI E-utilities architecture, which splits querying into two distinct phases:
1.  **Search Phase (`pubmed_search_articles`):** Returns the total number of hits (`count`) and a list of IDs (`pmids`).
2.  **Fetch Phase (`pubmed_fetch_contents`):** Takes a list of IDs and returns the actual article text (Title, Abstract, etc.).

If the Koa controller only returns the result of the Fetch phase, the `count` is lost, breaking client-side pagination.

## The Solution: Controller Data Merging

We must execute the tools sequentially, capture the `count` from the first execution, and inject it into the final response payload alongside the data from the second execution.

### Updated Controller Code (`src/controllers/pubmedController.js`)

Replace your existing search function with the following implementation:

```javascript
import { mcpClient } from '../services/mcpClient.js'; // Adjust path to your MCP client instance

/**
 * Executes a two-step MCP workflow to retrieve PubMed articles along with the total search hit count.
 * @route GET /api/pubmed/search?queryTerm=...
 */
export const getArticlesWithCount = async (ctx) => {
  const { queryTerm } = ctx.query;

  if (!queryTerm) {
    ctx.status = 400;
    ctx.body = { error: "queryTerm is required" };
    return;
  }

  try {
    // =========================================================
    // STEP 1: Execute the Search Tool
    // Objective: Get the total count and the first batch of PMIDs
    // =========================================================
    const searchResponse = await mcpClient.callTool("pubmed_search_articles", { 
      queryTerm: queryTerm, 
      maxResults: 10 // Page size for the initial load
    });
    
    // The MCP server wraps the JSON inside a text block in the content array
    const searchResults = JSON.parse(searchResponse.content[0].text);
    
    // 🛑 CAPTURE THE COUNT HERE
    const totalCount = searchResults.count; 
    const pmidsToFetch = searchResults.pmids;

    // Handle edge case: No results found
    if (!pmidsToFetch || pmidsToFetch.length === 0) {
      ctx.body = {
        success: true,
        totalCount: 0,
        data: []
      };
      return;
    }

    // =========================================================
    // STEP 2: Execute the Fetch Tool
    // Objective: Get the abstracts and metadata for the retrieved PMIDs
    // =========================================================
    const fetchResponse = await mcpClient.callTool("pubmed_fetch_contents", { 
      pmids: pmidsToFetch 
    });
    
    const fetchResults = JSON.parse(fetchResponse.content[0].text);

    // =========================================================
    // STEP 3: Construct the Merged Response
    // =========================================================
    ctx.body = {
      success: true,
      totalCount: totalCount,           // Injected from Step 1
      data: fetchResults.articles       // Injected from Step 2
    };

  } catch (error) {
    console.error("[MCP Error] PubMed Workflow Failed:", error);
    ctx.status = 500;
    ctx.body = { 
      success: false, 
      error: "Failed to communicate with PubMed MCP server",
      details: error.message 
    };
  }
};