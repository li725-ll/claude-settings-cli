import { describe, it, expect } from 'vitest';
import { diffObjects } from '../../src/core/diff.js';

describe('diffObjects', () => {
  it('should return empty array for identical objects', () => {
    const obj = { a: 1, b: 'hello' };
    const lines = diffObjects(obj, obj);
    expect(lines).toHaveLength(0);
  });

  it('should detect added keys', () => {
    const lines = diffObjects({}, { newKey: 'value' });
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.includes('+') && l.includes('newKey'))).toBe(true);
  });

  it('should detect removed keys', () => {
    const lines = diffObjects({ oldKey: 'value' }, {});
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.includes('-') && l.includes('oldKey'))).toBe(true);
  });

  it('should detect changed values', () => {
    const lines = diffObjects({ key: 'old' }, { key: 'new' });
    expect(lines.length).toBe(2);
  });

  it('should handle nested objects', () => {
    const obj1 = { env: { URL: 'https://a.com' } };
    const obj2 = { env: { URL: 'https://b.com' } };
    const lines = diffObjects(obj1, obj2);
    expect(lines.some((l) => l.includes('env.URL'))).toBe(true);
  });
});
