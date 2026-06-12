import { resolvePdbFromProteins } from './resolvePdbFromProteins.js';
import { robustNcbiFetch } from '../utils/ncbiFetcher.js';

/**
 * Maps a PubMed ID to a UniProt Accession using the UniProt REST API.
 * @param {string} pmid - The PubMed ID.
 * @returns {Promise<string|null>} The primary UniProt accession, or null if not found.
 */
export async function mapPmidToUniprot(pmid) {
  const url = `https://rest.uniprot.org/uniprotkb/search?query=(lit_pubmed:${pmid})&format=json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`UniProt API error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      return data.results[0].primaryAccession;
    }
  } catch (error) {
    console.error(`Error mapping PMID ${pmid} to UniProt: ${error.message}`);
  }
  return null;
}

/**
 * Checks if there are PDB structures associated with the UniProt ID.
 * @param {string} uniprotId - The UniProt accession number.
 * @returns {Promise<Object|null>} The PDB data payload, or null if not found.
 */
async function fetchFromPdb(uniprotId) {
  const url = `https://data.rcsb.org/rest/v1/core/uniprot/${uniprotId}`;
  try {
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data.reference_id) {
        return { source: "PDB", uniprot_id: uniprotId, data: data };
      }
    }
  } catch (error) {
    console.error(`Error querying PDB for UniProt ${uniprotId}: ${error.message}`);
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
        return { source: "AlphaFold", uniprot_id: uniprotId, data: data[0] };
      }
    }
  } catch (error) {
    console.error(`Error querying AlphaFold for UniProt ${uniprotId}: ${error.message}`);
  }
  return null;
}

/**
 * Fetches sequence IDs (Nucleotide) or resolved structural data (Protein) linked to a specific PMID.
 * @param {string|number} pmid - The PubMed ID.
 * @param {string} targetDb - The target database: 'nuccore' (default) or 'protein'.
 * @returns {Promise<Array<string>|Object|null>} - Nucleotide IDs (Array), PDB codes (Array), or Structure Object.
 */
export async function getSequencesFromPMID(pmid, targetDb = 'nuccore') {
  if (targetDb === 'nuccore') {
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
    const url = `${baseUrl}?dbfrom=pubmed&db=nuccore&id=${pmid}&retmode=json`;

    try {
      const data = await robustNcbiFetch(url);
      const linkSets = data.linksets || [];
      if (linkSets.length === 0 || !linkSets[0].linksetdbs) {
        return [];
      }
      return linkSets[0].linksetdbs[0].links || [];
    } catch (error) {
      console.error(`Failed to fetch sequences for PMID ${pmid}:`, error);
      return [];
    }
  }

  if (targetDb === 'protein') {
    console.log(`[Structural Resolution] Processing PMID: ${pmid}`);
    
    // Step 1: Try NCBI Protein -> PDB flow first
    const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
    const url = `${baseUrl}?dbfrom=pubmed&db=protein&id=${pmid}&retmode=json`;
    
    let linkedIds = [];
    try {
      const data = await robustNcbiFetch(url);
      const linkSets = data.linksets || [];
      if (linkSets.length > 0 && linkSets[0].linksetdbs) {
        linkedIds = linkSets[0].linksetdbs[0].links || [];
      }
    } catch (error) {
      console.error(`NCBI link fetch failed for protein: ${error.message}`);
    }

    if (linkedIds.length > 0) {
      const pdbCodes = await resolvePdbFromProteins(linkedIds);
      if (pdbCodes.length > 0) {
        return pdbCodes;
      }
    }

    // Step 2: Fallback to UniProt -> PDB/AlphaFold flow
    console.log(`No direct NCBI PDB links found for PMID ${pmid}. Trying UniProt/AlphaFold fallback...`);
    const uniprotId = await mapPmidToUniprot(pmid);
    if (!uniprotId) {
      return [];
    }

    let structureData = await fetchFromPdb(uniprotId);
    if (!structureData) {
      structureData = await fetchFromAlphafold(uniprotId);
    }

    return structureData || [];
  }

  return [];
}
