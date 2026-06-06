# Sequence and Structure Fetcher (Node.js)

This module provides the `getSequencesFromPMID` function using standard JavaScript and the native Node.js `fetch` API. It resolves a PubMed ID (PMID) to a UniProt accession number, attempts to find an experimental structure in the Protein Data Bank (PDB), and falls back to the AlphaFold Protein Structure Database if no PDB entry exists.

## Requirements

- Node.js v18.0.0 or higher (Tested for v24.11.0). 
- No external dependencies are required.

## Implementation

Create a file named `fetcher.js` and add the following code:

```javascript
/**
 * Maps a PubMed ID to a UniProt Accession using the UniProt REST API.
 * @param {string} pmid - The PubMed ID.
 * @returns {Promise<string|null>} The primary UniProt accession, or null if not found.
 */
async function mapPmidToUniprot(pmid) {
    const url = `https://rest.uniprot.org/uniprotkb/search?query=(lit_pubmed:${pmid})&format=json`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            // Return the primary UniProt accession of the first result
            return data.results[0].primaryAccession;
        }
    } catch (error) {
        console.error(`Error mapping PMID to UniProt: ${error.message}`);
    }
    
    return null;
}

/**
 * Checks if there are PDB structures associated with the UniProt ID.
 * @param {string} uniprotId - The UniProt accession number.
 * @returns {Promise<Object|null>} The PDB data payload, or null if not found.
 */
async function fetchFromPdb(uniprotId) {
    // Query RCSB PDB for entries linked to this UniProt ID
    const url = `https://data.rcsb.org/rest/v1/core/uniprot/${uniprotId}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data.reference_id) {
                console.log(`Structure found in PDB for UniProt ${uniprotId}.`);
                return { source: "PDB", uniprot_id: uniprotId, data: data };
            }
        }
    } catch (error) {
        console.error(`Error querying PDB: ${error.message}`);
    }
    
    return null;
}

/**
 * Fetches the predicted structure from the AlphaFold database.
 * @param {string} uniprotId - The UniProt accession number.
 * @returns {Promise<Object|null>} The AlphaFold data payload, or null if not found.
 */
async function fetchFromAlphafold(uniprotId) {
    const url = `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
                console.log(`Structure found in AlphaFold for UniProt ${uniprotId}.`);
                return { source: "AlphaFold", uniprot_id: uniprotId, data: data[0] };
            }
        }
    } catch (error) {
        console.error(`Error querying AlphaFold: ${error.message}`);
    }
    
    return null;
}

/**
 * Main function to get sequence/structure data from a PMID.
 * Attempts PDB first, falls back to AlphaFold.
 * @param {string} pmid - The PubMed ID.
 * @returns {Promise<Object|null>} The structure payload and source.
 */
async function getSequencesFromPMID(pmid) {
    console.log(`Processing PMID: ${pmid}`);
    
    // Step 1: Resolve PMID to UniProt ID
    const uniprotId = await mapPmidToUniprot(pmid);
    if (!uniprotId) {
        console.log("No UniProt ID found associated with this PMID.");
        return null;
    }
    
    console.log(`Resolved PMID ${pmid} to UniProt ID: ${uniprotId}`);
    
    // Step 2: Try PDB
    let structureData = await fetchFromPdb(uniprotId);
    
    // Step 3: Fallback to AlphaFold if nothing is found in PDB
    if (!structureData) {
        console.log("No structure found in PDB. Initiating AlphaFold fallback...");
        structureData = await fetchFromAlphafold(uniprotId);
    }
    
    if (!structureData) {
        console.log("No structure found in either PDB or AlphaFold.");
    }
    
    return structureData;
}

// ==========================================
// Example Usage
// ==========================================
(async () => {
    // Example PMID (replace with your target PMID)
    const targetPmid = "11331580"; 
    
    const result = await getSequencesFromPMID(targetPmid);
    
    if (result) {
        console.log(`\nSuccessfully retrieved data from: ${result.source}`);
        // console.log(JSON.stringify(result.data, null, 2)); // Uncomment to see the full JSON payload
    }
})();