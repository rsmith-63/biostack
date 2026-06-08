import { robustNcbiFetch } from '../utils/ncbiFetcher.js';

/**
 * Checks all NCBI databases linked to a PMID and identifies those suitable for BLAST.
 * 
 * @param {string|number} pmid - The PubMed ID.
 * @returns {Promise<Object>} - Object containing all linked DBs and the BLAST-compatible ones.
 */
export async function checkDatabasesForPMID(pmid) {
  // BLAST operates on nucleotide and protein sequence databases
  const BLAST_COMPATIBLE_DBS = ['nuccore', 'protein', 'popset'];
  
  // cmd=acheck tells E-utilities to return the list of linked databases
  const baseUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi';
  const url = `${baseUrl}?dbfrom=pubmed&id=${pmid}&cmd=acheck&retmode=json`;

  try {
    const data = await robustNcbiFetch(url);
    
    const linkSets = data.linksets || [];
    // If there are no linksets, there are no linked databases
    if (linkSets.length === 0) {
      return { 
        pmid, 
        allLinkedDbs: [], 
        blastDbs: [] 
      };
    }

    let allLinkedDbs = [];
    
    // Support both linksetdbinfo (XML-like) and idchecklist (JSON) structures
    if (linkSets[0].linksetdbinfo) {
      allLinkedDbs = linkSets[0].linksetdbinfo.map(info => info.dbto);
    } else if (linkSets[0].idchecklist && linkSets[0].idchecklist.idlinksets) {
      const idLinkSet = linkSets[0].idchecklist.idlinksets.find(ls => ls.id === String(pmid));
      if (idLinkSet && idLinkSet.linkinfos) {
        allLinkedDbs = idLinkSet.linkinfos.map(info => info.dbto);
      }
    }

    // Intersect the available databases with our known BLAST databases
    // Use Set to ensure unique database names
    const uniqueDbs = [...new Set(allLinkedDbs)];
    const blastDbs = uniqueDbs.filter(db => BLAST_COMPATIBLE_DBS.includes(db));

    return {
      pmid,
      allLinkedDbs: uniqueDbs,
      blastDbs
    };

  } catch (error) {
    console.error(`Failed to check databases for PMID ${pmid}:`, error);
    return { pmid, allLinkedDbs: [], blastDbs: [] };
  }
}
