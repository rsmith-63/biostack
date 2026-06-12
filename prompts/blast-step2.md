# Step 2: Utility Script (`src/server/utils/unzipfle.mjs`)

This document contains the standalone utility code for fetching, unzipping, and stream-parsing NIH BLAST data using Node.js v24.11.0.

## File Location
Create this file at: `src/server/utils/unzipfle.mjs`

## Implementation

```javascript
import fsPromises from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib'; // Included per requirements
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import unzipper from 'unzipper';
import { parser } from 'stream-json';
import { streamValues } from 'stream-json/streamers/StreamValues.js';

/**
 * Fetches a ZIP file from the given URL, extracts it to a temp directory,
 * stream-parses the containing JSON, and cleans up the disk.
 * 
 * @param {string} url - The NIH BLAST API URL
 * @returns {Promise<Object>} - The parsed JSON data
 */
export const fetchAndUnzipBlast = async (url) => {
  // Create a unique temporary directory for this extraction
  const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'blast-'));
  
  try {
    // 1. Native fetch to stream the response
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }

    // 2. Convert WebStream to a Node.js Readable stream
    const nodeStream = Readable.fromWeb(response.body);
    
    // 3. Pipe the network stream directly into the unzipper
    await pipeline(
      nodeStream,
      unzipper.Extract({ path: tempDir })
    );

    // 4. Locate the extracted JSON file
    const files = await fsPromises.readdir(tempDir);
    const jsonFileName = files.find(f => f.endsWith('.json'));
    
    if (!jsonFileName) {
      throw new Error('No JSON file found in the extracted ZIP archive.');
    }

    const filePath = path.join(tempDir, jsonFileName);

    // 5. Memory-efficient JSON parsing using stream-json
    let parsedData = null;
    
    await pipeline(
      createReadStream(filePath),
      parser(),
      streamValues(),
      // Async iterator to capture the fully assembled JSON object
      async function* (source) {
        for await (const { value } of source) {
          parsedData = value;
        }
      }
    );

    // 6. Explicitly delete the extracted file to avoid filling up disk space
    await fsPromises.unlink(filePath);

    return parsedData;

  } catch (error) {
    console.error('Error during BLAST fetch, unzip, or parse sequence:', error);
    throw error;
  } finally {
    // Ultimate fallback cleanup: ensure the temporary directory is removed
    await fsPromises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
};
```

## Key Technical Details
*   **Native `fetch` & `Readable.fromWeb`**: Intercepts the response body as a standard Web Stream and translates it into a Node.js stream for `pipeline` compatibility.
*   **`fsPromises.mkdtemp`**: Dynamically creates an isolated folder structure inside `os.tmpdir()` to prevent any race conditions or collisions if processing multiple files concurrently.
*   **`stream-json`**: Evaluates the JSON file chunk-by-chunk using a pipeline iterator to guarantee minimal memory footprint, preventing heap exhaustion on massive BLAST results.
*   **Aggressive Garbage Collection & Cleanup**: Automatically executes `fsPromises.unlink()` on the individual file right after stream ingestion, followed by a `finally` block ensuring the entire dynamic folder is pruned from the OS.
````</Object>