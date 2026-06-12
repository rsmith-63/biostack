# Structure Fetching Pipeline: AlphaFold with SWISS-MODEL Fallback

This document outlines a resilient, zero-dependency JavaScript pipeline designed to retrieve 3D structural macromolecule coordinates (`.cif`) using a primary UniProt Accession ID. 

The pipeline avoids hardcoding static AlphaFold filenames (which frequently cause `NoSuchKey` errors due to database version increments) and implements a robust fallback strategy to the SWISS-MODEL Repository (SMR) if AlphaFold lacks a predicted model or experiences downtime.

## Data Flow Architecture

1. **Primary Try:** Query the dynamic AlphaFold API metadata endpoint. If a structure exists, extract the live `.cif` or optimized `.bcif` URL.
2. **Secondary Fallback:** If the AlphaFold API returns a 404, an empty array, or throws an error, construct a direct asset path to the SWISS-MODEL Repository.
3. **Viewer Delivery:** Pass the resolved URL and format metadata to the Mol* configuration handler.

---

## Code Implementation

```javascript
/**
 * Resolves a reliable 3D structural coordinate URL for a given UniProt Accession.
 * Prioritizes dynamic AlphaFold DB endpoints and falls back to SWISS-MODEL.
 * * @param {string} accession - The UniProt primary accession code (e.g., "O88844").
 * @returns {Promise<{url: string, format: 'mmcif', source: 'AlphaFold' | 'SWISS-MODEL'}|null>}
 */
async function resolveStructureUrl(accession) {
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

/**
 * Example Integration Handler for Mol* Viewer
 */
async function loadViewerStructure(accession, molStarPluginInstance) {
  const targetStructure = await resolveStructureUrl(accession);

  if (!targetStructure) {
    alert(`Could not retrieve any 3D structures for Accession: ${accession}`);
    return;
  }

  // Clear previous configurations from Mol* canvas
  await molStarPluginInstance.clear();

  // Download the coordinate payload resolved by the pipeline
  const data = await molStarPluginInstance.builders.data.download({ 
    url: targetStructure.url, 
    isBinary: false 
  });
  
  // Parse the structural trajectory using native mmcif specs
  const trajectory = await molStarPluginInstance.builders.structure.parseTrajectory(data, 'mmcif');
  await molStarPluginInstance.builders.structure.hierarchy.applyPreset(trajectory, 'default');
  
  console.log(`Mol* successfully rendered structure sourced from: ${targetStructure.source}`);
}