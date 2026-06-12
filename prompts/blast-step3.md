# Step 3: Integration in `blast.js`

This document outlines how to integrate the newly created streaming utility into your existing BLAST handling module.

## File Location
Update your existing file at: `src/server/nihUtils/blast.js` (or your specific path to `blast.js`).

## Implementation

You need to replace the old memory-heavy `fetchText` polling logic with the new stream-based `fetchAndUnzipBlast` utility.

```javascript
// Import the newly created streaming utility
// Note: Adjust the relative path if your folder structure differs slightly
import { fetchAndUnzipBlast } from '../utils/unzipfle.mjs';

// ... your existing imports, BLAST_BASE_URL, pollLimiter, and mapBlastResult definitions ...

/**
 * Retrieves and processes the BLAST results using stream extraction.
 * * @param {string} rid - The Request ID from NIH BLAST
 * @returns {Promise<Object>} - The mapped BLAST result
 */
export const retrieve = async (rid) => {
  // Construct the API URL for the ZIP/JSON payload
  const url = `${BLAST_BASE_URL}?CMD=Get&RID=${encodeURIComponent(rid)}&FORMAT_TYPE=JSON2`;
  
  try {
    // Directly stream the network response, unzip to temp, parse JSON, and clean up
    const blastJsonData = await fetchAndUnzipBlast(url);
    
    // Pass the fully parsed JSON object into your existing mapping function
    return mapBlastResult(blastJsonData);
  } catch (error) {
    console.error(`Failed to retrieve and process BLAST RID: ${rid}`, error);
    throw error;
  }
};

// ... rest of the blast.js file exports ...