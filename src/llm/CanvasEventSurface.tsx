import {
    useEffect,
    useRef,
    useState,
    type PointerEvent,
    type KeyboardEvent,
} from 'react';
import { useProgramState } from './Sidebar';
import { clamp } from '@/src/utils/data';
import {
    cancelCameraTransition,
    zoomCamera,
    orbitCamera,
    panCamera,
    movePointer,
} from './program/interaction';
import { fitCameraToLayout } from './program/EinsumProgram';
import s from './LayerView.module.scss';

type Point = { x: number; y: number };

export function CanvasEventSurface() {
    const program = useProgramState(false);
    const [surface, setSurface] = useState<HTMLDivElement | null>(null);
    const pointers = useRef(new Map<number, Point>());

    useEffect(() => {
        if (!surface) return;
        const wheel = (event: WheelEvent) => {
            event.preventDefault();
            const delta =
                event.deltaY *
                (event.deltaMode === 1
                    ? 16
                    : event.deltaMode === 2
                      ? surface.clientHeight
                      : 1);
            zoomCamera(program, Math.exp(clamp(delta, -400, 400) * 0.0018));
        };
        surface.addEventListener('wheel', wheel, { passive: false });
        return () => surface.removeEventListener('wheel', wheel);
    }, [surface, program]);

    function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
        const rect = event.currentTarget.getBoundingClientRect();
        movePointer(
            program,
            event.clientX - rect.left,
            event.clientY - rect.top,
        );
        const previous = pointers.current.get(event.pointerId);
        if (previous) {
            const current = { x: event.clientX, y: event.clientY };
            const other = [...pointers.current.entries()].find(
                ([id]) => id !== event.pointerId,
            )?.[1];
            if (other) {
                const oldDistance = Math.hypot(
                    previous.x - other.x,
                    previous.y - other.y,
                );
                const newDistance = Math.hypot(
                    current.x - other.x,
                    current.y - other.y,
                );
                if (oldDistance > 0 && newDistance > 0)
                    zoomCamera(program, oldDistance / newDistance);
                panCamera(
                    program,
                    (current.x - previous.x) / 2,
                    (current.y - previous.y) / 2,
                    surface?.clientHeight ?? 1,
                );
            } else if (
                event.shiftKey ||
                event.buttons === 2 ||
                event.buttons === 4
            ) {
                panCamera(
                    program,
                    current.x - previous.x,
                    current.y - previous.y,
                    surface?.clientHeight ?? 1,
                );
            } else {
                orbitCamera(
                    program,
                    current.x - previous.x,
                    current.y - previous.y,
                );
            }
            pointers.current.set(event.pointerId, current);
        }
        program.markDirty();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const key = event.key.toLowerCase();
        if (
            ![
                'arrowleft',
                'arrowright',
                'arrowup',
                'arrowdown',
                '+',
                '=',
                '-',
                'f',
            ].includes(key)
        )
            return;
        event.preventDefault();
        cancelCameraTransition(program);
        if (key === 'f') fitCameraToLayout(program);
        else if (key === '+' || key === '=') zoomCamera(program, 1 / 1.15);
        else if (key === '-') zoomCamera(program, 1.15);
        else if (event.shiftKey)
            panCamera(
                program,
                key === 'arrowleft' ? -20 : key === 'arrowright' ? 20 : 0,
                key === 'arrowup' ? -20 : key === 'arrowdown' ? 20 : 0,
                surface?.clientHeight ?? 1,
            );
        else {
            orbitCamera(
                program,
                key === 'arrowleft' ? -20 : key === 'arrowright' ? 20 : 0,
                key === 'arrowup' ? -20 : key === 'arrowdown' ? 20 : 0,
            );
        }
        program.markDirty();
    }

    return (
        <div
            ref={setSurface}
            className={s.canvasEventSurface}
            tabIndex={0}
            role="region"
            aria-label="3D canvas. Drag or use arrow keys to orbit. Shift to pan. Plus and minus to zoom. F to fit."
            onPointerDown={(event) => {
                cancelCameraTransition(program);
                event.currentTarget.focus({ preventScroll: true });
                event.currentTarget.setPointerCapture(event.pointerId);
                pointers.current.set(event.pointerId, {
                    x: event.clientX,
                    y: event.clientY,
                });
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={(event) => {
                pointers.current.delete(event.pointerId);
            }}
            onPointerCancel={(event) => {
                pointers.current.delete(event.pointerId);
            }}
            onLostPointerCapture={(event) => {
                pointers.current.delete(event.pointerId);
            }}
            onPointerLeave={() => {
                movePointer(program, -1, -1);
            }}
            onDoubleClick={() => {
                fitCameraToLayout(program);
                program.markDirty();
            }}
            onKeyDown={handleKeyDown}
            onContextMenu={(event) => event.preventDefault()}
        />
    );
}
