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

describe('API Integration Tests', () => {
  it('GET /api/health should return 200 and healthy status', async () => {
    const response = await request(app.callback()).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
  });

  it('POST /api/pubmed/search should return 400 for empty query', async () => {
    const response = await request(app.callback())
      .post('/api/pubmed/search')
      .send({ query: '' });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
