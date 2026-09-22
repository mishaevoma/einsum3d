import { Mat4f } from "@/src/utils/matrix";
import { Vec3 } from "@/src/utils/vector";
import { IRenderView } from "./render/modelRender";
import { clamp } from "../utils/data";
import type { ProgramState } from "./program/types";

export interface ICamera {
    camPos: Vec3;
    camPosModel: Vec3;
    lookAtMtx: Mat4f;
    viewMtx: Mat4f;
    modelMtx: Mat4f;
    center: Vec3;
    angle: Vec3; // x = degrees about z axis, y = degrees above the x-y plane; z = zoom

    centerDesired?: Vec3;
    // separated into rotation & zoom since they behave differently, and we want to control them separately
    // probably should just split out the zoom into a separate variable
    angleDesired?: Vec3;
    angleZDesired?: number;

    desiredCamera?: ICameraPos;
    desiredCameraTransition?: {
        t: number;
        initialPos: ICameraPos;
        targetPos: ICameraPos;
    },

    transition: {
        centerT?: number;
        angleT?: number;
        angleZT?: number;

        centerInit?: Vec3;
        angleInit?: Vec3;
        angleZInit?: number;
    }
}

export interface ICameraPos {
    center: Vec3;
    angle: Vec3;
}


export function cameraToMatrixView(camera: ICamera) {
    while (camera.angle.x < 0) camera.angle.x += 360;
    while (camera.angle.x > 360) camera.angle.x -= 360;

    const camZoom = camera.angle.z;
    const angleX = camera.angle.x * Math.PI / 180;
    const angleY = camera.angle.y * Math.PI / 180;

    const dist = 200 * camZoom;
    const camZ = dist * Math.sin(angleY);
    const camX = dist * Math.cos(angleY) * Math.cos(angleX);
    const camY = dist * Math.cos(angleY) * Math.sin(angleX);

    const camLookat = camera.center;
    const camPos = new Vec3(camX, camY, camZ).add(camLookat);

    return {
        lookAt: Mat4f.fromLookAt(camPos, camLookat, new Vec3(0, 0, 1)),
        camPos,
    };
}

export function genModelViewMatrices(state: ProgramState) {
    if (!state.render) {
        return;
    }
    const { camera } = state;

    const { lookAt, camPos } = cameraToMatrixView(camera);

    const distance = camera.angle.z * 200;
    const persp = Mat4f.fromPersp(40, state.render.size.x / Math.max(1, state.render.size.y), Math.max(0.01, distance / 1000), Math.max(1000, distance * 10));
    const viewMtx = persp.mul(lookAt);
    const modelMtx = new Mat4f();
    modelMtx[0] = 1.0;
    modelMtx[5] = 0.0;
    modelMtx[6] = -1.0;
    modelMtx[9] = -1.0;
    modelMtx[10] = 0.0;

    state.camera.modelMtx = modelMtx;
    state.camera.viewMtx = viewMtx;
    state.camera.camPos = camPos;
    state.camera.camPosModel = modelMtx.invert().mulVec3Affine(camPos);
    state.camera.lookAtMtx = lookAt;
}

export function camScaleToScreen(state: ProgramState, modelPt: Vec3) {
    if (!state.render) {
        return 1;
    }
    const camDist = state.camera.camPosModel.dist(modelPt);
    return camDist / state.render.size.y * 5.0;
}

export function cameraMoveToDesired(camera: ICamera, dt: number) {

    // This is making me nauseous. Gonna do jump-to instead of smooth transition for now.

    // We'll use the velocity to check if we've applied the desired value, so we know when to
    // modify the main camera
    const duration = 1000 * 1;

    if (camera.centerDesired && camera.transition.centerT === undefined) {
        camera.transition.centerInit = camera.center;
        camera.transition.centerT = 0.0;
    }
    if (camera.transition.centerT !== undefined) {
        camera.transition.centerT += dt / duration;
        if (camera.transition.centerT > 1.0) {
            camera.transition.centerT = undefined;
            camera.transition.centerInit = undefined;
            camera.centerDesired = undefined;
        } else if (camera.transition.centerInit && camera.centerDesired) {
            camera.center = camera.transition.centerInit!.lerp(camera.centerDesired!, camera.transition.centerT);
        }
    }

    if (camera.angleDesired && camera.transition.angleT === undefined) {
        camera.transition.angleInit = camera.angle;
        camera.transition.angleT = 0.0;
    }
    if (camera.transition.angleT !== undefined) {
        camera.transition.angleT += dt / duration;
        if (camera.transition.angleT > 1.0) {
            camera.transition.angleT = undefined;
            camera.transition.angleInit = undefined;
            camera.angleDesired = undefined;
        } else if (camera.transition.angleInit && camera.angleDesired) {
            camera.angle = camera.transition.angleInit!.lerp(camera.angleDesired!, camera.transition.angleT);
        }
    }
}

export function updateCamera(state: ProgramState, view: IRenderView) {

    const transition = state.camera.desiredCameraTransition;

    if (transition) {
        if (transition.t < 1) {
            transition.t = clamp(transition.t + view.dt / 1000 * 1.5, 0, 1);
            const src = transition.initialPos;
            const dest = transition.targetPos;

            state.camera.angle = src.angle.lerp(dest.angle, transition.t);
            state.camera.center = src.center.lerp(dest.center, transition.t);
            view.markDirty();
        } else {
            state.camera.desiredCameraTransition = undefined;
        }
    }

    // take a frame before we start moving the camera
    if (state.camera.desiredCamera) {
        state.camera.desiredCameraTransition = {
            t: 0,
            initialPos: {
                center: state.camera.center,
                angle: state.camera.angle,
            },
            targetPos: state.camera.desiredCamera,
        }
        state.camera.desiredCamera = undefined;
        view.markDirty();
    }
}


export interface ISpringConfig {
    tension: number;
    mass: number;
    friction?: number;
    extra?: number;
}

export function applySpringStep(pos: Vec3, target: Vec3, vel: Vec3 | null | undefined, dt: number, config: ISpringConfig) {
    // default to critically damped
    const friction = config.friction ?? 2 * Math.sqrt(config.mass * config.tension);
    const dtS = dt / 1000;
    vel = vel ?? new Vec3();
    const dist = pos.sub(target);
    const springExtra = dist.lenSq() === 0.0 ? new Vec3() : dist.normalize().mul(config.extra ?? 0);
    const springF = (dist.add(springExtra)).mul(-config.tension);
    const dampF = vel.mul(-friction);
    const accel = springF.add(dampF).mul(1.0 / config.mass);

    vel = vel.add(accel.mul(dtS));
    pos = pos.add(vel.mul(dtS));
    return { pos, vel };
}
