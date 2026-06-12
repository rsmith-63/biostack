# Bug Fix: BLAST Results File Naming Convention (`NoHits`)

## Problem Description
When executing `saveBlastResults(blastData, program, database)`, the output filename consistently defaults to `NoHits_blastp_nr_[timestamp].json`, even when the `blastData` payload contains valid biological matches (e.g., Accession `B43963`).

## Root Cause Analysis
The issue stems from a structural path mismatch inside `utils/save-blast-results.mjs`. 

The original code attempts to safely navigate the standard NCBI `BlastOutput2` schema but falls back incorrectly when processing standard nested payloads:

```javascript
// Original Broken Logic
const searchResults = blastData?.BlastOutput2?.[0]?.report?.results?.search || blastData;
const hits = searchResults.hits || [];