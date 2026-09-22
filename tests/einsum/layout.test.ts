import { describe, expect, it } from 'vitest';
import { createOperand, deriveEinsumState } from '@/src/einsum';
import {
    generateEinsumLayout,
    generateTensorGeometry,
} from '@/src/llm/EinsumLayout';
import { Vec3 } from '@/src/utils/vector';

describe('generateTensorGeometry', () => {
    it('creates one cube for a matrix', () => {
        const geometry = generateTensorGeometry([4, 5], new Vec3());
        expect(geometry.cubes).toHaveLength(1);
        expect(geometry.cubes[0]).toMatchObject({ rows: 4, columns: 5 });
    });

    it('fans a 3-D tensor into stacked cubes', () => {
        const geometry = generateTensorGeometry([3, 2, 2], new Vec3());
        expect(geometry.cubes).toHaveLength(3);
    });
});

describe('generateEinsumLayout', () => {
    it('bounds preview complexity even when the equation is invalid', () => {
        const state = deriveEinsumState('ijk->missing', [
            createOperand('A', [100000000, 2, 2]),
        ]);
        const layout = generateEinsumLayout(state);
        expect(layout.cubes).toHaveLength(0);
        expect(layout.notice).toContain('too large');
    });
    it('lays out operands and the derived result', () => {
        const state = deriveEinsumState('ik,kj->ij', [
            createOperand('A', [4, 3]),
            createOperand('B', [3, 5]),
        ]);
        const layout = generateEinsumLayout(state);
        expect(layout.cubes.length).toBeGreaterThan(0);
        expect(layout.cubes.some((cube) => cube.kind === 'result')).toBe(true);
        expect(layout.cubes.every((cube, index) => cube.idx === index)).toBe(
            true,
        );
    });

    it('still produces cubes for an invalid equation', () => {
        const state = deriveEinsumState('i,j->k', [
            createOperand('A', [2]),
            createOperand('B', [3]),
        ]);
        const layout = generateEinsumLayout(state);
        expect(state.output).toBeNull();
        expect(layout.cubes.length).toBe(2);
        expect(layout.cubes.every((cube) => cube.kind === 'operand')).toBe(
            true,
        );
    });
});
