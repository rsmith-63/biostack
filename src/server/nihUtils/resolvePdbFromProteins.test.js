import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolvePdbFromProteins } from './resolvePdbFromProteins.js';

describe('resolvePdbFromProteins', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should return empty array if no proteinUids are provided', async () => {
    const result = await resolvePdbFromProteins([]);
    expect(result).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should resolve PDB codes correctly', async () => {
    // Mock E-link response
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        linksets: [
          {
            linksetdbs: [
              {
                dbto: 'pdb',
                links: ['1001', '1002']
              }
            ]
          }
        ]
      })
    });

    // Mock E-summary response
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        result: {
          '1001': { accession: '1ABC_A' },
          '1002': { accession: '2XYZ_B' }
        }
      })
    });

    const result = await resolvePdbFromProteins(['2105716873']);
    expect(result).toEqual(['1abc', '2xyz']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle no PDB links found', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        linksets: [{ linksetdbs: [] }]
      })
    });

    const result = await resolvePdbFromProteins(['2105716873']);
    expect(result).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle large number of protein IDs by chunking', async () => {
    // Mock elink and esummary responses for two chunks
    fetch
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({ linksets: [{ linksetdbs: [{ dbto: 'pdb', links: ['1001'] }] }] })
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({ result: { '1001': { accession: '1ABC_A' } } })
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({ linksets: [{ linksetdbs: [{ dbto: 'pdb', links: ['1002'] }] }] })
      })
      .mockResolvedValueOnce({
        ok: true, status: 200,
        json: () => Promise.resolve({ result: { '1002': { accession: '2XYZ_B' } } })
      });

    const largeArray = Array(600).fill('2105716873');
    const result = await resolvePdbFromProteins(largeArray);
    
    // 600 IDs / 500 chunk size = 2 chunks
    // Each chunk does 1 elink + 1 esummary = 2 calls
    // Total should be 4 calls
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(result).toEqual(['1abc', '2xyz']);
  });
});
