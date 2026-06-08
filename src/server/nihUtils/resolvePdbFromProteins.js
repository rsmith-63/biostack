import { robustNcbiFetch } from '../utils/ncbiFetcher.js';

/**
 * Resolves 4-letter PDB codes from an array of NCBI Protein UIDs
 * @param {string[]} proteinUids - Array of protein IDs (e.g., ["2105716873", "2105716870"])
 * @returns {Promise<string[]>} Array of unique, lower-cased PDB codes clean for Mol*
 */
export async function resolvePdbFromProteins(proteinUids) {
  if (!proteinUids || proteinUids.length === 0) {
    console.warn('resolvePdbFromProteins called with an empty protein array.');
    return [];
  }

  // Use a chunk size to avoid 414 (URI Too Large) or timeout errors from NCBI
  const CHUNK_SIZE = 500;
  const uniquePdbAccessions = new Set();

  for (let i = 0; i < proteinUids.length; i += CHUNK_SIZE) {
    const chunk = proteinUids.slice(i, i + CHUNK_SIZE);
    const ids = chunk.join(',');

    console.log(`      [Structural Resolution] Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(proteinUids.length / CHUNK_SIZE)}...`);

    try {
      // Step 1: E-link Protein UIDs -> PDB UIDs
      const url = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
      const linkData = await robustNcbiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          dbfrom: 'protein',
          db: 'pdb',
          id: ids,
          retmode: 'json'
        })
      });

      const pdbUids = [];
      linkData.linksets?.forEach(linkset => {
        const pdbLink = linkset.linksetdbs?.find(db => db.dbto === 'pdb');
        if (pdbLink && pdbLink.links) {
          pdbUids.push(...pdbLink.links);
        }
      });

      if (pdbUids.length === 0) continue;

      // Step 2: E-summary to get the 4-letter PDB accessions from the PDB UIDs
      const summaryUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi';
      const summaryData = await robustNcbiFetch(summaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          db: 'pdb',
          id: pdbUids.join(','),
          retmode: 'json'
        })
      });

      // Extract and format the accessions
      pdbUids.forEach(uid => {
        const accession = summaryData.result[uid]?.accession;
        if (accession) {
          // Format should be 4-letter code, lowercased for consistency
          uniquePdbAccessions.add(accession.toLowerCase());
        }
      });

    } catch (error) {
      console.error(`      [Structural Resolution] Error processing chunk: ${error.message}`);
    }
  }

  const finalCodes = Array.from(uniquePdbAccessions);
  console.log(`      [Structural Resolution] Found ${finalCodes.length} PDB structure codes.`);
  return finalCodes;
}
