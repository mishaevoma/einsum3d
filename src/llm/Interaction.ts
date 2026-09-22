import { clamp } from '@/src/utils/data';
import { Vec3, Vec4 } from '@/src/utils/vector';
import type { TensorBlock } from './layout/types';
import type { ProgramState } from './program/types';

function rayBoxIntersection(
  min: Vec3,
  max: Vec3,
  origin: Vec3,
  direction: Vec3,
): number {
  const tx1 = (min.x - origin.x) / direction.x;
  const tx2 = (max.x - origin.x) / direction.x;
  let near = Math.min(tx1, tx2);
  let far = Math.max(tx1, tx2);

  const ty1 = (min.y - origin.y) / direction.y;
  const ty2 = (max.y - origin.y) / direction.y;
  near = Math.max(near, Math.min(ty1, ty2));
  far = Math.min(far, Math.max(ty1, ty2));

  const tz1 = (min.z - origin.z) / direction.z;
  const tz2 = (max.z - origin.z) / direction.z;
  near = Math.max(near, Math.min(tz1, tz2));
  far = Math.min(far, Math.max(tz1, tz2));

  return far >= Math.max(near, 0) ? Math.max(near, 0) : -1;
}

function cellAtPoint(block: TensorBlock, point: Vec3): Vec3 {
  return new Vec3(
    Math.floor(
      clamp((point.x - block.x) / block.dx, 0, 1 - Number.EPSILON) *
        block.cx,
    ),
    Math.floor(
      clamp((point.y - block.y) / block.dy, 0, 1 - Number.EPSILON) *
        block.cy,
    ),
    Math.floor(
      clamp((point.z - block.z) / block.dz, 0, 1 - Number.EPSILON) *
        block.cz,
    ),
  );
}

export function runMouseHitTesting(state: ProgramState): void {
  const render = state.render;
  if (!render || render.size.x <= 0 || render.size.y <= 0 || state.mouse.mousePos.x < 0 || state.mouse.mousePos.y < 0) {
    return;
  }

  const normalizedX = (state.mouse.mousePos.x / render.size.x) * 2 - 1;
  const normalizedY = 1 - (state.mouse.mousePos.y / render.size.y) * 2;
  const inverseView = state.camera.viewMtx.invert();
  const inverseModel = state.camera.modelMtx.invert();
  const toModel = (point: Vec4) =>
    inverseModel.mulVec4(inverseView.mulVec4(point)).projToVec3();

  const rayOrigin = toModel(new Vec4(normalizedX, normalizedY, -1, 1));
  const rayEnd = toModel(new Vec4(normalizedX, normalizedY, 1, 1));
  const direction = rayEnd.sub(rayOrigin).normalize();

  let closest:
    | { block: TensorBlock; distance: number; point: Vec3 }
    | undefined;
  for (const block of state.layout.cubes) {
    const min = new Vec3(block.x, block.y, block.z);
    const max = new Vec3(
      block.x + block.dx,
      block.y + block.dy,
      block.z + block.dz,
    );
    const distance = rayBoxIntersection(min, max, rayOrigin, direction);
    if (
      distance >= 0 &&
      (!closest || distance < closest.distance)
    ) {
      closest = {
        block,
        distance,
        point: rayOrigin.add(direction.mul(distance)),
      };
    }
  }

  if (closest) {
    closest.block.highlight = 0.65;
    state.display.hoverTarget = {
      block: closest.block,
      cell: cellAtPoint(closest.block, closest.point),
    };
  }
}
