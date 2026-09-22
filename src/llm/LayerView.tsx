'use client';

import { useEffect, useState } from 'react';
import { Vec3 } from '@/src/utils/vector';
import { CanvasEventSurface } from './CanvasEventSurface';
import styles from './LayerView.module.scss';
import { MeinsumSidebar } from './MeinsumSidebar';
import { ModelSelectorToolbar } from './components/ModelSelectorToolbar';
import {
    attachRenderer,
    fitCameraToLayout,
    initProgramState,
    runEinsumProgram,
} from './program/EinsumProgram';
import type { ProgramState } from './program/types';
import { fetchFontAtlasData, type IFontAtlasData } from './render/fontRender';
import type { IRenderView } from './render/modelRender';
import { ProgramStateContext, useProgramState } from './Sidebar';
import { SceneHeading, SceneReading } from './components/SceneDescription';

export function LayerView() {
    const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
    const [fontAtlas, setFontAtlas] = useState<IFontAtlasData | null>(null);
    const [program] = useState(initProgramState);
    const [canvasRender, setCanvasRender] = useState<CanvasRender | null>(null);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        fetchFontAtlasData()
            .then((data) => {
                if (!cancelled) {
                    setFontAtlas(data);
                }
            })
            .catch((error: unknown) => {
                console.error(error);
                if (!cancelled) setLoadError(true);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!canvas || !fontAtlas) {
            return;
        }

        let renderer: CanvasRender;
        try {
            renderer = new CanvasRender(canvas, program, fontAtlas);
        } catch (error) {
            console.error(error);
            // Renderer initialization is an external-system setup.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoadError(true);
            return;
        }
        const resizeObserver = new ResizeObserver(() => {
            renderer.canvasSizeDirty = true;
            renderer.markDirty();
        });
        const preventWheelDefault = (event: WheelEvent) =>
            event.preventDefault();

        resizeObserver.observe(canvas);
        canvas.addEventListener('wheel', preventWheelDefault, {
            passive: false,
        });
        // The renderer requires both an attached canvas and the asynchronously
        // loaded atlas, so publishing it is part of this external-system setup.
        setCanvasRender(renderer);
        renderer.markDirty();

        return () => {
            canvas.removeEventListener('wheel', preventWheelDefault);
            resizeObserver.disconnect();
            renderer.destroy();
        };
    }, [canvas, fontAtlas, program]);

    return (
        <ProgramStateContext.Provider value={program}>
            <main className={styles.view}>
                <div className={styles.sidebar}>
                    <MeinsumSidebar />
                </div>
                <section
                    className={styles.scene}
                    aria-label="Tensor visualization"
                >
                    <SceneHeading />
                    <div className={styles.canvasWrap}>
                        <div className={styles.viewport}>
                            <canvas
                                className={styles.canvas}
                                ref={setCanvas}
                                aria-label="Interactive 3D tensor shapes"
                            />
                            {canvasRender && program.render && (
                                <CanvasEventSurface />
                            )}
                        </div>
                        <SceneNotice />
                        {loadError ? (
                            <div role="alert" className={styles.fallback}>
                                The visualization could not load. Please reload
                                to try again.
                            </div>
                        ) : !canvasRender ? (
                            <div role="status" className={styles.fallback}>
                                Preparing your playground…
                            </div>
                        ) : !program.render ? (
                            <div className={styles.fallback}>
                                This application requires a WebGL2-capable
                                browser.
                                <br />
                                Try the latest version of Chrome or Firefox.
                            </div>
                        ) : (
                            <>
                                <ModelSelectorToolbar />
                                <div className={styles.gestures}>
                                    <span className={styles.desktopGestures}>
                                        Drag to orbit · Shift + drag to pan ·
                                        Scroll to zoom
                                    </span>
                                    <span className={styles.touchGestures}>
                                        One finger to orbit · Two fingers to pan
                                        & pinch
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                    <SceneReading />
                </section>
            </main>
        </ProgramStateContext.Provider>
    );
}

function SceneNotice() {
    const program = useProgramState();
    const error = program.presets[program.currentPresetIndex].state.error;
    return program.layout.notice || error ? (
        <div className={styles.sceneNotice} role="status">
            {program.layout.notice ??
                'Editing equation · showing your last valid preview'}
        </div>
    ) : null;
}

class CanvasRender {
    stopped = false;
    canvasSizeDirty = true;
    private previousTime = performance.now();
    private animationFrame = 0;
    private dirty = false;
    private waitingForSync = false;

    constructor(
        private readonly canvas: HTMLCanvasElement,
        readonly program: ProgramState,
        fontAtlas: IFontAtlasData,
    ) {
        attachRenderer(program, canvas, fontAtlas);
        this.program.markDirty = this.markDirty;
        this.program.htmlSubs.notify();
    }

    destroy(): void {
        this.stopped = true;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.program.markDirty = () => {
            this.program.htmlSubs.notify();
        };
    }

    markDirty = (): void => {
        if (this.stopped) {
            return;
        }
        this.dirty = true;
        if (!this.animationFrame) {
            this.previousTime = performance.now();
            this.animationFrame = requestAnimationFrame(this.loop);
        }
    };

    private loop = (time: number): void => {
        if ((!this.dirty && !this.waitingForSync) || this.stopped) {
            this.animationFrame = 0;
            return;
        }

        const wasDirty = this.dirty;
        this.dirty = false;
        this.waitingForSync = false;
        const delta = Math.max(8, time - this.previousTime);
        this.previousTime = time;

        this.checkSyncObjects();
        if (wasDirty || this.dirty) {
            this.render(time, delta);
        }

        this.animationFrame = requestAnimationFrame(this.loop);
    };

    private checkSyncObjects(): void {
        const render = this.program.render;
        if (!render) {
            return;
        }

        let removed = false;
        for (const object of render.syncObjects) {
            if (object.isReady) {
                removed = true;
                continue;
            }
            const status = render.gl.clientWaitSync(object.sync, 0, 0);
            if (status === render.gl.TIMEOUT_EXPIRED) {
                this.waitingForSync = true;
            } else {
                object.isReady = true;
                object.elapsedMs = performance.now() - object.startTime;
                render.gl.deleteSync(object.sync);
                removed = true;
            }
        }

        if (removed) {
            render.syncObjects = render.syncObjects.filter(
                (object) => !object.isReady,
            );
            this.dirty = true;
        }
    }

    private render(time: number, delta: number): void {
        const render = this.program.render;
        if (!render) {
            this.program.htmlSubs.notify();
            return;
        }

        if (this.canvasSizeDirty) {
            const bounds = this.canvas.getBoundingClientRect();
            const scale = Math.min(window.devicePixelRatio || 1, 2);
            this.canvas.width = Math.max(1, Math.round(bounds.width * scale));
            this.canvas.height = Math.max(1, Math.round(bounds.height * scale));
            render.size = new Vec3(bounds.width, bounds.height);
            this.canvasSizeDirty = false;
            fitCameraToLayout(this.program, false);
        }

        const view: IRenderView = {
            time,
            dt: delta,
            markDirty: this.markDirty,
        };
        runEinsumProgram(view, this.program);
    }
}
