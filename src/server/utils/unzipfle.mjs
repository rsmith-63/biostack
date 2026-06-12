import fsPromises from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import zlib from 'node:zlib'; // Included per requirements
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import unzipper from 'unzipper';
import { parser } from 'stream-json/parser.js';
import { streamValues } from 'stream-json/streamers/stream-values.js';

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

    const contentType = response.headers.get('content-type');

    // 2. Determine if we need to unzip or if it's direct JSON
    const isZip = contentType?.includes('zip') || contentType?.includes('application/octet-stream');
    
    let parsedData = null;

    if (isZip) {
      // Convert WebStream to a Node.js Readable stream
      const nodeStream = Readable.fromWeb(response.body);
      
      // 3. Parse the ZIP stream and find the JSON file
      let jsonFilePath = null;
      const zip = nodeStream.pipe(unzipper.Parse({ forceStream: true }));
      
      for await (const entry of zip) {
        const fileName = entry.path;
        if (fileName.endsWith('.json')) {
          jsonFilePath = path.join(tempDir, fileName);
          // Ensure parent directory exists if entry has a path
          await fsPromises.mkdir(path.dirname(jsonFilePath), { recursive: true });
          await pipeline(entry, createWriteStream(jsonFilePath));
        } else {
          entry.autodrain();
        }
      }

      if (!jsonFilePath) {
        throw new Error('No JSON file found in the extracted ZIP archive.');
      }

      // 5. Memory-efficient JSON parsing using stream-json
      const p = parser.asStream();
      const sv = streamValues.asStream();

      const streamer = createReadStream(jsonFilePath)
        .pipe(p)
        .pipe(sv);
      
      for await (const chunk of streamer) {
        parsedData = chunk.value;
      }

      // 6. Explicitly delete the extracted file
      await fsPromises.unlink(jsonFilePath);
    } else {
      // Direct JSON parsing from stream
      const nodeStream = Readable.fromWeb(response.body);
      const streamer = nodeStream
        .pipe(parser.asStream())
        .pipe(streamValues.asStream());
      
      for await (const chunk of streamer) {
        parsedData = chunk.value;
      }
    }

    return parsedData;

  } catch (error) {
    console.error('Error during BLAST fetch, unzip, or parse sequence:', error);
    throw error;
  } finally {
    // Ultimate fallback cleanup: ensure the temporary directory is removed
    await fsPromises.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
};
