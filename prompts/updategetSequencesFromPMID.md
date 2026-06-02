# File: src/server/nihUtils/getSequencesFromPMID.js

```javascript
import { resolvePdbFromProteins } from './resolvePdbFromProteins.js';

/**
 * Fetches sequence IDs (Nucleotide) or resolved PDB structural codes (Protein) linked to a specific PMID.
 * * @param {string|number} pmid - The PubMed ID.
 * @param {string} targetDb - The target database: 'nuccore' (default) or 'protein'.
 * @returns {Promise<Array<string>>} - An array of nucleotide sequence IDs or resolved 4-letter PDB codes.
 */
export async function getSequencesFromPMID(pmid, targetDb = 'nuccore') {
  // We request JSON format to make parsing easier than NCBI's default XML
  const baseUrl = '[https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi)';
  const url = `${baseUrl}?dbfrom=pubmed&db=${targetDb}&id=${pmid}&retmode=json`;

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NCBI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse the JSON to extract the linked IDs
    const linkSets = data.linksets || [];
    if (linkSets.length === 0 || !linkSets[0].linksetdbs) {
      return []; // No linked sequences found
    }

    // Extract the array of IDs from the target database
    const linkedIds = linkSets[0].linksetdbs[0].links || [];
    
    // If protein targets are found, intercept and resolve directly to standard PDB codes for Mol* hydration
    if (targetDb === 'protein' && linkedIds.length > 0) {
      console.log(`[PMID Link] Found ${linkedIds.length} protein UIDs for PMID ${pmid}. Resolving to 3D structural codes...`);
      return await resolvePdbFromProteins(linkedIds);
    }

    return linkedIds;

  } catch (error) {
    console.error(`Failed to fetch sequences for PMID ${pmid}:`, error);
    return [];
  }
}

// Example usage within your Koa routing logic:
//
// 1. Fetching Nucleotide UIDs:
// const nucleotideIds = await getSequencesFromPMID('12345678', 'nuccore');
// console.log(nucleotideIds); // Output: ['1524312', '1524313']
//
// 2. Fetching Protein and automatically resolving down to ready-to-render PDB codes:
// const pdbCodes = await getSequencesFromPMID('12345678', 'protein');
// console.log(pdbCodes); // Output: ['6z1w', '7k39']
```