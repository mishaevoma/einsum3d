import type { EinsumPreset, EinsumState } from '@/src/einsum';
import type { Subscriptions } from '@/src/utils/hooks';
import type { ILayout } from '@/src/utils/layout';
import type { Vec3 } from '@/src/utils/vector';
import type { ICamera } from '../Camera';
import type { EinsumLayout, TensorBlock } from '../layout/types';
import type { IRenderState } from '../render/modelRender';

export interface MouseState {
  mousePos: Vec3;
}

export interface HoverTarget {
  block: TensorBlock;
  cell: Vec3;
}

export interface DisplayState {
  hoverTarget: HoverTarget | null;
  focusDimension: string | null;
}

export interface ProgramState {
  presets: EinsumPreset[];
  previewStates: EinsumState[];
  currentPresetIndex: number;
  render: IRenderState | null;
  camera: ICamera;
  layout: EinsumLayout;
  mouse: MouseState;
  display: DisplayState;
  pageLayout: ILayout;
  htmlSubs: Subscriptions;
  markDirty: () => void;
}
