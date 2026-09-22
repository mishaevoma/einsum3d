import { describe, expect, it, vi } from 'vitest';
import { createOperand, deriveEinsumState } from '@/src/einsum';
import {
    fitCameraToLayout,
    initProgramState,
    resetCurrentPreset,
    selectPreset,
    updateCurrentEinsumState,
} from '@/src/llm/program/EinsumProgram';
import { genModelViewMatrices } from '@/src/llm/Camera';
import { orbitCamera, zoomCamera } from '@/src/llm/program/interaction';
import type { IRenderState } from '@/src/llm/render/modelRender';
import { Vec3 } from '@/src/utils/vector';

describe('camera fitting', () => {
    it.each([
        [900, 230],
        [390, 180],
        [300, 700],
    ])('fits every example inside a %i × %i viewport', (width, height) => {
        const state = initProgramState();
        state.render = { size: new Vec3(width, height) } as IRenderState;
        for (let preset = 0; preset < state.presets.length; preset++) {
            selectPreset(state, preset);
            fitCameraToLayout(state, false);
            genModelViewMatrices(state);
            const projection = state.camera.viewMtx.mul(state.camera.modelMtx);
            for (const block of state.layout.cubes) {
                for (const x of [block.x, block.x + block.dx])
                    for (const y of [block.y, block.y + block.dy])
                        for (const z of [block.z, block.z + block.dz]) {
                            const point = projection.mulVec3Proj(
                                new Vec3(x, y, z),
                            );
                            expect(Math.abs(point.x)).toBeLessThan(0.9);
                            expect(Math.abs(point.y)).toBeLessThan(0.9);
                            expect(point.z).toBeGreaterThan(0);
                            expect(point.z).toBeLessThan(1);
                        }
            }
        }
    });

    it('does not notify React subscribers during camera movement', () => {
        const state = initProgramState();
        state.markDirty = vi.fn();
        const listener = vi.fn();
        state.htmlSubs.subscribe(listener);
        orbitCamera(state, 10, 5);
        zoomCamera(state, 1.2);
        expect(state.markDirty).toHaveBeenCalledTimes(2);
        expect(listener).not.toHaveBeenCalled();
    });
});

describe('editor preview', () => {
    it('keeps the last valid scene while editing, including across example switches', () => {
        const state = initProgramState();
        const previous = state.layout;
        updateCurrentEinsumState(
            state,
            deriveEinsumState('broken', [createOperand('A', [3])]),
        );
        expect(state.layout).toBe(previous);
        selectPreset(state, 2);
        selectPreset(state, 4);
        expect(state.layout.cubes).toEqual(previous.cubes);
        expect(state.presets[4].state.error).not.toBeNull();
        resetCurrentPreset(state);
        expect(state.presets[4].state.error).toBeNull();
        expect(state.presets[4].state.equation).toBe('ik,kj->ij');
    });
});
