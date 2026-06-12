/**
 * Resolves a reliable 3D structural coordinate URL for a given Accession (UniProt or PDB).
 * Prioritizes PDB codes, then AlphaFold DB, then SWISS-MODEL.
 * 
 * @param {string} accession - The UniProt accession (e.g., "O88844") or PDB ID (e.g., "1ABC").
 * @returns {Promise<{url: string, format: string, source: string}|null>}
 */
export async function resolveStructureUrl(accession) {
  if (!accession || !accession.trim()) {
    return null;
  }
  const cleanAccession = accession.trim();

  // 1. Detect PDB ID (4 characters, starts with a number usually, but let's be flexible)
  // Standard PDB IDs are 4 characters long.
  if (/^[0-9a-zA-Z]{4}$/.test(cleanAccession)) {
    console.log(`Resolving PDB ID: ${cleanAccession} via RCSB...`);
    return {
      url: `https://files.rcsb.org/download/${cleanAccession.toUpperCase()}.cif`,
      format: 'mmcif',
      source: 'RCSB PDB'
    };
  }

  // 2. Attempt Dynamic AlphaFold DB Lookup
  try {
    const afApiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${cleanAccession}`;
    const response = await fetch(afApiUrl);

    if (response.ok) {
      const data = await response.json();
      
      // Verify that AlphaFold has a valid prediction array for this accession
      if (data && data.length > 0 && data[0].cifUrl) {
        console.log(`Successfully resolved AlphaFold structure for ${cleanAccession}`);
        return {
          url: data[0].cifUrl, // Dynamically tracks current versions (e.g., _v6.cif)
          format: 'mmcif',
          source: 'AlphaFold'
        };
      }
    }
    console.warn(`AlphaFold DB does not contain a model for accession: ${cleanAccession}. Routing to SWISS-MODEL...`);
  } catch (error) {
    console.error(`AlphaFold API connection failure: ${error.message}. Routing to SWISS-MODEL...`);
  }

  // 3. Fallback to SWISS-MODEL Repository (SMR)
  try {
    const swissModelUrl = `https://swissmodel.expasy.org/repository/uniprot/${cleanAccession}.cif`;
    
    // Perform a quick HEAD or GET request to verify the file physically exists on SMR
    const smrCheck = await fetch(swissModelUrl, { method: 'HEAD' });

    if (smrCheck.ok) {
      console.log(`Successfully resolved SWISS-MODEL homology structure for ${cleanAccession}`);
      return {
        url: swissModelUrl,
        format: 'mmcif',
        source: 'SWISS-MODEL'
      };
    }
    
    throw new Error(`Asset not found on SMR (Status: ${smrCheck.status})`);
  } catch (fallbackError) {
    console.error(`Structure pipeline failed completely for ${cleanAccession}: ${fallbackError.message}`);
    return null;
  }
}
