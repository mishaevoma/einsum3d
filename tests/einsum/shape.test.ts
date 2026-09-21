import { describe, expect, it } from 'vitest';
import { parseShape } from '@/src/einsum';

describe('parseShape', () => {
  it('accepts comma-separated positive integers', () => {
    expect(parseShape('2,3')).toEqual({ valid: true, shape: [2, 3] });
  });

  it('accepts bracketed and spaced values', () => {
    expect(parseShape('[ 2, 3 ]')).toEqual({ valid: true, shape: [2, 3] });
    expect(parseShape('(2,3)')).toEqual({ valid: true, shape: [2, 3] });
  });

  it('rejects an empty value', () => {
    expect(parseShape('').valid).toBe(false);
  });

  it('rejects non-integers and zero', () => {
    expect(parseShape('2,a').valid).toBe(false);
    expect(parseShape('1.5').valid).toBe(false);
    expect(parseShape('0').valid).toBe(false);
    expect(parseShape('-1').valid).toBe(false);
  });
});
