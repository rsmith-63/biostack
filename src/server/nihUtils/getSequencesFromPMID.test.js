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

  it('should return PDB codes when direct NCBI links are found for protein', async () => {
    // Mock NCBI link fetch
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

  it('should fallback to AlphaFold if NCBI/PDB finds nothing', async () => {
    // 1. Mock NCBI link fetch (no links)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ linksets: [] })
    });

    // 2. Mock UniProt mapping
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{ primaryAccession: 'P12345' }]
      })
    });

    // 3. Mock PDB fetch (not found)
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    // 4. Mock AlphaFold fetch (found)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ prediction: 'data' }])
    });

    const result = await getSequencesFromPMID('12345', 'protein');
    
    expect(result).toEqual({
      source: 'AlphaFold',
      uniprot_id: 'P12345',
      data: { prediction: 'data' }
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('uniprot.org'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('rcsb.org'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('alphafold.ebi.ac.uk'));
  });

  it('should fallback to PDB via UniProt if direct NCBI links are missing', async () => {
    // 1. Mock NCBI link fetch (no links)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ linksets: [] })
    });

    // 2. Mock UniProt mapping
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        results: [{ primaryAccession: 'P12345' }]
      })
    });

    // 3. Mock PDB fetch (found)
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ reference_id: 'PDB_123', some: 'data' })
    });

    const result = await getSequencesFromPMID('12345', 'protein');
    
    expect(result).toEqual({
      source: 'PDB',
      uniprot_id: 'P12345',
      data: { reference_id: 'PDB_123', some: 'data' }
    });

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('uniprot.org'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('rcsb.org'));
    expect(fetch).not.toHaveBeenCalledWith(expect.stringContaining('alphafold.ebi.ac.uk'));
  });

  it('should return empty array if all lookups fail', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404
    });

    const result = await getSequencesFromPMID('12345', 'protein');
    expect(result).toEqual([]);
  });

  it('should handle fetch error in nuccore', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const result = await getSequencesFromPMID('12345', 'nuccore');
    expect(result).toEqual([]);
  });
});
