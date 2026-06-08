/**
 * Centralized fetcher with strict rate limiting and exponential backoff for NCBI E-utilities.
 * Respects the default limit of 3 requests per second by maintaining a sequential queue.
 */

const RATE_LIMIT_MS = 500; // 2 requests per second (conservative)
let queue = Promise.resolve();

/**
 * Sequential queue for rate limiting.
 */
async function rateLimit() {
  const currentQueue = queue;
  let resolveQueue;
  queue = new Promise(resolve => { resolveQueue = resolve; });

  await currentQueue;
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS));
  resolveQueue();
}

/**
 * Robust fetch with retries and sanitization.
 * @param {string} url 
 * @param {Object} options 
 * @param {number} retries 
 */
export async function robustNcbiFetch(url, options = {}, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await rateLimit();
      
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        if (attempt === retries) {
          throw new Error(`NCBI API error: 429 Too Many Requests (after ${retries} retries)`);
        }
        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(`[NCBI 429] Retrying in ${backoff}ms (Attempt ${attempt + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
        continue;
      }

      if (!response.ok) {
        throw new Error(`NCBI API error: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      // Sanitize control characters that break JSON.parse
      const cleanText = text.replace(/[\x00-\x1F]+/g, " ");
      try {
        return JSON.parse(cleanText);
      } catch (parseError) {
        console.error("JSON Parse Error on sanitized text:", cleanText.substring(0, 200));
        throw parseError;
      }

    } catch (error) {
      if (attempt === retries) throw error;
      const backoff = Math.pow(2, attempt) * 500;
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}
