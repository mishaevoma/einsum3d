import { createPresets, type EinsumState } from '@/src/einsum';
import { isNotNil } from '@/src/utils/data';
import { Subscriptions } from '@/src/utils/hooks';
import { Mat4f } from '@/src/utils/matrix';
import { Vec3 } from '@/src/utils/vector';
import {
  genModelViewMatrices,
  type ICamera,
  updateCamera,
} from '../Camera';
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
import {
  beginQueryAndGetPrevMs,
  endQuery,
} from '../render/queryManager';
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

  const center = min.add(max).mul(0.5);
  const span = max.sub(min).len();
  const target = {
    center,
    angle: new Vec3(270, 4.5, Math.max(0.35, span / 180)),
  };

  if (transition) {
    state.camera.desiredCamera = target;
  } else {
    state.camera.center = target.center;
    state.camera.angle = target.angle;
  }
}

export function refreshLayout(
  state: ProgramState,
  fitCamera = false,
): void {
  state.layout = generateEinsumLayout(currentEinsumState(state));
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
  refreshLayout(state);
}

export function selectPreset(
  state: ProgramState,
  index: number,
): void {
  if (index < 0 || index >= state.presets.length) {
    return;
  }
  state.currentPresetIndex = index;
  refreshLayout(state, true);
}

export function initProgramState(): ProgramState {
  const presets = createPresets();
  const state: ProgramState = {
    presets,
    currentPresetIndex: 0,
    render: null,
    camera: createCamera(),
    layout: generateEinsumLayout(presets[0].state),
    mouse: { mousePos: new Vec3() },
    display: { hoverTarget: null },
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

export function runEinsumProgram(
  view: IRenderView,
  state: ProgramState,
): void {
  const render = state.render;
  if (!render) {
    return;
  }

  const startedAt = performance.now();
  resetRenderBuffers(render);
  render.sharedRender.activePhase = RenderPhase.Opaque;
  state.display.hoverTarget = null;
  for (const cube of state.layout.cubes) {
    cube.highlight = 0;
  }

  genModelViewMatrices(state);
  updateCamera(state, view);

  const previousGpuMs = beginQueryAndGetPrevMs(
    render.queryManager,
    'render',
  );
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
