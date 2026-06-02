import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSequencesFromPMID } from './getSequencesFromPMID.js';
import { resolvePdbFromProteins } from './resolvePdbFromProteins.js';

vi.mock('./resolvePdbFromProteins.js', () => ({
  resolvePdbFromProteins: vi.fn()
}));

describe('getSequencesFromPMID', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  it('should return nucleotide IDs when targetDb is nuccore', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        linksets: [
          {
            linksetdbs: [
              {
                links: ['123', '456']
              }
            ]
          }
        ]
      })
    });

    const result = await getSequencesFromPMID('12345', 'nuccore');
    expect(result).toEqual(['123', '456']);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('db=nuccore'));
    expect(resolvePdbFromProteins).not.toHaveBeenCalled();
  });

  it('should return PDB codes when targetDb is protein', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        linksets: [
          {
            linksetdbs: [
              {
                links: ['789']
              }
            ]
          }
        ]
      })
    });

    resolvePdbFromProteins.mockResolvedValueOnce(['1abc']);

    const result = await getSequencesFromPMID('12345', 'protein');
    expect(result).toEqual(['1abc']);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('db=protein'));
    expect(resolvePdbFromProteins).toHaveBeenCalledWith(['789']);
  });

  it('should return empty array if no links found', async () => {
     fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        linksets: []
      })
    });

    const result = await getSequencesFromPMID('12345');
    expect(result).toEqual([]);
  });

  it('should handle fetch error', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const result = await getSequencesFromPMID('12345');
    expect(result).toEqual([]);
  });
});
