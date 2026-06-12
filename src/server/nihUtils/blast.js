import { TokenBucket, HttpRetryError, fetchWithRetry } from '@ncbijs/rate-limiter';
import { parsePollResponse, parseSubmitResponse } from './parse-qblast-info.js';
import { fetchAndUnzipBlast } from '../utils/unzipfle.mjs';
import { saveBlastResults } from '../utils/save-blast-results.mjs';

const BLAST_BASE_URL = 'https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi';
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_POLL_INTERVAL_MS = 60_000;
const DEFAULT_MAX_POLL_ATTEMPTS = 30;

/** HTTP error thrown when the BLAST API returns a non-OK status. */
export class BlastHttpError extends HttpRetryError {
  constructor(status, body) {
    super(status, body, `BLAST API returned status ${status}`);
    this.name = 'BlastHttpError';
  }
}

/** Error thrown when a BLAST search fails on the server. */
export class BlastSearchError extends Error {
  constructor(rid) {
    super(`BLAST search failed for RID ${rid}`);
    this.name = 'BlastSearchError';
    this.rid = rid;
  }
}

/** Error thrown when a BLAST search exceeds the maximum number of poll attempts. */
export class BlastTimeoutError extends Error {
  constructor(rid, attempts) {
    super(`BLAST search timed out after ${attempts} poll attempts for RID ${rid}`);
    this.name = 'BlastTimeoutError';
    this.rid = rid;
    this.attempts = attempts;
  }
}

// Helper functions refactored as arrow functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mapHsp = (raw) => ({
  bitScore: raw.bit_score ?? 0,
  score: raw.score ?? 0,
  evalue: raw.evalue ?? 0,
  queryFrom: raw.query_from ?? 0,
  queryTo: raw.query_to ?? 0,
  hitFrom: raw.hit_from ?? 0,
  hitTo: raw.hit_to ?? 0,
  identity: raw.identity ?? 0,
  gaps: raw.gaps ?? 0,
  alignLen: raw.align_len ?? 0,
  qseq: raw.qseq ?? '',
  hseq: raw.hseq ?? '',
  midline: raw.midline ?? '',
});

const mapHit = (raw) => {
  const firstDescription = raw.description?.[0];
  return {
    accession: firstDescription?.accession ?? '',
    title: firstDescription?.title ?? '',
    length: raw.len ?? 0,
    hsps: (raw.hsps ?? []).map(mapHsp),
  };
};

const mapBlastResult = (raw) => {
  const output = raw.BlastOutput2;
  const firstEntry = Array.isArray(output) ? output[0] : output;
  const rawHits = firstEntry?.report?.results?.search?.hits ?? [];
  return { hits: rawHits.map(mapHit) };
};

/** * Factory function replacing the Blast class. 
 * Creates an NCBI BLAST sequence alignment client using closures for internal state.
 */
export const createBlastClient = (config = {}) => {
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  const submitLimiter = new TokenBucket({ requestsPerSecond: 0.1 });
  const pollLimiter = new TokenBucket({ requestsPerSecond: 1 / 60 });

  const fetchText = async (url, rateLimiter, request) => {
    const response = await fetchWithRetry(
      url, 
      { maxRetries, rateLimiter }, 
      {
        ...(request !== undefined && { request }),
        createError: (status, responseBody) => new BlastHttpError(status, responseBody),
      }
    );
    return response.text();
  };

  /** Submit a BLAST search job and return the request ID and estimated time. */
  const submit = async (query, program, database, options = {}) => {
    const body = new URLSearchParams({
      CMD: 'Put',
      PROGRAM: program,
      DATABASE: database,
      QUERY: query
    });

    // Modern iteration over simple boolean/string mappings
    const optionMap = {
      entrezQuery: 'ENTREZ_QUERY',
      expect: 'EXPECT',
      hitListSize: 'HITLIST_SIZE',
      matrix: 'MATRIX',
      wordSize: 'WORD_SIZE',
      compositionBasedStatistics: 'COMPOSITION_BASED_STATISTICS',
      softMasking: 'SOFT_MASKING',
      threshold: 'THRESHOLD',
      numIterations: 'NUM_ITERATIONS'
    };

    Object.entries(optionMap).forEach(([key, param]) => {
      if (options[key] !== undefined) body.set(param, String(options[key]));
    });

    // Complex/custom mappings
    if (options.seg !== undefined) body.set('FILTER', options.seg ? 'L' : '');
    if (options.gapOpen !== undefined && options.gapExtend !== undefined) {
        body.set('GAPCOSTS', `${options.gapOpen} ${options.gapExtend}`);
    }
    if (options.megablast !== undefined) body.set('MEGABLAST', options.megablast ? 'on' : 'off');

    const responseText = await fetchText(BLAST_BASE_URL, submitLimiter, {
      method: 'POST',
      body: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    
    return parseSubmitResponse(responseText);
  };

  /** Check the status of a submitted BLAST search by request ID. */
  const poll = async (rid) => {
    const url = `${BLAST_BASE_URL}?CMD=Get&RID=${encodeURIComponent(rid)}&FORMAT_OBJECT=SearchInfo`;
    const responseText = await fetchText(url, pollLimiter);
    return parsePollResponse(responseText);
  };

  /** Retrieve the results of a completed BLAST search by request ID. */
  const retrieve = async (rid, program, database, options = {}) => {
    const url = `${BLAST_BASE_URL}?CMD=Get&RID=${encodeURIComponent(rid)}&FORMAT_TYPE=JSON2`;
    
    try {
      const blastJsonData = await fetchAndUnzipBlast(url);
      
      if (options.saveResults && program && database) {
        await saveBlastResults(blastJsonData, program, database);
      }
      
      return mapBlastResult(blastJsonData);
    } catch (error) {
      console.error(`Failed to retrieve and process BLAST RID: ${rid}`, error);
      throw error;
    }
  };

  /** Submit a BLAST search and poll until results are ready, then return them. */
  const search = async (query, program, database, options = {}) => {
    const submitResult = await submit(query, program, database, options);
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const maxPollAttempts = options.maxPollAttempts ?? DEFAULT_MAX_POLL_ATTEMPTS;

    for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
      await delay(pollIntervalMs);
      const pollResult = await poll(submitResult.rid);

      if (pollResult.status === 'ready') return retrieve(submitResult.rid, program, database, options);
      
      if (pollResult.status === 'failed' || pollResult.status === 'unknown') {
        throw new BlastSearchError(submitResult.rid);
      }
    }
    throw new BlastTimeoutError(submitResult.rid, maxPollAttempts);
  };

  // Return the public API
  return { submit, poll, retrieve, search };
};
