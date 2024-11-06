import { useRef } from 'react';

import { shallow } from 'zustand/shallow';

/**
 * Similar to useShallow from zustand: https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow
 * only this works on objects directly instead of selectors
 */
export function useShallowObjectMemo<T>(next: T): T {
  const prev = useRef<T>();
  return shallow(prev.current, next) ? (prev.current as T) : (prev.current = next);
}

/**
 * Similar to useShallow from zustand: https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow
 * only this does not require a store selector function
 */
export function useShallowObjectSelectorMemo<S, T = ShallowObjectSelectorReturn<S>>(
  store: S,
  selector: (store: S) => T,
): T {
  const prev = useRef<T>();
  const next = selector(store);
  return shallow(prev.current, next) ? (prev.current as T) : (prev.current = next);
}
export type ShallowObjectSelectorReturn<S> = Partial<S> | S[keyof S][];
