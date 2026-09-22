'use client';

import { Icon } from '@/src/app/Icon';
import { zoomCamera, frontCamera } from '../program/interaction';
import { fitCameraToLayout } from '../program/EinsumProgram';
import { useProgramState } from '../Sidebar';
import s from '../LayerView.module.scss';

export function ModelSelectorToolbar() {
    const program = useProgramState(false);
    return (
        <div className={s.toolbar} aria-label="Camera controls">
            <button
                type="button"
                title="Fit visualization to view (F)"
                aria-label="Fit visualization to view"
                onClick={() => {
                    fitCameraToLayout(program);
                    program.markDirty();
                }}
            >
                <Icon name="expand" size={15} />
                <span>Fit view</span>
                <kbd>F</kbd>
            </button>
            <span className={s.toolDivider} />
            <button
                type="button"
                title="Front view"
                aria-label="Front view"
                onClick={() => {
                    fitCameraToLayout(program, false);
                    frontCamera(program);
                    program.markDirty();
                }}
            >
                2D
            </button>
            <button
                type="button"
                title="Perspective view"
                aria-label="Perspective view"
                onClick={() => {
                    fitCameraToLayout(program);
                    program.markDirty();
                }}
            >
                3D
            </button>
            <span className={s.toolDivider} />
            <button
                type="button"
                aria-label="Zoom out"
                onClick={() => zoomCamera(program, 1.2)}
            >
                <Icon name="minus" size={15} />
            </button>
            <button
                type="button"
                aria-label="Zoom in"
                onClick={() => zoomCamera(program, 1 / 1.2)}
            >
                <Icon name="plus" size={15} />
            </button>
        </div>
    );
}
