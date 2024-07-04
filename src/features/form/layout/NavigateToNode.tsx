import React, { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { PropsWithChildren } from 'react';

import { createContext } from 'src/core/contexts/context';
import { SearchParams, useNavigationParams } from 'src/hooks/useNavigatePage';
import { TabSearchParams } from 'src/layout/Tabs/Tabs';
import { BaseLayoutNode, type LayoutNode } from 'src/utils/layout/LayoutNode';
import { useNodesAsRef } from 'src/utils/layout/NodesContext';
import { useIsStatelessApp } from 'src/utils/useIsStatelessApp';

type NavigationHandler = (node: LayoutNode) => boolean;
export type FinishNavigationHandler = (node: LayoutNode, whenHit: () => void) => Promise<NavigationResult | void>;

export enum NavigationResult {
  Timeout = 'timeout',
  NodeIsHidden = 'nodeIsHidden',
  SuccessfulNoFocus = 'successfulNoFocus',
  SuccessfulFailedToRender = 'successfulFailedToRender',
  SuccessfulWithFocus = 'successfulWithFocus',
}

interface NodeNavigationContext {
  /**
   * Registers a function that tries to change some internal state in its own context in order to help navigate
   * to a node. For example by navigating to a page, or opening a repeating group for editing. The callback
   * runs as soon as possible whenever we're supposed to navigate to a node, and is forgotten after that.
   */
  registerNavigationHandler: (handler: NavigationHandler) => void;
  unregisterNavigationHandler: (handler: NavigationHandler) => void;

  /**
   * Call this to indicate that the user has navigated to the node. Returning true from the callback will prevent any
   * navigation handlers from running, and finish the navigation.
   */
  registerFinishNavigation: (handler: FinishNavigationHandler) => void;
  unregisterFinishNavigation: (handler: FinishNavigationHandler) => void;
}

const { Provider, useCtx } = createContext<NodeNavigationContext>({ name: 'PageNavigationContext', required: true });

interface NavigationRequest {
  onHandlerAdded: (handler: NavigationHandler) => void;
  onFinishedHandlerAdded: (handler: FinishNavigationHandler) => Promise<void>;
}

type HandlerRegistry<T> = Set<T>;

export function NavigateToNodeProvider({ children }: PropsWithChildren) {
  const request = useRef<NavigationRequest | undefined>();
  const navigationHandlers = useRef<HandlerRegistry<NavigationHandler>>(new Set());
  const finishHandlers = useRef<HandlerRegistry<FinishNavigationHandler>>(new Set());

  const registerNavigationHandler = useCallback((handler: NavigationHandler) => {
    navigationHandlers.current.add(handler);
    request.current?.onHandlerAdded?.(handler);
  }, []);

  const unregisterNavigationHandler = useCallback((handler: NavigationHandler) => {
    navigationHandlers.current.delete(handler);
  }, []);

  const registerFinishNavigation = useCallback((handler: FinishNavigationHandler) => {
    finishHandlers.current.add(handler);
    request.current?.onFinishedHandlerAdded?.(handler);
  }, []);

  const unregisterFinishNavigation = useCallback((handler: FinishNavigationHandler) => {
    finishHandlers.current.delete(handler);
  }, []);

  return (
    <Provider
      value={{
        registerNavigationHandler,
        unregisterNavigationHandler,
        registerFinishNavigation,
        unregisterFinishNavigation,
      }}
    >
      {children}
    </Provider>
  );
}

// TODO: remove all usages
export const useRegisterNodeNavigationHandler = (handler: NavigationHandler) => {
  const { registerNavigationHandler, unregisterNavigationHandler } = useCtx();

  useEffect(() => {
    registerNavigationHandler(handler);
    return () => unregisterNavigationHandler(handler);
  }, [registerNavigationHandler, unregisterNavigationHandler, handler]);
};

export function useNavigateToNode() {
  // TODO: Tabs
  const [searchParams, setSearchParams] = useSearchParams();
  const { partyId, instanceGuid, taskId, pageKey: currentPageId } = useNavigationParams();
  const isStatelessApp = useIsStatelessApp();
  const navigate = useNavigate();
  const allNodesRef = useNodesAsRef();

  function navigateToNode({ componentId, pageKey }: { componentId: string; pageKey: string }) {
    const componentNode = allNodesRef.current.findById(componentId);

    if (!componentNode || componentNode.isHidden()) {
      // No point in trying to focus on a hidden component
      return;
    }

    searchParams.set(SearchParams.FocusComponentId, componentId);
    // handle nested components
    handleTabNavigation(componentNode, searchParams);
    handleRepeatingGroupNavigation(componentNode, searchParams);

    if (pageKey === currentPageId) {
      // We're already on the correct page

      setSearchParams(searchParams, { preventScrollReset: true });
      return; // TODO: need to return here?
    }

    const navigationUrl = isStatelessApp
      ? `/${pageKey}?${searchParams.toString()}`
      : `/instance/${partyId}/${instanceGuid}/${taskId}/${pageKey}?${searchParams.toString()}`;
    navigate(navigationUrl, { preventScrollReset: true });

    // TODO: focus
  }

  return navigateToNode;
}

function handleTabNavigation(targetNode: LayoutNode, searchParams: URLSearchParams) {
  for (const parent of targetNode.parents() ?? []) {
    if (parent instanceof BaseLayoutNode && parent.isType('Tabs')) {
      const targetTabId = parent.item.tabsInternal.find((tab) =>
        tab.childNodes.some((child) => child.item.id === targetNode.item.id),
      )?.id;

      if (targetTabId) {
        searchParams.set(TabSearchParams.ActiveTab, targetTabId);
      }
    }
  }
}

function handleRepeatingGroupNavigation(targetNode: LayoutNode, searchParams: URLSearchParams) {
  // TODO: implement
}
