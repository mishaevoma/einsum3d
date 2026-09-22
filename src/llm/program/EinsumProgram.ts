import { createPresets, type EinsumState } from '@/src/einsum';
import { isNotNil } from '@/src/utils/data';
import { Subscriptions } from '@/src/utils/hooks';
import { Mat4f } from '@/src/utils/matrix';
import { Vec3 } from '@/src/utils/vector';
import { genModelViewMatrices, type ICamera, updateCamera } from '../Camera';
import { drawBlockInfo } from '../components/BlockInfo';
import { generateEinsumLayout } from '../EinsumLayout';
import { runMouseHitTesting } from '../Interaction';
import type { IFontAtlasData } from '../render/fontRender';
import {
    initRender,
    type IRenderView,
    renderModel,
    resetRenderBuffers,
} from '../render/modelRender';
import { beginQueryAndGetPrevMs, endQuery } from '../render/queryManager';
import { RenderPhase } from '../render/sharedRender';
import type { ProgramState } from './types';

function createCamera(): ICamera {
    return {
        angle: new Vec3(270, 4.5, 0.8),
        center: new Vec3(),
        transition: {},
        modelMtx: new Mat4f(),
        viewMtx: new Mat4f(),
        lookAtMtx: new Mat4f(),
        camPos: new Vec3(),
        camPosModel: new Vec3(),
    };
}

export function currentEinsumState(state: ProgramState): EinsumState {
    return state.presets[state.currentPresetIndex].state;
}

export function fitCameraToLayout(
    state: ProgramState,
    transition = true,
): void {
    if (state.layout.cubes.length === 0) {
        return;
    }

    const min = new Vec3(Infinity, Infinity, Infinity);
    const max = new Vec3(-Infinity, -Infinity, -Infinity);
    for (const cube of state.layout.cubes) {
        min.x = Math.min(min.x, cube.x);
        min.y = Math.min(min.y, cube.y);
        min.z = Math.min(min.z, cube.z);
        max.x = Math.max(max.x, cube.x + cube.dx);
        max.y = Math.max(max.y, cube.y + cube.dy);
        max.z = Math.max(max.z, cube.z + cube.dz);
    }

    // Layout coordinates are transformed to (x, -z, -y) by modelMtx.
    const midpoint = min.add(max).mul(0.5);
    const center = new Vec3(midpoint.x, -midpoint.z, -midpoint.y);
    const aspect = state.render
        ? state.render.size.x / Math.max(1, state.render.size.y)
        : 1.5;
    const azimuth = (285 * Math.PI) / 180;
    const elevation = (12 * Math.PI) / 180;
    const right = new Vec3(-Math.sin(azimuth), Math.cos(azimuth), 0);
    const up = new Vec3(
        -Math.cos(azimuth) * Math.sin(elevation),
        -Math.sin(azimuth) * Math.sin(elevation),
        Math.cos(elevation),
    );
    const outward = new Vec3(
        Math.cos(elevation) * Math.cos(azimuth),
        Math.cos(elevation) * Math.sin(azimuth),
        Math.sin(elevation),
    );
    const tanHalfFov = Math.tan((20 * Math.PI) / 180);
    let distance = 0;
    // Fit projected corners on each axis, rather than a bounding sphere: flat
    // matrices can use the full width of a wide viewport without getting tiny.
    for (const x of [min.x, max.x])
        for (const y of [min.y, max.y])
            for (const z of [min.z, max.z]) {
                const offset = new Vec3(x, -z, -y).sub(center);
                distance = Math.max(
                    distance,
                    Math.abs(offset.dot(right)) / (tanHalfFov * aspect) +
                        offset.dot(outward),
                    Math.abs(offset.dot(up)) / tanHalfFov + offset.dot(outward),
                );
            }
    distance *= 1.3;
    const target = {
        center,
        angle: new Vec3(285, 12, Math.max(0.12, distance / 200)),
    };

    if (
        transition &&
        !(
            typeof window !== 'undefined' &&
            window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
        )
    ) {
        state.camera.desiredCamera = target;
    } else {
        state.camera.desiredCamera = undefined;
        state.camera.desiredCameraTransition = undefined;
        state.camera.center = target.center;
        state.camera.angle = target.angle;
    }
}

