// src/server/tools/e-link-search.mjs
import { checkDatabasesForPMID } from '../nihUtils/checkDatabasesForPMID.js';
import { getSequencesFromPMID, mapPmidToUniprot } from '../nihUtils/getSequencesFromPMID.js';
import { resolveStructureUrl } from '../../client/utils/structureResolver.js';

// ==========================================
// Main Execution Logic
// ==========================================
async function main() {
  // Get PMID from command line argument, or use a default test PMID
  const pmid = process.argv[2] || '40796139'; // Replace with a relevant PMID for testing

  console.log(`\n--- Starting NCBI Link Check for PMID: ${pmid} ---\n`);

  // 1. Check for available databases
  console.log('1. Checking for linked databases...');
  const dbInfo = await checkDatabasesForPMID(pmid);
  
  console.log(`   All linked databases: ${dbInfo.allLinkedDbs.join(', ') || 'None'}`);
  console.log(`   BLAST-compatible databases found: ${dbInfo.blastDbs.join(', ') || 'None'}\n`);

  if (dbInfo.blastDbs.length === 0) {
    console.log('No BLAST-compatible databases found. Exiting.');
    return;
  }

  // 2. Fetch sequences for each BLAST-compatible database
  console.log('2. Fetching sequence IDs for BLAST-compatible databases...');
  
  const results = {};

  for (const db of dbInfo.blastDbs) {
    console.log(`   -> Fetching from '${db}'...`);
    // Use the DB found in step 1 as the target for step 2
    // Note: getSequencesFromPMID automatically resolves protein UIDs to PDB codes
    let ids = await getSequencesFromPMID(pmid, db);
    
    if (db === 'protein') {
      if (Array.isArray(ids) && ids.length > 0) {
        results.pdb = ids;
        console.log(`      Found ${ids.length} resolved PDB structural codes.`);
      } else {
        // Fallback: If no direct links, try UniProt mapping + structureResolver
        let uniprotId = (ids && typeof ids === 'object') ? ids.uniprot_id : null;
        
        if (!uniprotId) {
          console.log(`      No direct structure links. Attempting UniProt mapping for ${pmid}...`);
          uniprotId = await mapPmidToUniprot(pmid);
        }

        if (uniprotId) {
          console.log(`      Enhancing resolution for UniProt ID: ${uniprotId}...`);
          const enhanced = await resolveStructureUrl(uniprotId);
          if (enhanced) {
            results.structure = {
              uniprot_id: uniprotId,
              ...enhanced
            };
            console.log(`      Successfully resolved ${enhanced.source} structure.`);
          } else {
            results.structure = (ids && typeof ids === 'object' && ids.source) ? ids : { uniprot_id: uniprotId };
            console.log(`      Using basic UniProt link for ${uniprotId}.`);
          }
        } else {
          results.pdb = [];
          console.log(`      No structural data found for protein links.`);
        }
      }
    } else {
      results[db] = ids;
      console.log(`      Found ${ids.length} sequence IDs in ${db}.`);
    }
  }

  // 3. Output final data structure
  console.log('\n--- Final Data Structure ---');
  console.log(JSON.stringify(results, null, 2));
}

// Run the script
main();
