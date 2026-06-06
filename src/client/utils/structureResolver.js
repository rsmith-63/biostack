/**
 * Resolves a reliable 3D structural coordinate URL for a given UniProt Accession.
 * Prioritizes dynamic AlphaFold DB endpoints and falls back to SWISS-MODEL.
 * 
 * @param {string} accession - The UniProt primary accession code (e.g., "O88844").
 * @returns {Promise<{url: string, format: 'mmcif', source: 'AlphaFold' | 'SWISS-MODEL'}|null>}
 */
export async function resolveStructureUrl(accession) {
  if (!accession) {
    console.error("No accession provided to structure resolver.");
    return null;
  }

  // 1. Attempt Dynamic AlphaFold DB Lookup
  try {
    const afApiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${accession}`;
    const response = await fetch(afApiUrl);

    if (response.ok) {
      const data = await response.json();
      
      // Verify that AlphaFold has a valid prediction array for this accession
      if (data && data.length > 0 && data[0].cifUrl) {
        console.log(`Successfully resolved AlphaFold structure for ${accession}`);
        return {
          url: data[0].cifUrl, // Dynamically tracks current versions (e.g., _v6.cif)
          format: 'mmcif',
          source: 'AlphaFold'
        };
      }
    }
    console.warn(`AlphaFold DB does not contain a model for accession: ${accession}. Routing to SWISS-MODEL...`);
  } catch (error) {
    console.error(`AlphaFold API connection failure: ${error.message}. Routing to SWISS-MODEL...`);
  }

  // 2. Fallback to SWISS-MODEL Repository (SMR)
  try {
    const swissModelUrl = `https://swissmodel.expasy.org/repository/uniprot/${accession}.cif`;
    
    // Perform a quick HEAD or GET request to verify the file physically exists on SMR
    const smrCheck = await fetch(swissModelUrl, { method: 'HEAD' });

    if (smrCheck.ok) {
      console.log(`Successfully resolved SWISS-MODEL homology structure for ${accession}`);
      return {
        url: swissModelUrl,
        format: 'mmcif',
        source: 'SWISS-MODEL'
      };
    }
    
    throw new Error(`Asset not found on SMR (Status: ${smrCheck.status})`);
  } catch (fallbackError) {
    console.error(`Structure pipeline failed completely for ${accession}: ${fallbackError.message}`);
    return null;
  }
}
