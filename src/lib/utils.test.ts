import { describe, it, expect } from 'vitest';
import { cn, safeDecode } from './utils';

describe('cn', () => {
  it('joins class names and resolves tailwind conflicts with the last value winning', () => {
    expect(cn('p-2', 'text-sm')).toBe('p-2 text-sm');
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('ignores falsy inputs', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });
});

describe('safeDecode', () => {
  it('decodes URI-encoded titles', () => {
    expect(safeDecode('Albert%20Einstein')).toBe('Albert Einstein');
  });

  it('returns the input unchanged when it is not valid encoding', () => {
    expect(safeDecode('100%')).toBe('100%');
  });

  it('returns an empty string for undefined', () => {
    expect(safeDecode(undefined)).toBe('');
  });
});
