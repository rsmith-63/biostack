/**
 * Centralized fetcher with strict rate limiting and exponential backoff for NCBI E-utilities.
 * Utilizes NCBI_API_KEY if available to increase rate limits to 10 requests/sec.
 */

const API_KEY = process.env.NCBI_API_KEY;
// If API key exists, limit is 10 RPS (100ms). Use 150ms to be safe.
// If no API key, limit is 3 RPS (333ms). Use 400ms to be safe.
const RATE_LIMIT_MS = API_KEY ? 150 : 400;

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
 * Robust fetch with retries, sanitization, and network error handling.
 * @param {string} url 
 * @param {Object} options 
 * @param {number} retries 
 */
export async function robustNcbiFetch(url, options = {}, retries = 3) {
  // Append API Key to the URL
  const targetUrl = new URL(url);
  if (API_KEY) {
    targetUrl.searchParams.set('api_key', API_KEY);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await rateLimit();
      
      const response = await fetch(targetUrl.toString(), {
        ...options,
        headers: {
          'User-Agent': 'BioStack/1.0 (https://github.com/robsmith/biostack)',
          'Accept': 'application/json, text/plain, */*',
          ...options.headers
        }
      });
      
      if (response.status === 429) {
        if (attempt === retries) {
          throw new Error(`NCBI API error: 429 Too Many Requests (after ${retries} retries)`);
        }
        const backoff = Math.pow(2, attempt) * 1000 + (Math.random() * 500);
        console.warn(`[NCBI 429] Retrying in ${Math.round(backoff)}ms (Attempt ${attempt + 1}/${retries})...`);
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
      const isNetworkError = error.name === 'TypeError' || error.code === 'UND_ERR_SOCKET' || error.message.includes('terminated');
      
      if (attempt === retries) {
        console.error(`[NCBI FATAL] Failed after ${retries} attempts: ${error.message}`);
        throw error;
      }

      const backoff = Math.pow(2, attempt) * 1000 + (Math.random() * 1000);
      console.warn(`[NCBI RETRY] ${isNetworkError ? 'Network error' : 'Error'}: ${error.message}. Retrying in ${Math.round(backoff)}ms (Attempt ${attempt + 1}/${retries})...`);
      
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}
