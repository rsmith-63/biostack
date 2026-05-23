/**
 * Fetches sequence IDs (Nucleotide or Protein) linked to a specific PMID.
 * 
 * @param {string|number} pmid - The PubMed ID.
 * @param {string} targetDb - The target database: 'nuccore' (default) or 'protein'.
 * @returns {Promise<Array<string>>} - An array of sequence IDs.
 */

export async function getSequencesFromPMID(pmid, targetDb = 'nuccore') {
  // We request JSON format to make parsing easier than NCBI's default XML
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
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
    const linkedIds = linkSets[0].linksetdbs[0].links;
    return linkedIds || [];

  } catch (error) {
    console.error(`Failed to fetch sequences for PMID ${pmid}:`, error);
    return [];
  }
}

// Example usage within your Koa routing logic:
// const sequenceIds = await getSequencesFromPMID('12345678', 'nuccore');
// console.log(sequenceIds); // Output: ['1524312', '1524313']