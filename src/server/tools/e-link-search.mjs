// src/server/tools/e-link-search.mjs
import { checkDatabasesForPMID } from '../nihUtils/checkDatabasesForPMID.js';
import { getSequencesFromPMID } from '../nihUtils/getSequencesFromPMID.js';

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
    const sequenceIds = await getSequencesFromPMID(pmid, db);
    results[db] = sequenceIds;
    console.log(`      Found ${sequenceIds.length} sequence IDs in ${db}.`);
  }

  // 3. Output final data structure ready for BLAST
  console.log('\n--- Final Sequence IDs Ready for BLAST ---');
  console.log(JSON.stringify(results, null, 2));
}

// Run the script
main();
