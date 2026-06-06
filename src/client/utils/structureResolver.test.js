import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveStructureUrl } from './structureResolver';

describe('structureResolver', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should resolve AlphaFold structure if available', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([{ cifUrl: 'https://alphafold.ebi.ac.uk/files/AF-O88844-F1-model_v4.cif' }])
    });

    const result = await resolveStructureUrl('O88844');
    expect(result).toEqual({
      url: 'https://alphafold.ebi.ac.uk/files/AF-O88844-F1-model_v4.cif',
      format: 'mmcif',
      source: 'AlphaFold'
    });
    expect(fetch).toHaveBeenCalledWith('https://alphafold.ebi.ac.uk/api/prediction/O88844');
  });

  it('should fallback to SWISS-MODEL if AlphaFold returns 404', async () => {
    // AlphaFold fails
    fetch.mockResolvedValueOnce({ ok: false, status: 404 });
    // SWISS-MODEL succeeds (HEAD request)
    fetch.mockResolvedValueOnce({ ok: true });

    const result = await resolveStructureUrl('O88844');
    expect(result).toEqual({
      url: 'https://swissmodel.expasy.org/repository/uniprot/O88844.cif',
      format: 'mmcif',
      source: 'SWISS-MODEL'
    });
  });

  it('should fallback to SWISS-MODEL if AlphaFold returns empty data', async () => {
    // AlphaFold returns empty array
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ([])
    });
    // SWISS-MODEL succeeds
    fetch.mockResolvedValueOnce({ ok: true });

    const result = await resolveStructureUrl('O88844');
    expect(result.source).toBe('SWISS-MODEL');
  });

  it('should return null if both fail', async () => {
    // AlphaFold fails
    fetch.mockResolvedValueOnce({ ok: false });
    // SWISS-MODEL fails
    fetch.mockResolvedValueOnce({ ok: false });

    const result = await resolveStructureUrl('O88844');
    expect(result).toBeNull();
  });
});
