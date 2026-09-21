import { describe, expect, it } from 'vitest';
import { buildRelationMap, evaluateEinsum } from '@/src/einsum';

describe('buildRelationMap', () => {
  it('rejects a mismatched operand count', () => {
    expect(buildRelationMap('i,j->ij', [[2]])).toEqual({
      valid: false,
      reason: 'The number of input terms must match the number of operands.',
    });
  });

  it('rejects a rank that does not match its labels', () => {
    expect(buildRelationMap('ij->', [[2]]).valid).toBe(false);
  });

  it('rejects repeated output labels', () => {
    expect(buildRelationMap('ij->ii', [[2, 2]])).toMatchObject({
      valid: false,
      reason: 'Repeated dimensions in the output are not allowed.',
    });
  });

  it('rejects an output label missing from the inputs', () => {
    expect(buildRelationMap('i,j->k', [[2], [3]]).valid).toBe(false);
  });

  it('rejects conflicting sizes for a shared label', () => {
    expect(buildRelationMap('i,i->', [[2], [3]]).valid).toBe(false);
  });

  it('derives a scalar output for i,i->', () => {
    const result = buildRelationMap('i,i->', [[4], [4]]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.relationMap.shape).toEqual([]);
      expect(result.freeDims).toEqual([]);
      expect(result.summationDims).toEqual(['i']);
    }
  });

  it('derives a batched matrix-multiply shape', () => {
    const result = buildRelationMap('Bik,Bkj->Bij', [
      [2, 3, 4],
      [2, 4, 5],
    ]);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.relationMap.shape).toEqual([2, 3, 5]);
      expect(result.freeDims).toEqual(['B', 'i', 'j']);
      expect(result.summationDims).toEqual(['k']);
    }
  });
});

describe('evaluateEinsum', () => {
  it('sums a vector', () => {
    expect(evaluateEinsum('i->', [[1, 2, 3]])).toEqual({
      valid: true,
      value: 6,
    });
  });

  it('computes a dot product', () => {
    expect(evaluateEinsum('i,i->', [[1, 2, 3], [4, 5, 6]])).toEqual({
      valid: true,
      value: 32,
    });
  });

  it('keeps a per-element product', () => {
    expect(evaluateEinsum('i,i->i', [[1, 2], [3, 4]])).toEqual({
      valid: true,
      value: [3, 8],
    });
  });

  it('broadcasts a reduction over a free axis', () => {
    expect(evaluateEinsum('i,j->i', [[1, 2], [3, 4]])).toEqual({
      valid: true,
      value: [7, 14],
    });
  });

  it('multiplies matrices', () => {
    expect(
      evaluateEinsum('ik,kj->ij', [
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ]),
    ).toEqual({
      valid: true,
      value: [
        [19, 22],
        [43, 50],
      ],
    });
  });

  it('multiplies batched matrices', () => {
    expect(
      evaluateEinsum('Bik,Bkj->Bij', [
        [
          [
            [1, 2],
            [3, 4],
          ],
        ],
        [
          [
            [5, 6],
            [7, 8],
          ],
        ],
      ]),
    ).toEqual({
      valid: true,
      value: [[[19, 22], [43, 50]]],
    });
  });
});
