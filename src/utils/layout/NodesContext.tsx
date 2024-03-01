import React, { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

import { createStore } from 'zustand';

import { createZustandContext } from 'src/core/contexts/zustandContext';
import { Loader } from 'src/core/loading/Loader';
import {
  runExpressionRules,
  runExpressionsForLayouts,
  shouldUpdate,
} from 'src/features/form/dynamics/conditionalRenderingSagas';
import { useDynamics } from 'src/features/form/dynamics/DynamicsContext';
import { useHiddenLayoutsExpressions } from 'src/features/form/layout/LayoutsContext';
import { usePageNavigationContext } from 'src/features/form/layout/PageNavigationContext';
import { runConditionalRenderingRules } from 'src/utils/conditionalRendering';
import { _private, useExpressionDataSources } from 'src/utils/layout/hierarchy';
import { BaseLayoutNode } from 'src/utils/layout/LayoutNode';
import type { LayoutNodeFromObj } from 'src/layout/layout';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { LayoutPages } from 'src/utils/layout/LayoutPages';

interface NodesContext {
  nodes: LayoutPages | undefined;
  hiddenComponents: Set<string>;
  setNodes: (nodes: LayoutPages) => void;
  setHiddenComponents: (mutator: (hidden: Set<string>) => Set<string>) => void;
}

function initialCreateStore() {
  return createStore<NodesContext>((set) => ({
    nodes: undefined,
    setNodes: (nodes: LayoutPages) => set({ nodes }),
    hiddenComponents: new Set(),
    setHiddenComponents: (mutator: (hidden: Set<string>) => Set<string>) =>
      set((state) => ({ hiddenComponents: mutator(state.hiddenComponents) })),
  }));
}

const { Provider, useSelector, useMemoSelector, useSelectorAsRef, useLaxSelectorAsRef } = createZustandContext({
  name: 'Nodes',
  required: true,
  initialCreateStore,
});

export const NodesProvider = (props: React.PropsWithChildren) => (
  <Provider>
    <InnerNodesProvider />
    <InnerHiddenComponentsProvider />
    <BlockUntilLoaded>{props.children}</BlockUntilLoaded>
  </Provider>
);

function InnerNodesProvider() {
  const hidden = useSelector((state) => state.hiddenComponents);
  const resolvedNodes = _private.useResolvedExpressions(hidden);
  const setNodes = useSelector((state) => state.setNodes);

  useEffect(() => {
    setNodes(resolvedNodes);
  }, [setNodes, resolvedNodes]);

  return null;
}

function InnerHiddenComponentsProvider() {
  const hidden = useSelector((state) => state.hiddenComponents);
  const setHidden = useSelector((state) => state.setHiddenComponents);
  const resolvedNodes = useSelector((state) => state.nodes);

  useLegacyHiddenComponents(resolvedNodes, hidden, setHidden);

  return null;
}

function BlockUntilLoaded({ children }: PropsWithChildren) {
  const hasNodes = useMemoSelector((state) => !!state.nodes);
  if (!hasNodes) {
    return <Loader reason='nodes' />;
  }
  return <>{children}</>;
}

/**
 * Use the expression context. This will return a LayoutPages object containing the full tree of resolved
 * nodes (meaning, instances of layout components in a tree, with their expressions evaluated and resolved to
 * scalar values).
 *
 * Usually, if you're looking for a specific component/node, useResolvedNode() is better.
 */
export const useNode = (id: string) => useSelector((s) => s.nodes?.findById(id));
export const useNodes = () => useSelector((s) => s.nodes!);
export const useNodesAsRef = () => useSelectorAsRef((s) => s.nodes!);
export const useNodesAsLaxRef = () => useLaxSelectorAsRef((s) => s.nodes!);

export function useNodesMemoSelector<U>(selector: (s: LayoutPages) => U) {
  return useMemoSelector((state) => selector(state.nodes!));
}

export const useHiddenComponents = () => useSelector((s) => s.hiddenComponents);

/**
 * Given a selector, get a LayoutNode object
 *
 * @param selector This can be one of:
 *  - A component-like structure, such as ILayoutComponent, or ILayoutCompInput. The 'id' property is used to find the
 *    corresponding LayoutNode object for you, while also inferring a more specific type (if you have one).
 *  - A component id, like 'currentValue-0' for the 'currentValue' component in the first row of the repeating group it
 *    belongs to. If you only provide 'currentValue', and the component is still inside a repeating group, most likely
 *    you'll get the first row item as a result.
 */
export function useResolvedNode<T>(selector: string | undefined | T | LayoutNode): LayoutNodeFromObj<T> | undefined {
  const nodes = useNodes();

  if (typeof selector === 'object' && selector !== null && selector instanceof BaseLayoutNode) {
    return selector as any;
  }

  if (typeof selector === 'string') {
    return nodes?.findById(selector) as any;
  }

  if (typeof selector == 'object' && selector !== null && 'id' in selector && typeof selector.id === 'string') {
    return nodes?.findById(selector.id) as any;
  }

  return undefined;
}

/**
 * This hook replaces checkIfConditionalRulesShouldRunSaga(), and fixes a problem that was hard to solve in sagas;
 * namely, that expressions that cause a component to suddenly be visible might also cause other component lookups
 * to start producing a value, so we don't really know how many times we need to run the expressions to reach
 * a stable state. As React hooks are...reactive, we can just run the expressions again when the data changes, and
 * thus continually run the expressions until they stabilize. You _could_ run into an infinite loop if you
 * have a circular dependency in your expressions, but that's a problem with your form, not this hook.
 */
function useLegacyHiddenComponents(
  resolvedNodes: LayoutPages | undefined,
  hidden: Set<string>,
  setHidden: React.Dispatch<React.SetStateAction<Set<string>>>,
) {
  const rules = useDynamics()?.conditionalRendering ?? null;
  const dataSources = useExpressionDataSources(hidden);
  const hiddenExpr = useHiddenLayoutsExpressions();
  const { setHiddenPages, hidden: hiddenPages } = usePageNavigationContext();

  useEffect(() => {
    if (!resolvedNodes) {
      return;
    }

    const currentHiddenLayouts = new Set<string>(hiddenPages);
    const futureHiddenLayouts = runExpressionsForLayouts(resolvedNodes, hiddenExpr, dataSources);

    if (shouldUpdate(currentHiddenLayouts, futureHiddenLayouts)) {
      setHiddenPages([...futureHiddenLayouts.values()]);
    }

    let futureHiddenFields: Set<string>;
    try {
      futureHiddenFields = runConditionalRenderingRules(rules, resolvedNodes);
    } catch (error) {
      window.logError('Error while evaluating conditional rendering rules:\n', error);
      futureHiddenFields = new Set();
    }

    runExpressionRules(resolvedNodes, futureHiddenFields);

    // Add all fields from hidden layouts to hidden fields
    for (const layout of futureHiddenLayouts) {
      for (const node of resolvedNodes.findLayout(layout)?.flat(true) || []) {
        if (!futureHiddenFields.has(node.item.id)) {
          futureHiddenFields.add(node.item.id);
        }
      }
    }

    setHidden((currentlyHidden) => {
      if (shouldUpdate(currentlyHidden, futureHiddenFields)) {
        return new Set([...futureHiddenFields.values()]);
      }
      return currentlyHidden;
    });
  }, [dataSources, hiddenPages, hiddenExpr, resolvedNodes, rules, setHiddenPages, setHidden]);
}
