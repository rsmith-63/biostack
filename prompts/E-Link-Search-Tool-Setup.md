# NCBI E-Link Search Tool Setup

This document provides the code to create the `e-link-search.mjs` script in your `tools` directory and the configuration to run it via VS Code's `launch.json`.

## 1. Create `tools/e-link-search.mjs`

Create a file named `e-link-search.mjs` inside your `tools/` directory and paste the following code. This script uses native `fetch` (requires Node.js 18+) to first check for BLAST-compatible databases, and then fetches the sequence IDs from those databases.

```javascript
// tools/e-link-search.mjs

/**
 * Checks all NCBI databases linked to a PMID and identifies those suitable for BLAST.
 * @param {string|number} pmid - The PubMed ID.
 * @returns {Promise<Object>}
 */
async function checkDatabasesForPMID(pmid) {
  const BLAST_COMPATIBLE_DBS = ['nuccore', 'protein', 'popset'];
  const baseUrl = '[https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi)';
  const url = `${baseUrl}?dbfrom=pubmed&id=${pmid}&cmd=acheck&retmode=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`NCBI API error: ${response.status} ${response.statusText}`);

    const data = await response.json();
    const linkSets = data.linksets || [];
    
    if (linkSets.length === 0 || !linkSets[0].linksetdbinfo) {
      return { pmid, allLinkedDbs: [], blastDbs: [] };
    }

    const allLinkedDbs = linkSets[0].linksetdbinfo.map(info => info.dbto);
    const blastDbs = allLinkedDbs.filter(db => BLAST_COMPATIBLE_DBS.includes(db));

    return { pmid, allLinkedDbs, blastDbs };
  } catch (error) {
    console.error(`Failed to check databases for PMID ${pmid}:`, error.message);
    return { pmid, allLinkedDbs: [], blastDbs: [] };
  }
}

/**
 * Fetches sequence IDs (Nucleotide or Protein) linked to a specific PMID.
 * @param {string|number} pmid - The PubMed ID.
 * @param {string} targetDb - The target database (e.g., 'nuccore', 'protein').
 * @returns {Promise<Array<string>>}
 */
async function getSequencesFromPMID(pmid, targetDb = 'nuccore') {
  const baseUrl = '[https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi](https://eutils.ncbi.nlm.nih.gov/entrez/eutils/elink.fcgi)';
  const url = `${baseUrl}?dbfrom=pubmed&db=${targetDb}&id=${pmid}&retmode=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`NCBI API error: ${response.status} ${response.statusText}`);

    const data = await response.json();
    const linkSets = data.linksets || [];
    
    if (linkSets.length === 0 || !linkSets[0].linksetdbs) {
      return [];
    }

    const linkedIds = linkSets[0].linksetdbs[0].links;
    return linkedIds || [];
  } catch (error) {
    console.error(`Failed to fetch sequences for PMID ${pmid} in ${targetDb}:`, error.message);
    return [];
  }
}

// ==========================================
// Main Execution Logic
// ==========================================
async function main() {
  // Get PMID from command line argument, or use a default test PMID
  const pmid = process.argv[2] || '2105716873'; // Replace with a relevant PMID for testing

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
```

## 2. Update `.vscode/launch.json`

Add the following configuration to your `.vscode/launch.json` file inside the `configurations` array. This allows you to run and debug the script directly from VS Code. The `"args"` array passes the PMID to the script.

```json
{
  "version": "0.2.0",
  "configurations": [
    // ... your existing configurations ...
    {
      "type": "node",
      "request": "launch",
      "name": "Run E-Link Search Tool",
      "program": "${workspaceFolder}/tools/e-link-search.mjs",
      "args": [
        "30000000" // Replace with the PMID you want to test
      ],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

````</Array<string></Object>