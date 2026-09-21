import React, { useState, useCallback } from "react";
import { useProgramState } from "./Sidebar";
import { clamp } from "@/src/utils/data";
import { useGlobalDrag, useTouchEvents } from "@/src/utils/pointer";
import { Vec3 } from "@/src/utils/vector";
import s from './LayerView.module.scss';
import type { ProgramState } from "./program/types";

export const CanvasEventSurface: React.FC<{
    children?: React.ReactNode;
}> = ({ children }) => {
    const [eventSurfaceEl, setEventSurfaceEl] = useState<HTMLDivElement | null>(null);
    const progState = useProgramState();

    const updateRenderState = useCallback((fn: (ps: ProgramState) => void) => {
        fn(progState);
        progState.markDirty();
    }, [progState]);

    function pan(initial: { camAngle: Vec3, camTarget: Vec3 }, dx: number, dy: number) {
        const camAngle = initial.camAngle;
        const target = initial.camTarget.clone();
        target.z = target.z + dy * 0.1 * camAngle.z; // @TODO: clamp to the bounding box of the model
        const sideMul = Math.sin(camAngle.x * Math.PI / 180) > 0 ? 1 : -1;
        target.x = target.x + sideMul * dx * 0.1 * camAngle.z;

        updateRenderState(ps => {
            ps.camera.center = target;
        });
    }

    function rotate(initial: { camAngle: Vec3, camTarget: Vec3 }, dx: number, dy: number) {
        const camAngle = initial.camAngle.clone();
        const degPerPixel = 0.5;
        camAngle.x = camAngle.x - dx * degPerPixel;
        camAngle.y = clamp(camAngle.y + dy * degPerPixel, -87, 87);
        updateRenderState(ps => {
            ps.camera.angle = camAngle;
        });
    }

    function zoom(initial: { camAngle: Vec3, camTarget: Vec3 }, dy: number) {
        const camAngle = initial.camAngle.clone();
        camAngle.z = clamp(camAngle.z / dy, 0.1, 100000);
        updateRenderState(ps => {
            ps.camera.angle = camAngle;
        });
    }

    const [dragStart, setDragStart] = useGlobalDrag<{ camAngle: Vec3, camTarget: Vec3 }>(function handleMove(ev, ds) {
        const dx = ev.clientX - ds.clientX;
        const dy = ev.clientY - ds.clientY;

        if (!ds.shiftKey && !(ds.button === 1 || ds.button === 2)) {
            pan(ds.data, dx, dy);
        } else {
            rotate(ds.data, dx, dy);
        }

        ev.preventDefault();
    });

    useTouchEvents(eventSurfaceEl, { camAngle: progState.camera.angle, camTarget: progState.camera.center }, { alwaysSendDragEvent: true },
        function handle1PointDrag(ev, ds) {
            const dsTouch0 = ds.touches[0];
            const evTouch0 = ev.touches[0];
            const dx = evTouch0.clientX - dsTouch0.clientX;
            const dy = evTouch0.clientY - dsTouch0.clientY;
            pan(ds.data, dx, dy);
            ev.preventDefault();
    },  function handle2PointDrag(ev, ds) {
            const dsTouch0 = ds.touches[0];
            const dsTouch1 = ds.touches[1];
            const evTouch0 = ev.touches[0];
            const evTouch1 = ev.touches[1];
            const dsMidX = (dsTouch0.clientX + dsTouch1.clientX) / 2;
            const dsMidY = (dsTouch0.clientY + dsTouch1.clientY) / 2;
            const evMidX = (evTouch0.clientX + evTouch1.clientX) / 2;
            const evMidY = (evTouch0.clientY + evTouch1.clientY) / 2;
            const dx = evMidX - dsMidX;
            const dy = evMidY - dsMidY;
            const dsDist = Math.sqrt((dsTouch0.clientX - dsTouch1.clientX) ** 2 + (dsTouch0.clientY - dsTouch1.clientY) ** 2);
            const evDist = Math.sqrt((evTouch0.clientX - evTouch1.clientX) ** 2 + (evTouch0.clientY - evTouch1.clientY) ** 2);
            rotate(ds.data, dx, dy);
            // pan(ds.data, dx, dy);
            zoom(ds.data, evDist / dsDist);
            ev.preventDefault();
    });

    function handleMouseDown(ev: React.MouseEvent) {
        if (progState) {
            setDragStart(ev, { camAngle: progState.camera.angle, camTarget: progState.camera.center });
        }
    }

    function handleMouseMove(ev: React.MouseEvent) {
        if (progState.render) {
            const canvasBcr = progState.render.canvasEl.getBoundingClientRect();
            const mousePos = new Vec3(ev.clientX - canvasBcr.left, ev.clientY - canvasBcr.top, 0);
            updateRenderState(ps => {
                ps.mouse.mousePos = mousePos;
            });
        }
    }

    function handleWheel(ev: React.WheelEvent) {
        if (progState) {
            const camAngle = progState.camera.angle;
            const zoom = clamp(camAngle.z * Math.pow(1.0013, ev.deltaY), 0.01, 100000);
            updateRenderState(rs => {
                rs.camera.angle = new Vec3(camAngle.x, camAngle.y, zoom);
            });
        }
        ev.stopPropagation();
    }

    if (!progState.render) {
        return null;
    }

    return <div
        ref={setEventSurfaceEl}
        className={s.canvasEventSurface}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        onContextMenu={ev => ev.preventDefault()}
        style={{ cursor: dragStart ? 'grabbing' : progState.display.hoverTarget ? 'crosshair' : 'grab' }}
    >
        {children}
    </div>;
}
