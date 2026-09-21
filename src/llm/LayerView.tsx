'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { Resizer } from '@/src/utils/Resizer';
import { useScreenLayout } from '@/src/utils/layout';
import { Vec3 } from '@/src/utils/vector';
import { CanvasEventSurface } from './CanvasEventSurface';
import styles from './LayerView.module.scss';
import { MeinsumSidebar } from './MeinsumSidebar';
import { ModelSelectorToolbar } from './components/ModelSelectorToolbar';
import {
  attachRenderer,
  initProgramState,
  runEinsumProgram,
} from './program/EinsumProgram';
import type { ProgramState } from './program/types';
import {
  fetchFontAtlasData,
  type IFontAtlasData,
} from './render/fontRender';
import type { IRenderView } from './render/modelRender';
import { ProgramStateContext } from './Sidebar';

export function LayerView() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [fontAtlas, setFontAtlas] = useState<IFontAtlasData | null>(null);
  const [program] = useState(initProgramState);
  const [canvasRender, setCanvasRender] = useState<CanvasRender | null>(null);
  const pageLayout = useScreenLayout();

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
      return;
    }
    const resizeObserver = new ResizeObserver(() => {
      renderer.canvasSizeDirty = true;
      renderer.markDirty();
    });
    const preventWheelDefault = (event: WheelEvent) => event.preventDefault();

    resizeObserver.observe(canvas);
    canvas.addEventListener('wheel', preventWheelDefault, { passive: false });
    // The renderer requires both an attached canvas and the asynchronously
    // loaded atlas, so publishing it is part of this external-system setup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanvasRender(renderer);
    renderer.markDirty();

    return () => {
      canvas.removeEventListener('wheel', preventWheelDefault);
      resizeObserver.disconnect();
      renderer.destroy();
    };
  }, [canvas, fontAtlas, program]);

  useLayoutEffect(() => {
    canvasRender?.setPageLayout(pageLayout);
  }, [canvasRender, pageLayout]);

  const sidebar = (
    <div className={styles.sidebar}>
      <ProgramStateContext.Provider value={program}>
        <MeinsumSidebar />
      </ProgramStateContext.Provider>
    </div>
  );

  const mainView = (
    <div className={styles.canvasWrap}>
      <canvas className={styles.canvas} ref={setCanvas} />
      {canvasRender && !program.render && (
        <div className="absolute flex h-full w-full flex-col items-center justify-center">
          <div className="text-2xl">
            This application requires a WebGL2-capable browser.
          </div>
          <div className="mt-2 text-lg">
            Try the latest version of Chrome or Firefox.
          </div>
        </div>
      )}
      <ProgramStateContext.Provider value={program}>
        <CanvasEventSurface />
        {canvasRender && <ModelSelectorToolbar />}
      </ProgramStateContext.Provider>
    </div>
  );

  return (
    <div className={styles.view}>
      <Resizer
        id="einsum-sidebar"
        className="flex-1"
        vertical={!pageLayout.isDesktop}
        defaultFraction={0.4}
      >
        {pageLayout.isDesktop && sidebar}
        {mainView}
        {!pageLayout.isDesktop && sidebar}
      </Resizer>
    </div>
  );
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

  setPageLayout(layout: ProgramState['pageLayout']): void {
    this.program.pageLayout = layout;
    this.markDirty();
  }

  markDirty = (): void => {
    this.program.htmlSubs.notify();
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
      const scale = window.devicePixelRatio;
      this.canvas.width = Math.max(1, Math.round(bounds.width * scale));
      this.canvas.height = Math.max(1, Math.round(bounds.height * scale));
      render.size = new Vec3(bounds.width, bounds.height);
      this.canvasSizeDirty = false;
    }

    const view: IRenderView = {
      time,
      dt: delta,
      markDirty: this.markDirty,
    };
    runEinsumProgram(view, this.program);
    this.program.htmlSubs.notify();
  }
}
