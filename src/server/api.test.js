import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from './index.js';

// Mock the MCP connection to avoid actual network/npx calls during tests
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => {
  const Client = vi.fn();
  Client.prototype.connect = vi.fn().mockResolvedValue(undefined);
  Client.prototype.callTool = vi.fn().mockResolvedValue({ content: [{ text: '{}' }] });
  return { Client };
});

// Mock runLinkSearch to test the structure route
vi.mock('./tools/e-link-search.mjs', () => ({
  runLinkSearch: vi.fn()
}));

import { runLinkSearch } from './tools/e-link-search.mjs';

describe('API Integration Tests', () => {
  it('GET /api/health should return 200 and healthy status', async () => {
    const response = await request(app.callback()).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
  });

  it('GET /api/structure/:pubmedId should return 200 and flattened data when found', async () => {
    const mockData = {
      pmid: '12345',
      pdb: ['6Z1W'],
      blastDbs: ['protein']
    };
    vi.mocked(runLinkSearch).mockResolvedValue(mockData);

    const response = await request(app.callback()).get('/api/structure/12345');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(['6Z1W']);
  });

  it('GET /api/structure/:pubmedId should prioritize results.structure', async () => {
    const mockData = {
      pmid: '12345',
      pdb: ['6Z1W'],
      structure: { url: 'http://example.com/struct.pdb', source: 'SWISS-MODEL' }
    };
    vi.mocked(runLinkSearch).mockResolvedValue(mockData);

    const response = await request(app.callback()).get('/api/structure/12345');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(mockData.structure);
  });

  it('GET /api/structure/:pubmedId should return 404 when no data found', async () => {
    vi.mocked(runLinkSearch).mockResolvedValue({
      pmid: '12345',
      allLinkedDbs: [],
      blastDbs: []
    });

    const response = await request(app.callback()).get('/api/structure/12345');
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });

  it('POST /api/pubmed/search should return 400 for empty query', async () => {
    const response = await request(app.callback())
      .post('/api/pubmed/search')
      .send({ query: '' });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
