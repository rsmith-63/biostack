// src/server/tools/resolve-pdb.mjs
import { resolvePdbFromProteins } from '../nihUtils/resolvePdbFromProteins.js';

async function main() {
  // Protein UIDs from command line or default test IDs
  // Example IDs: ["2105716873", "2105716870"]
  const proteinUids = process.argv.slice(2);
  
  if (proteinUids.length === 0) {
    console.log('Usage: node src/server/tools/resolve-pdb.mjs <proteinUid1> <proteinUid2> ...');
    console.log('Example: node src/server/tools/resolve-pdb.mjs 2105716873 2105716870');
    return;
  }

  console.log(`\n--- Resolving PDB IDs for Protein UIDs: ${proteinUids.join(', ')} ---\n`);

  const pdbCodes = await resolvePdbFromProteins(proteinUids);

  if (pdbCodes.length > 0) {
    console.log('\n--- Resolved PDB Accessions ---');
    console.log(JSON.stringify(pdbCodes, null, 2));
    console.log(`\nTotal unique PDB codes found: ${pdbCodes.length}`);
  } else {
    console.log('\nNo PDB accessions found for these protein IDs.');
  }
}

main();
