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
      // Respect NCBI's rate limit of 3 requests per second without an API key
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 350)); 
      }

      // Step 1: E-link Protein UIDs -> PDB UIDs
      // Using POST is safer for large numbers of IDs
      const linkRes = await fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          dbfrom: 'protein',
          db: 'pdb',
          id: ids,
          retmode: 'json'
        })
      });

      if (!linkRes.ok) {
        console.error(`elink error: ${linkRes.status} ${linkRes.statusText}`);
        continue;
      }

      const linkText = await linkRes.text();
      // Sanitize control characters (U+0000 to U+001F) that break JSON.parse
      const cleanLinkText = linkText.replace(/[\x00-\x1F]+/g, " ");
      const linkData = JSON.parse(cleanLinkText);

      const pdbUids = [];
      linkData.linksets?.forEach(linkset => {
        const pdbLink = linkset.linksetdbs?.find(db => db.dbto === 'pdb');
        if (pdbLink && pdbLink.links) {
          pdbUids.push(...pdbLink.links);
        }
      });

      if (pdbUids.length === 0) continue;

      // Step 2: E-summary to get the 4-letter PDB accessions from the PDB UIDs
      // Also using POST here for consistency and safety
      const summaryRes = await fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          db: 'pdb',
          id: pdbUids.join(','),
          retmode: 'json'
        })
      });

      if (!summaryRes.ok) {
        console.error(`esummary error: ${summaryRes.status} ${summaryRes.statusText}`);
        continue;
      }

      const summaryText = await summaryRes.text();
      const cleanSummaryText = summaryText.replace(/[\x00-\x1F]+/g, " ");
      const summaryData = JSON.parse(cleanSummaryText);
      
      // Extract and format the accessions
      pdbUids.forEach(uid => {
        const accession = summaryData.result[uid]?.accession;
        if (accession) {
          uniquePdbAccessions.add(accession.split('_')[0].toLowerCase());
        }
      });

    } catch (error) {
      console.error('Error resolving PDB structural IDs from NCBI sequence context (chunked):', error);
    }
  }
  
  return [...uniquePdbAccessions];
}
