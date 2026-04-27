import { describe, it, expect } from 'vitest';
import { appendDateRange } from './pubmedDateFormatter.js';

describe('pubmedDateFormatter', () => {
  it('should append date range when both dates are provided', () => {
    const query = appendDateRange('rhabdomyosarcoma', '2020/01/01', '2020/12/31');
    expect(query).toBe('rhabdomyosarcoma AND 2020/01/01:2020/12/31[pdat]');
  });

  it('should use start date as both bounds when only start date is provided', () => {
    const query = appendDateRange('rhabdomyosarcoma', '2020', '');
    expect(query).toBe('rhabdomyosarcoma AND 2020:2020[pdat]');
  });

  it('should use end date as both bounds when only end date is provided', () => {
    const query = appendDateRange('rhabdomyosarcoma', '', '2023');
    expect(query).toBe('rhabdomyosarcoma AND 2023:2023[pdat]');
  });

  it('should return original query when no dates are provided', () => {
    const query = appendDateRange('rhabdomyosarcoma', '', '');
    expect(query).toBe('rhabdomyosarcoma');
  });

  it('should handle Year/Month format correctly', () => {
    const query = appendDateRange('rhabdomyosarcoma', '2020/01', '2023/06');
    expect(query).toBe('rhabdomyosarcoma AND 2020/01:2023/06[pdat]');
  });
});
