import React, { useMemo } from 'react';
import type { PropsWithChildren } from 'react';

import { createContext } from 'src/core/contexts/context';
import { BaseLayoutNode } from 'src/utils/layout/LayoutNode';
import type { CompExternal, CompInternal, CompTypes } from 'src/layout/layout';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { LayoutPage } from 'src/utils/layout/LayoutPage';
import type { HiddenState, HiddenStateNode, HiddenStatePage } from 'src/utils/layout/NodesContext';
import type { BaseRow } from 'src/utils/layout/types';

export type ChildMutator<T extends CompTypes = CompTypes> = (item: CompExternal<T>) => void;

export interface ChildrenMap {
  [parentId: string]: string[];
}

type PageProviderProps = Pick<NodesGeneratorContext, 'layoutMap' | 'childrenMap'> & {
  hidden: HiddenStatePage;
  parent: LayoutPage;
};

type NodeGeneratorProps = Pick<NodesGeneratorContext, 'directMutators' | 'recursiveMutators'> & {
  hidden: Omit<HiddenStateNode, 'parent'>;
  item: CompInternal;
  parent: LayoutNode;
};

type RowGeneratorProps = Pick<NodesGeneratorContext, 'directMutators' | 'recursiveMutators'> & {
  row: BaseRow;
};

interface NodesGeneratorContext {
  directMutators?: ChildMutator[];
  recursiveMutators?: ChildMutator[];
  layoutMap: Record<string, CompExternal>;
  childrenMap: ChildrenMap;
  hidden: HiddenState;
  parent: LayoutNode | LayoutPage;
  item: CompInternal | undefined;
  claimedChildren: Set<string>;
  row: BaseRow | undefined;
  page: LayoutPage;
  depth: number; // Depth is 1 for top level nodes, 2 for children of top level nodes, etc.
}

const { Provider, useCtx } = createContext<NodesGeneratorContext>({
  name: 'NodesGenerator',
  required: true,
});

const emptyArray: never[] = [];

/**
 * This provider will use upper contexts to set the hidden and depth values, as well as inherit recursive
 * mutators from the parent. This way we can have a single recursive mutator that is applied to all children, no
 * matter how many levels of context providers we have.
 */
export function NodesGeneratorProvider({ children, ...rest }: PropsWithChildren<NodeGeneratorProps>) {
  const parent = useCtx();
  const value: NodesGeneratorContext = useMemo(
    () => ({
      // Inherit all values from the parent, overwrite with our own if they are passed
      ...parent,
      ...rest,

      // Direct mutators and rows are not meant to be inherited, if none are passed to us directly we'll reset
      directMutators: rest.directMutators ?? emptyArray,
      row: parent.row ?? undefined,

      // If the parent is hidden, we are also hidden. The default is false, and every component inside a hidden one
      // will be marked as hidden as well.
      hidden: {
        parent: parent.hidden,
        ...rest.hidden,
      },

      recursiveMutators: parent.recursiveMutators
        ? [...parent.recursiveMutators, ...(rest.recursiveMutators ?? [])]
        : rest.recursiveMutators,

      depth: parent.depth + 1,
    }),
    [parent, rest],
  );

  return <Provider value={value}>{children}</Provider>;
}

export function NodesGeneratorPageProvider({ children, ...rest }: PropsWithChildren<PageProviderProps>) {
  const value: NodesGeneratorContext = useMemo(
    () => ({
      page: rest.parent,
      claimedChildren: new Set(Object.values(rest.childrenMap).flat()),
      item: undefined,
      row: undefined,

      // For a page, the depth starts at 1 because in principle the page is the top level node, at depth 0, so
      // when a page provides a depth indicator to its children (the top level components on that page), it should be 1.
      depth: 1,

      ...rest,
    }),
    [rest],
  );

  return <Provider value={value}>{children}</Provider>;
}

export function NodesGeneratorRowProvider({
  children,
  row,
  directMutators,
  recursiveMutators,
}: PropsWithChildren<RowGeneratorProps>) {
  const parent = useCtx();
  const value: NodesGeneratorContext = useMemo(
    () => ({
      // Inherit all values from the parent, overwrite with our own if they are passed
      ...parent,
      row,

      // Direct mutators and rows are not meant to be inherited, if none are passed to us directly we'll reset
      directMutators: directMutators ?? emptyArray,
      recursiveMutators: parent.recursiveMutators
        ? [...parent.recursiveMutators, ...(recursiveMutators ?? [])]
        : recursiveMutators,

      // TODO: Support hidden rows
    }),
    [parent, directMutators, recursiveMutators, row],
  );
  return <Provider value={value}>{children}</Provider>;
}

export const NodeGeneratorInternal = {
  useDirectMutators: () => useCtx().directMutators ?? emptyArray,
  useRecursiveMutators: () => useCtx().recursiveMutators ?? emptyArray,
  useHiddenState: () => useCtx().hidden,
  useDepth: () => useCtx().depth,
  useLayoutMap: () => useCtx().layoutMap,
  useChildrenMap: () => useCtx().childrenMap,
  useClaimedChildren: () => useCtx().claimedChildren,
  useParent: () => useCtx().parent,
  usePage: () => useCtx().page,
  useRow: () => useCtx().row,
  useItem: () => useCtx().item,
  useExternalItem: () => {
    const parent = useCtx().parent;
    const map = useCtx().layoutMap;

    if (parent instanceof BaseLayoutNode && map[parent.getBaseId()]) {
      return map[parent.getBaseId()] as CompExternal;
    }

    return undefined;
  },
};