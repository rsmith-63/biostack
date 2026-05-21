# BLAST Results Logger Implementation

This guide outlines how to implement the Top-Hit Convention for logging your BLAST results.

## 1. Create the Utility Function
Create a new file at `utils/save-blast-results.mjs`. This function ensures the `blast_results` directory exists, extracts the top hit, and formats the filename according to your convention.

```javascript
// utils/save-blast-results.mjs
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

/**
 * Saves BLAST JSON results using the Top-Hit Convention.
 * Format: {TopHitAccession}_{Program}_{Database}_{Timestamp}.json
 * 
 * @param {Object} blastData - The parsed JSON response from the BLAST API.
 * @param {string} program - The BLAST program used (e.g., 'blastn').
 * @param {string} database - The database searched against (e.g., 'nt').
 * @returns {Promise<string>} - The path to the saved file.
 */
export async function saveBlastResults(blastData, program, database) {
  const resultsDir = path.join(process.cwd(), 'blast_results');
  
  // Ensure the blast_results directory exists
  await mkdir(resultsDir, { recursive: true });

  const timestamp = Math.floor(Date.now() / 1000); // Standard UNIX timestamp
  let topHitAccession = 'NoHits';

  // Navigate standard NCBI BLAST JSON structure to find the top hit
  // Adjust the object path if your API returns a flattened/custom structure
  try {
    const searchResults = blastData?.BlastOutput2?.[0]?.report?.results?.search || blastData;
    const hits = searchResults.hits || [];

    if (hits.length > 0) {
      // Prioritize the description's accession, fallback to direct accession property
      topHitAccession = hits[0]?.description?.[0]?.accession || hits[0]?.accession || 'UnknownHit';
    }
  } catch (error) {
    console.warn('Warning: Could not parse hits array. Falling back to NoHits.');
  }

  const filename = `${topHitAccession}_${program}_${database}_${timestamp}.json`;
  const filepath = path.join(resultsDir, filename);

  // Write the results to disk, beautifully formatted
  await writeFile(filepath, JSON.stringify(blastData, null, 2), 'utf8');
  console.log(`[SUCCESS] BLAST results saved to: ${filepath}`);

  return filepath;
}