import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from 'react';

export function useFunctionRef<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
): RefObject<(...args: Args) => Result>;
export function useFunctionRef<Args extends unknown[], Result>(
  fn: ((...args: Args) => Result) | undefined,
): RefObject<((...args: Args) => Result) | undefined>;
export function useFunctionRef<Args extends unknown[], Result>(
  fn: ((...args: Args) => Result) | undefined,
): RefObject<((...args: Args) => Result) | undefined> {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  }, [fn]);
  return ref;
}

export class Subscriptions {
  private readonly subscribers = new Set<() => void>();
  private version = 0;

  subscribe = (subscriber: () => void): (() => void) => {
    this.subscribers.add(subscriber);
    return () => {
      this.subscribers.delete(subscriber);
    };
  };

  getSnapshot = (): number => this.version;

  notify = (): void => {
    this.version += 1;
    for (const subscriber of this.subscribers) {
      subscriber();
    }
  };
}

export function useSubscriptions(subscription: Subscriptions): void {
  useSyncExternalStore(
    subscription.subscribe,
    subscription.getSnapshot,
    subscription.getSnapshot,
  );
}
