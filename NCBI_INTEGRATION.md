# 🧬 NCBI Sequence Viewer & MCP Integration

This document outlines the end-to-end implementation for querying gene sequences via the NCBI MCP server and displaying the resulting protein domains in a client-side React application.

## 1. Backend: Zod Validation & Koa Controller (`src/controllers/ncbiController.js`)

To ensure the MCP server receives clean, safe data, we use Zod to validate and sanitize the incoming request before it hits the tool execution layer.

```javascript
import { z } from 'zod';
import { searchNcbi, fetchRecords } from '../services/mcpService.js';

// Strict validation schema for the incoming gene query
const GeneQuerySchema = z.object({
  geneSymbol: z.string()
    .min(1, "Gene symbol is required")
    .max(20, "Gene symbol is too long")
    .regex(/^[a-zA-Z0-9-]+$/, "Invalid characters in gene symbol")
    .transform(val => val.toUpperCase()), // Standardize for NCBI
  organism: z.string()
    .default('human')
    .transform(val => val.toLowerCase())
});

export const getProteinData = async (ctx) => {
  try {
    // Validate and parse the query parameters
    const { geneSymbol, organism } = GeneQuerySchema.parse(ctx.query);

    // 1. Search for mRNA Accession ID using the MCP wrapper
    const searchTerm = `${geneSymbol}[GENE] AND ${organism}[ORGN] AND mrna[PROP]`;
    const searchResult = await searchNcbi('nucleotide', searchTerm);
    
    if (!searchResult.ids || searchResult.ids.length === 0) {
      ctx.status = 404;
      ctx.body = { error: 'No mRNA sequence found for this gene.' };
      return;
    }

    const mrnaId = searchResult.ids[0];

    // 2. Fetch GenBank record to extract the Protein ID
    const record = await fetchRecords('nuccore', [mrnaId], 'gb');
    
    // Extract /protein_id="NP_XXXXXX" from the GenBank text
    const proteinIdMatch = record.match(/\/protein_id="([^"]+)"/);
    const proteinId = proteinIdMatch ? proteinIdMatch[1] : null;

    if (!proteinId) {
      ctx.status = 404;
      ctx.body = { error: 'Protein translation not found in mRNA record.' };
      return;
    }

    ctx.body = {
      success: true,
      data: { mrnaId, proteinId }
    };

  } catch (err) {
    if (err instanceof z.ZodError) {
      ctx.status = 400;
      ctx.body = { error: "Validation failed", details: err.errors };
    } else {
      ctx.status = 500;
      ctx.body = { error: err.message };
    }
  }
};