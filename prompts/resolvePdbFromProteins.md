# File: src/server/nihUtils/resolvePdbFromProteins.js

```javascript
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

  const ids = proteinUids.join(',');
  
  try {
    // Step 1: E-link Protein UIDs -> PDB UIDs
    const linkRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi?dbfrom=protein&db=pdb&id=${ids}&retmode=json`);
    const linkData = await linkRes.json();
    
    const pdbUids = [];
    linkData.linksets?.forEach(linkset => {
      const pdbLink = linkset.linksetdbs?.find(db => db.dbto === 'pdb');
      if (pdbLink && pdbLink.links) {
        pdbUids.push(...pdbLink.links);
      }
    });

    if (pdbUids.length === 0) {
      console.log('No cross-referenced PDB records found for the provided protein UIDs.');
      return [];
    }

    // Step 2: E-summary to get the 4-letter PDB accessions from the PDB UIDs
    const summaryRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pdb&id=${pdbUids.join(',')}&retmode=json`);
    const summaryData = await summaryRes.json();
    
    // Explicitly logging the deep summary data payload for debugging
    console.log('\n========== NCBI E-SUMMARY DATA START ==========');
    console.dir(summaryData, { depth: null, colors: true });
    console.log('========== NCBI E-SUMMARY DATA END ============\n');
    
    // Extract and format the accessions
    const pdbAccessions = pdbUids.map(uid => {
      const accession = summaryData.result[uid]?.accession;
      return accession ? accession.split('_')[0].toLowerCase() : null; 
    }).filter(Boolean);
    
    return [...new Set(pdbAccessions)];

  } catch (error) {
    console.error('Error resolving PDB structural IDs from NCBI sequence context:', error);
    return [];
  }
}
```