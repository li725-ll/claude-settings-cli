import { describe, it, expect } from 'vitest';
import {
  encodeProjectDir,
  decodeProjectDir,
  presetPath,
} from '../../src/core/paths.js';

describe('encodeProjectDir', () => {
  it('should encode absolute path', () => {
    expect(encodeProjectDir('/Users/foo/bar')).toBe('Users-foo-bar');
  });

  it('should handle trailing slash', () => {
    expect(encodeProjectDir('/a/b/c')).toBe('a-b-c');
  });
});

describe('decodeProjectDir', () => {
  it('should decode back to absolute path', () => {
    expect(decodeProjectDir('Users-foo-bar')).toBe('/Users/foo/bar');
  });
});

describe('presetPath', () => {
  it('should return path with settings- prefix and .json suffix', () => {
    const p = presetPath('deepseek');
    expect(p).toContain('settings-deepseek.json');
    expect(p).toContain('.claude');
  });
});
