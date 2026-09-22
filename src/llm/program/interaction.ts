import { clamp } from '@/src/utils/data';
import { Vec3 } from '@/src/utils/vector';
import type { ProgramState } from './types';

// Canvas state is deliberately mutable and lives outside React. Keep writes
// here so camera movement never publishes an editor-state change.
export function cancelCameraTransition(state: ProgramState): void {
    state.camera.desiredCamera = undefined;
    state.camera.desiredCameraTransition = undefined;
}

export function zoomCamera(state: ProgramState, factor: number): void {
    cancelCameraTransition(state);
    state.camera.angle.z = clamp(state.camera.angle.z * factor, 0.01, 100000);
    state.markDirty();
}

export function orbitCamera(state: ProgramState, dx: number, dy: number): void {
    cancelCameraTransition(state);
    state.camera.angle.x -= dx * 0.4;
    state.camera.angle.y = clamp(state.camera.angle.y + dy * 0.4, -85, 85);
    state.markDirty();
}

export function panCamera(
    state: ProgramState,
    dx: number,
    dy: number,
    height: number,
): void {
    cancelCameraTransition(state);
    const azimuth = (state.camera.angle.x * Math.PI) / 180;
    const elevation = (state.camera.angle.y * Math.PI) / 180;
    const scale =
        (state.camera.angle.z * 400 * Math.tan((20 * Math.PI) / 180)) /
        Math.max(1, height);
    const right = new Vec3(-Math.sin(azimuth), Math.cos(azimuth), 0);
    const up = new Vec3(
        -Math.cos(azimuth) * Math.sin(elevation),
        -Math.sin(azimuth) * Math.sin(elevation),
        Math.cos(elevation),
    );
    state.camera.center = state.camera.center
        .add(right.mul(-dx * scale))
        .add(up.mul(dy * scale));
    state.markDirty();
}

export function movePointer(state: ProgramState, x: number, y: number): void {
    state.mouse.mousePos = new Vec3(x, y);
    state.markDirty();
}

export function frontCamera(state: ProgramState): void {
    cancelCameraTransition(state);
    state.camera.angle = new Vec3(270, 0, state.camera.angle.z);
    state.markDirty();
}

export function focusDimension(state: ProgramState, dimension: string): void {
    state.display.focusDimension =
        state.display.focusDimension === dimension ? null : dimension;
    state.markDirty();
    state.htmlSubs.notify();
}
