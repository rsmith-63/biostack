# Integration Guide: `/e-link-search.mjs`

This document provides the code changes required to integrate `/e-link-search.mjs` with the `resolvePdbFromProteins.js` module.

## 1. Import the New Module

First, add the import statement for `resolvePdbFromProteins.js` at the top of your `/e-link-search.mjs` file. Ensure the relative path accurately matches your project's directory structure.

```javascript
// Add this import near the top of /e-link-search.mjs
import { resolvePdbFromProteins } from './resolvePdbFromProteins.js';
// Note: If resolvePdbFromProteins is a default export, use:
// import resolvePdbFromProteins from './resolvePdbFromProteins.js';
```

## 2. Implement the Module in Your Search Logic

Locate the function or method in `/e-link-search.mjs` that currently handles the external linking or PDB resolution logic. Replace the inline or legacy logic with a call to the new module.

### Before Integration (Example legacy logic)
```javascript
export async function fetchExternalLinks(proteinList) {
  const results = [];
  for (const protein of proteinList) {
    // Old implementation fetching or resolving PDBs
    const linkInfo = await legacyExternalSearch(protein); 
    results.push(linkInfo);
  }
  return results;
}
```

### After Integration (Using `resolvePdbFromProteins.js`)
```javascript
export async function fetchExternalLinks(proteinList) {
  try {
    // Delegate the PDB resolution logic to the dedicated module
    const results = await resolvePdbFromProteins(proteinList);
    
    // Perform any e-link-search specific post-processing here if needed
    // e.g., formatting the results for external linking
    return results;
    
  } catch (error) {
    console.error("Failed to resolve PDB from proteins in e-link-search:", error);
    throw error;
  }
}
```

## 3. Integration Checklist

- **Input Format:** Verify that `proteinList` is passed in the exact format (e.g., Array of Uniprot IDs, Array of objects) expected by `resolvePdbFromProteins`.
- **Async/Await:** Ensure that `resolvePdbFromProteins` is properly awaited since it likely performs asynchronous operations.
- **Error Handling:** Check that downstream functions depending on `/e-link-search.mjs` can handle the structure of the `results` returned by the new module.
