'use client';

import {
  Children,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { clamp } from './data';

interface ResizerProps {
  id: string;
  className?: string;
  vertical?: boolean;
  defaultFraction?: number;
  children: ReactNode;
}

interface DragStart {
  coordinate: number;
  fraction: number;
}

export function Resizer({
  id,
  className,
  children,
  vertical = false,
  defaultFraction = 0.4,
}: ResizerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<DragStart | null>(null);
  const [fraction, setFraction] = useState(defaultFraction);
  const visibleChildren = Children.toArray(children).filter(Boolean);
  const firstChild = visibleChildren[0];
  const secondChild = visibleChildren[1];
  const hasBothChildren = Boolean(firstChild && secondChild);
  const percentage = `${fraction * 100}%`;
  const inversePercentage = `${(1 - fraction) * 100}%`;

  const coordinate = (event: ReactPointerEvent) =>
    vertical ? event.clientY : event.clientX;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      coordinate: coordinate(event),
      fraction,
    };
    event.preventDefault();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    const parent = parentRef.current;
    if (!start || !parent) {
      return;
    }
    const bounds = parent.getBoundingClientRect();
    const size = vertical ? bounds.height : bounds.width;
    if (size > 0) {
      setFraction(
        clamp(
          start.fraction + (coordinate(event) - start.coordinate) / size,
          0,
          1,
        ),
      );
    }
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStart.current = null;
  };

  return (
    <div
      id={id}
      ref={parentRef}
      className={clsx(
        'relative flex',
        className,
        vertical ? 'flex-col' : 'flex-row',
      )}
    >
      {firstChild && (
        <div
          className="flex flex-initial overflow-hidden"
          style={{ flexBasis: hasBothChildren ? percentage : '100%' }}
        >
          {firstChild}
        </div>
      )}
      {secondChild && (
        <div
          className="flex flex-initial overflow-hidden"
          style={{ flexBasis: hasBothChildren ? inversePercentage : '100%' }}
        >
          {secondChild}
        </div>
      )}
      {hasBothChildren && (
        <>
          <div
            className={clsx(
              'absolute touch-none',
              vertical
                ? 'h-4 w-full cursor-ns-resize'
                : 'h-full w-4 cursor-ew-resize',
            )}
            style={{
              transform: `translate${vertical ? 'Y' : 'X'}(-50%)`,
              top: vertical ? percentage : undefined,
              left: vertical ? undefined : percentage,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          <div
            className={clsx(
              'pointer-events-none absolute bg-slate-200',
              vertical ? 'h-0 w-full border-t' : 'h-full w-0 border-l',
            )}
            style={{
              transform: `translate${vertical ? 'Y' : 'X'}(-50%)`,
              top: vertical ? percentage : undefined,
              left: vertical ? undefined : percentage,
            }}
          />
        </>
      )}
    </div>
  );
}
