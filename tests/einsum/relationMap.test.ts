import { describe, expect, it, vi } from 'vitest';
import { buildRelationMap, evaluateEinsum, MultidimArray } from '@/src/einsum';

describe('lazy relation cells', () => {
    it('only materializes requested cells and caches them', () => {
        const create = vi.fn((indices: number[]) => indices.join(','));
        const array = new MultidimArray([1000, 1000], create);
        expect(create).not.toHaveBeenCalled();
        expect(array.getItem([5, 8])).toBe('5,8');
        expect(array.getItem([5, 8])).toBe('5,8');
        expect(create).toHaveBeenCalledTimes(1);
        array.setItem([3, 4], 'override');
        expect(array.getItem([3, 4])).toBe('override');
        expect(create).toHaveBeenCalledTimes(1);
        expect(() => array.getItem([1000, 0])).toThrow(RangeError);
    });

    it('preserves scalar and nested array materialization', () => {
        expect(new MultidimArray([], () => 7).toArray()).toBe(7);
        expect(
            new MultidimArray([2, 2], ([row, col]) => row * 2 + col).toArray(),
        ).toEqual([
            [0, 1],
            [2, 3],
        ]);
    });
});

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
    it('preserves repeated-index and transpose evaluation', () => {
        expect(
            evaluateEinsum('ii->i', [
                [
                    [1, 2],
                    [3, 4],
                ],
            ]),
        ).toEqual({ valid: true, value: [1, 4] });
        expect(
            evaluateEinsum('ij->ji', [
                [
                    [1, 2],
                    [3, 4],
                ],
            ]),
        ).toEqual({
            valid: true,
            value: [
                [1, 3],
                [2, 4],
            ],
        });
    });
    it('sums a vector', () => {
        expect(evaluateEinsum('i->', [[1, 2, 3]])).toEqual({
            valid: true,
            value: 6,
        });
    });

    it('computes a dot product', () => {
        expect(
            evaluateEinsum('i,i->', [
                [1, 2, 3],
                [4, 5, 6],
            ]),
        ).toEqual({
            valid: true,
            value: 32,
        });
    });

    it('keeps a per-element product', () => {
        expect(
            evaluateEinsum('i,i->i', [
                [1, 2],
                [3, 4],
            ]),
        ).toEqual({
            valid: true,
            value: [3, 8],
        });
    });

    it('broadcasts a reduction over a free axis', () => {
        expect(
            evaluateEinsum('i,j->i', [
                [1, 2],
                [3, 4],
            ]),
        ).toEqual({
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
            value: [
                [
                    [19, 22],
                    [43, 50],
                ],
            ],
        });
    });
});
