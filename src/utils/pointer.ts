import { useCallback, useEffect, useRef, useState } from 'react';
import { useFunctionRef } from './hooks';

export interface PointerPosition {
  clientX: number;
  clientY: number;
}

export interface MouseLikeEvent extends PointerPosition {
  button: number;
  buttons: number;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  ctrlKey: boolean;
}

export interface DragStart<T> extends MouseLikeEvent {
  data: T;
}

export function useGlobalDrag<T>(
  handleMove: (
    event: MouseEvent,
    start: DragStart<T>,
    ended: boolean,
  ) => void,
): [DragStart<T> | null, (event: MouseLikeEvent, data: T) => void] {
  const [dragStart, setDragStart] = useState<DragStart<T> | null>(null);
  const handleMoveRef = useFunctionRef(handleMove);

  useEffect(() => {
    if (!dragStart) {
      return;
    }

    const move = (event: MouseEvent) => {
      handleMoveRef.current?.(event, dragStart, false);
    };
    const end = (event: MouseEvent) => {
      handleMoveRef.current?.(event, dragStart, true);
      setDragStart(null);
    };

    document.addEventListener('mousemove', move, { capture: true });
    document.addEventListener('mouseup', end, { capture: true });
    return () => {
      document.removeEventListener('mousemove', move, { capture: true });
      document.removeEventListener('mouseup', end, { capture: true });
    };
  }, [dragStart, handleMoveRef]);

  const beginDrag = useCallback((event: MouseLikeEvent, data: T) => {
    setDragStart({
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button,
      buttons: event.buttons,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      data,
    });
  }, []);

  return [dragStart, beginDrag];
}

export interface TouchSnapshot<T> {
  data: T;
  touches: PointerPosition[];
}

export interface TouchDragSnapshot<T> extends TouchSnapshot<T> {
  isDragging: boolean;
}

export interface TouchEventOptions {
  alwaysSendDragEvent?: boolean;
}

function copyTouches(touches: TouchList): PointerPosition[] {
  return Array.from(touches, (touch) => ({
    clientX: touch.clientX,
    clientY: touch.clientY,
  }));
}

function distance(left: PointerPosition, right: PointerPosition): number {
  return Math.hypot(
    right.clientX - left.clientX,
    right.clientY - left.clientY,
  );
}

export function useTouchEvents<T>(
  element: GlobalEventHandlers | null,
  data: T,
  options: TouchEventOptions,
  handleOnePoint?: (
    event: TouchEvent,
    start: TouchDragSnapshot<T>,
  ) => void,
  handleTwoPoint?: (
    event: TouchEvent,
    start: TouchSnapshot<T>,
  ) => void,
): void {
  const latestData = useRef(data);
  const start = useRef<TouchSnapshot<T> | null>(null);
  const dragging = useRef(false);
  const handleOnePointRef = useFunctionRef(handleOnePoint);
  const handleTwoPointRef = useFunctionRef(handleTwoPoint);

  useEffect(() => {
    latestData.current = data;
  }, [data]);

  useEffect(() => {
    if (!element) {
      return;
    }

    const begin = (event: TouchEvent) => {
      if (!start.current) {
        start.current = {
          data: latestData.current,
          touches: copyTouches(event.touches),
        };
        dragging.current = false;
      }
    };

    const move = (event: TouchEvent) => {
      const initial = start.current;
      if (!initial || initial.touches.length !== event.touches.length) {
        return;
      }

      if (
        !dragging.current &&
        (event.touches.length > 1 ||
          distance(event.touches[0], initial.touches[0]) >= 10)
      ) {
        dragging.current = true;
      }

      if (
        event.touches.length === 1 &&
        handleOnePointRef.current &&
        (options.alwaysSendDragEvent || dragging.current)
      ) {
        handleOnePointRef.current(event, {
          ...initial,
          isDragging: dragging.current,
        });
      } else if (
        event.touches.length === 2 &&
        handleTwoPointRef.current
      ) {
        handleTwoPointRef.current(event, initial);
      }
    };

    const finish = () => {
      start.current = null;
      dragging.current = false;
    };

    element.addEventListener('touchstart', begin, { passive: false });
    element.addEventListener('touchmove', move, { passive: false });
    element.addEventListener('touchend', finish, { passive: false });
    element.addEventListener('touchcancel', finish, { passive: false });
    return () => {
      element.removeEventListener('touchstart', begin);
      element.removeEventListener('touchmove', move);
      element.removeEventListener('touchend', finish);
      element.removeEventListener('touchcancel', finish);
    };
  }, [
    element,
    handleOnePointRef,
    handleTwoPointRef,
    options.alwaysSendDragEvent,
  ]);
}