export function refreshLayout(state: ProgramState, fitCamera = false): void {
    state.layout = generateEinsumLayout(
        state.previewStates[state.currentPresetIndex],
    );
    if (fitCamera) {
        fitCameraToLayout(state);
    }
    state.markDirty();
}

export function updateCurrentEinsumState(
    state: ProgramState,
    einsumState: EinsumState,
): void {
    const preset = state.presets[state.currentPresetIndex];
    state.presets[state.currentPresetIndex] = {
        ...preset,
        state: einsumState,
    };
    // Keep the last valid scene while the user is in the middle of an edit.
    if (einsumState.output) {
        state.previewStates[state.currentPresetIndex] = einsumState;
        if (
            state.display.focusDimension &&
            einsumState.output.dimSizes[state.display.focusDimension] ===
                undefined
        )
            state.display.focusDimension = null;
        refreshLayout(state, true);
    }
    state.htmlSubs.notify();
}

export function selectPreset(state: ProgramState, index: number): void {
    if (index < 0 || index >= state.presets.length) {
        return;
    }
    state.currentPresetIndex = index;
    state.display.focusDimension = null;
    refreshLayout(state, true);
    state.htmlSubs.notify();
}

export function resetCurrentPreset(state: ProgramState): void {
    state.presets[state.currentPresetIndex] =
        createPresets()[state.currentPresetIndex];
    state.previewStates[state.currentPresetIndex] = currentEinsumState(state);
    state.display.focusDimension = null;
    refreshLayout(state, true);
    state.htmlSubs.notify();
}

export function initProgramState(): ProgramState {
    const presets = createPresets();
    const state: ProgramState = {
        presets,
        previewStates: presets.map((preset) => preset.state),
        currentPresetIndex: 4,
        render: null,
        camera: createCamera(),
        layout: generateEinsumLayout(presets[4].state),
        mouse: { mousePos: new Vec3(-1, -1) },
        display: { hoverTarget: null, focusDimension: null },
        pageLayout: {
            height: 0,
            width: 0,
            isDesktop: true,
            isPhone: false,
        },
        htmlSubs: new Subscriptions(),
        markDirty: () => {},
    };
    state.markDirty = () => {
        state.htmlSubs.notify();
    };
    fitCameraToLayout(state, false);
    return state;
}

export function attachRenderer(
    state: ProgramState,
    canvas: HTMLCanvasElement,
    fontAtlasData: IFontAtlasData,
): void {
    try {
        state.render = initRender(canvas, fontAtlasData);
    } catch (error) {
        console.error(error);
        state.render = null;
    }
}

export function runEinsumProgram(view: IRenderView, state: ProgramState): void {
    const render = state.render;
    if (!render) {
        return;
    }

    const startedAt = performance.now();
    resetRenderBuffers(render);
    render.sharedRender.activePhase = RenderPhase.Opaque;
    state.display.hoverTarget = null;
    const output = state.previewStates[state.currentPresetIndex].output;
    const dimension = state.display.focusDimension;
    for (const cube of state.layout.cubes) {
        const dimensions =
            cube.kind === 'result'
                ? output?.freeDims
                : output?.inputDims[cube.tensorIndex ?? 0];
        cube.highlight =
            dimension && dimensions?.includes(dimension) ? 0.45 : 0;
    }

    updateCamera(state, view);
    genModelViewMatrices(state);

    const previousGpuMs = beginQueryAndGetPrevMs(render.queryManager, 'render');
    if (isNotNil(previousGpuMs)) {
        render.lastGpuMs = previousGpuMs;
    }

    drawBlockInfo(state);
    runMouseHitTesting(state);
    renderModel(state);

    endQuery(render.queryManager, 'render');
    render.gl.flush();
    render.lastJsMs = performance.now() - startedAt;
}
