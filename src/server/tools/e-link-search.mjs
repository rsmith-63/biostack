// src/server/tools/e-link-search.mjs
import { checkDatabasesForPMID } from '../nihUtils/checkDatabasesForPMID.js';
import { getSequencesFromPMID, mapPmidToUniprot } from '../nihUtils/getSequencesFromPMID.js';
import { resolveStructureUrl } from '../../client/utils/structureResolver.js';
import { fileURLToPath } from 'url';

// ==========================================
// Core Search Logic (Exported for Koa)
// ==========================================
/**
 * Orchestrates a complete linkage and structural check for a given PMID.
 * @param {string} pmid - The PubMed ID.
 * @returns {Promise<Object>} The resolved structural and database linkage data.
 */
export async function runLinkSearch(pmid) {
  const dbInfo = await checkDatabasesForPMID(pmid);
  
  const results = {
    pmid,
    allLinkedDbs: dbInfo.allLinkedDbs,
    blastDbs: dbInfo.blastDbs
  };

  if (dbInfo.blastDbs.length === 0) {
    return results;
  }

  for (const db of dbInfo.blastDbs) {
    // Note: getSequencesFromPMID automatically resolves protein UIDs to PDB codes or structures
    let ids = await getSequencesFromPMID(pmid, db);
    
    if (db === 'protein') {
      if (Array.isArray(ids) && ids.length > 0) {
        results.pdb = ids;
      } else {
        // Fallback: If no direct links, try UniProt mapping + structureResolver
        let uniprotId = (ids && typeof ids === 'object') ? ids.uniprot_id : null;
        
        if (!uniprotId) {
          uniprotId = await mapPmidToUniprot(pmid);
        }

        if (uniprotId) {
          const enhanced = await resolveStructureUrl(uniprotId);
          if (enhanced) {
            results.structure = {
              uniprot_id: uniprotId,
              ...enhanced
            };
          } else {
            results.structure = (ids && typeof ids === 'object' && ids.source) ? ids : { uniprot_id: uniprotId };
          }
        } else {
          results.pdb = [];
        }
      }
    } else {
      results[db] = ids;
    }
  }

  return results;
}

// ==========================================
// CLI Execution Logic
// ==========================================
async function main() {
  // Get PMID from command line argument, or use a default test PMID
  const pmid = process.argv[2] || '40796139'; 

  console.log(`\n--- Starting NCBI Link Check for PMID: ${pmid} ---\n`);

  const results = await runLinkSearch(pmid);

  console.log(`   All linked databases: ${results.allLinkedDbs.join(', ') || 'None'}`);
  console.log(`   BLAST-compatible databases found: ${results.blastDbs.join(', ') || 'None'}\n`);

  // Output final data structure
  console.log('\n--- Final Data Structure ---');
  console.log(JSON.stringify(results, null, 2));
}

// Run the script ONLY if executed directly from CLI
const nodePath = fileURLToPath(import.meta.url);
if (process.argv[1] === nodePath) {
  main();
}
