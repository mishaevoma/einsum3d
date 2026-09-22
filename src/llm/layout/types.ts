import type { Mat4f } from '@/src/utils/matrix';

export type BlockKind = 'operand' | 'result';

export interface BlockTextureAccess {
  src: { texture: WebGLTexture };
  channel: 'r' | 'g' | 'b';
  scale: number;
  mat: Mat4f;
  disable?: boolean;
}

export interface TensorBlock {
  idx: number;
  kind: BlockKind;
  name: string;
  tensorIndex?: number;
  label?: boolean;
  x: number;
  y: number;
  z: number;
  dx: number;
  dy: number;
  dz: number;
  cx: number;
  cy: number;
  cz: number;
  opacity: number;
  highlight: number;
  small: boolean;
  localMtx?: Mat4f;
  access?: BlockTextureAccess;
}

export interface EinsumLayout {
  cubes: TensorBlock[];
  cell: number;
  margin: number;
  height: number;
  notice?: string;
}
