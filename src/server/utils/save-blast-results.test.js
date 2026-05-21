import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveBlastResults } from './save-blast-results.mjs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

vi.mock('fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

describe('saveBlastResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save results with top hit accession in the filename', async () => {
    const mockData = {
      BlastOutput2: [
        {
          report: {
            results: {
              search: {
                hits: [
                  {
                    description: [{ accession: 'NM_001301717' }],
                  },
                ],
              },
            },
          },
        },
      ],
    };

    const program = 'blastn';
    const database = 'nt';
    const filepath = await saveBlastResults(mockData, program, database);

    expect(mkdir).toHaveBeenCalledWith(expect.stringContaining('blast_results'), { recursive: true });
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('NM_001301717_blastn_nt_'),
      JSON.stringify(mockData, null, 2),
      'utf8'
    );
    expect(filepath).toContain('NM_001301717_blastn_nt_');
  });

  it('should fallback to NoHits if no hits are found', async () => {
    const mockData = {
      BlastOutput2: [
        {
          report: {
            results: {
              search: {
                hits: [],
              },
            },
          },
        },
      ],
    };

    const program = 'blastp';
    const database = 'nr';
    const filepath = await saveBlastResults(mockData, program, database);

    expect(filepath).toContain('NoHits_blastp_nr_');
  });

  it('should handle flattened JSON structure', async () => {
    const mockData = {
      hits: [
        {
          accession: 'P12345',
        },
      ],
    };

    const program = 'blastp';
    const database = 'nr';
    const filepath = await saveBlastResults(mockData, program, database);

    expect(filepath).toContain('P12345_blastp_nr_');
  });

  it('should handle BlastOutput2 as an object (NCBI Standard)', async () => {
    const mockData = {
      BlastOutput2: {
        report: {
          results: {
            search: {
              hits: [
                {
                  description: [{ accession: 'B43963' }],
                },
              ],
            },
          },
        },
      },
    };

    const program = 'blastp';
    const database = 'nr';
    const filepath = await saveBlastResults(mockData, program, database);

    expect(filepath).toContain('B43963_blastp_nr_');
  });
});
