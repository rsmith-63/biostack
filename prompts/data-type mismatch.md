# Task: Fix PMID Data Type for pubmed_fetch_contents

**Objective:** Convert the array of numerical PMIDs to an array of strings to satisfy the strict input validation of the `pubmed_fetch_contents` tool.

## File to Update
**Path:** `/Users/robsmith/biostack/server/src/api/pubmed.js`

## Instructions for Agent
Locate the section where `pubmed_fetch_contents` (or your fetch tool) is called and update the `arguments` to transform the `pmids` array.

## Implementation Fix

```javascript
// ... inside the /api/pubmed/search route ...

    // Extract the PMIDs from the search results
    const searchData = JSON.parse(searchText);
    const rawPmids = searchData.pmids || [];

    if (!rawPmids || rawPmids.length === 0) {
      ctx.body = { success: true, data: [] };
      return;
    }

    // --- THE FIX: Convert numbers to strings ---
    const stringPmids = rawPmids.map(id => String(id));

    // STEP 2: Call the fetch tool using the converted strings
    const fetchResponse = await mcpClient.callTool({
      name: "pubmed_fetch_contents", // Updated to match your specific tool name
      arguments: { 
        pmids: stringPmids 
      }
    });

    const fetchText = fetchResponse.content[0].text;
// ... rest of the logic ...