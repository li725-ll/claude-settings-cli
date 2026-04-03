import { describe, it, expect } from 'vitest';
import {
  encodeProjectDir,
  decodeProjectDir,
  presetPath,
  templatePath,
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
  it('should return path under ~/.ccc/presets/', () => {
    const p = presetPath('deepseek');
    expect(p).toContain('.ccc');
    expect(p).toContain('presets');
    expect(p).toContain('deepseek.json');
    expect(p).not.toContain('settings-');
  });
});

describe('templatePath', () => {
  it('should return path under ~/.ccc/templates/', () => {
    const p = templatePath('my-template');
    expect(p).toContain('.ccc');
    expect(p).toContain('templates');
    expect(p).toContain('my-template.json');
  });
});
