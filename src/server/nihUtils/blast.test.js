import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBlastClient } from './blast.js';
import { fetchAndUnzipBlast } from '../utils/unzipfle.mjs';
import { saveBlastResults } from '../utils/save-blast-results.mjs';

vi.mock('../utils/unzipfle.mjs', () => ({
  fetchAndUnzipBlast: vi.fn(),
}));

vi.mock('../utils/save-blast-results.mjs', () => ({
  saveBlastResults: vi.fn().mockResolvedValue('mock/path'),
}));

// Mock parse-qblast-info.js
vi.mock('./parse-qblast-info.js', () => ({
  parsePollResponse: vi.fn().mockReturnValue({ status: 'ready' }),
  parseSubmitResponse: vi.fn().mockReturnValue({ rid: 'MOCK_RID' }),
}));

// Mock @ncbijs/rate-limiter
vi.mock('@ncbijs/rate-limiter', () => ({
  TokenBucket: vi.fn().mockImplementation(function() {
    return {};
  }),
  HttpRetryError: class extends Error {},
  fetchWithRetry: vi.fn().mockResolvedValue({
    text: () => Promise.resolve('MOCK_RESPONSE')
  }),
}));

describe('createBlastClient integration with saveBlastResults', () => {
  const client = createBlastClient();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call saveBlastResults when saveResults option is true', async () => {
    const mockJsonData = { BlastOutput2: [{ report: { results: { search: { hits: [] } } } }] };
    fetchAndUnzipBlast.mockResolvedValue(mockJsonData);

    await client.search('ACGT', 'blastn', 'nt', { saveResults: true, pollIntervalMs: 1 });

    expect(saveBlastResults).toHaveBeenCalledWith(mockJsonData, 'blastn', 'nt');
  });

  it('should NOT call saveBlastResults when saveResults option is false', async () => {
    const mockJsonData = { BlastOutput2: [{ report: { results: { search: { hits: [] } } } }] };
    fetchAndUnzipBlast.mockResolvedValue(mockJsonData);

    await client.search('ACGT', 'blastn', 'nt', { saveResults: false, pollIntervalMs: 1 });

    expect(saveBlastResults).not.toHaveBeenCalled();
  });
});
