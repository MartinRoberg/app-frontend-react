import { useCallback, useEffect, useMemo } from 'react';
import type { NavigateOptions } from 'react-router-dom';

import { ContextNotProvided } from 'src/core/contexts/context';
import { useSetReturnToView, useSetSummaryNodeOfOrigin } from 'src/features/form/layout/PageNavigationContext';
import { useLaxLayoutSettings, usePageSettings } from 'src/features/form/layoutSettings/LayoutSettingsContext';
import { FD } from 'src/features/formData/FormDataWrite';
import { useGetTaskType, useLaxProcessData, useTaskType } from 'src/features/instance/ProcessContext';
import {
  useAllNavigationParamsAsRef,
  useNavigationParam,
  useQueryKeysAsString,
  useQueryKeysAsStringAsRef,
  useSetNavigationEffect,
} from 'src/features/routing/AppRoutingContext';
import { AppRouter } from 'src/index';
import { ProcessTaskType } from 'src/types';
import { Hidden } from 'src/utils/layout/NodesContext';
import { useIsStatelessApp } from 'src/utils/useIsStatelessApp';
import type { NavigationEffectCb } from 'src/features/routing/AppRoutingContext';

type NavigateToPageOptions = {
  replace?: boolean;
  skipAutoSave?: boolean;
  shouldFocusComponent?: boolean;
};

export enum TaskKeys {
  ProcessEnd = 'ProcessEnd',
  CustomReceipt = 'CustomReceipt',
}

export enum SearchParams {
  FocusComponentId = 'focusComponentId',
}

const emptyArray: never[] = [];

/**
 * Navigation function for react-router-dom
 * Makes sure to clear returnToView and summaryNodeOfOrigin on navigation
 * Takes an optional callback
 */
const useNavigate = () => {
  const storeCallback = useSetNavigationEffect();
  const setReturnToView = useSetReturnToView();
  const setSummaryNodeOfOrigin = useSetSummaryNodeOfOrigin();

  return useCallback(
    (path: string, options?: NavigateOptions, cb?: NavigationEffectCb) => {
      setReturnToView?.(undefined);
      setSummaryNodeOfOrigin?.(undefined);
      if (cb) {
        storeCallback(cb);
      }
      AppRouter.navigate(path, options);
    },
    [setReturnToView, storeCallback, setSummaryNodeOfOrigin],
  );
};

export const useCurrentView = () => useNavigationParam('pageKey');
export const useOrder = () => {
  const maybeLayoutSettings = useLaxLayoutSettings();
  const orderWithHidden = maybeLayoutSettings === ContextNotProvided ? emptyArray : maybeLayoutSettings.pages.order;
  const hiddenPages = Hidden.useHiddenPages();
  return useMemo(() => orderWithHidden?.filter((page) => !hiddenPages.has(page)), [orderWithHidden, hiddenPages]);
};

export const useIsCurrentTask = () => {
  const currentTaskId = useLaxProcessData()?.currentTask?.elementId;
  const taskId = useNavigationParam('taskId');
  return useMemo(() => {
    if (currentTaskId === undefined && taskId === TaskKeys.CustomReceipt) {
      return true;
    }
    return currentTaskId === taskId;
  }, [currentTaskId, taskId]);
};

export const usePreviousPageKey = () => {
  const order = useOrder();

  const currentPageId = useNavigationParam('pageKey') ?? '';
  const currentPageIndex = order?.indexOf(currentPageId) ?? -1;
  const previousPageIndex = currentPageIndex !== -1 ? currentPageIndex - 1 : -1;

  return order?.[previousPageIndex];
};

export const useNextPageKey = () => {
  const order = useOrder();

  const currentPageId = useNavigationParam('pageKey') ?? '';
  const currentPageIndex = order?.indexOf(currentPageId) ?? -1;
  const nextPageIndex = currentPageIndex !== -1 ? currentPageIndex + 1 : -1;

  return order?.[nextPageIndex];
};

export const useStartUrl = (forcedTaskId?: string) => {
  const queryKeys = useQueryKeysAsString();
  const order = useOrder();
  const partyId = useNavigationParam('partyId');
  const instanceGuid = useNavigationParam('instanceGuid');
  const taskId = useNavigationParam('taskId');
  const taskType = useTaskType(taskId);

  return useMemo(() => {
    if (typeof forcedTaskId === 'string') {
      return `/instance/${partyId}/${instanceGuid}/${forcedTaskId}${queryKeys}`;
    }
    if (taskType === ProcessTaskType.Archived) {
      return `/instance/${partyId}/${instanceGuid}/${TaskKeys.ProcessEnd}${queryKeys}`;
    }
    if (taskType !== ProcessTaskType.Data && taskId !== undefined) {
      return `/instance/${partyId}/${instanceGuid}/${taskId}${queryKeys}`;
    }
    const firstPage = order?.[0];
    if (taskId && firstPage) {
      return `/instance/${partyId}/${instanceGuid}/${taskId}/${firstPage}${queryKeys}`;
    }
    if (taskId) {
      return `/instance/${partyId}/${instanceGuid}/${taskId}${queryKeys}`;
    }
    return `/instance/${partyId}/${instanceGuid}${queryKeys}`;
  }, [forcedTaskId, instanceGuid, order, partyId, queryKeys, taskId, taskType]);
};

export const useNavigatePage = () => {
  const isStatelessApp = useIsStatelessApp();
  const processTasks = useLaxProcessData()?.processTasks;
  const lastTaskId = processTasks?.slice(-1)[0]?.elementId;
  const navigate = useNavigate();

  const navParams = useAllNavigationParamsAsRef();
  const queryKeysRef = useQueryKeysAsStringAsRef();
  const getTaskType = useGetTaskType();

  const { autoSaveBehavior } = usePageSettings();
  const order = useOrder();

  const isValidPageId = useCallback(
    (_pageId: string) => {
      // The page ID may be URL encoded already, if we got this from react-router.
      const pageId = decodeURIComponent(_pageId);
      if (getTaskType(navParams.current.taskId) !== ProcessTaskType.Data) {
        return false;
      }
      return order?.includes(pageId) ?? false;
    },
    [getTaskType, navParams, order],
  );

  /**
   * For stateless apps, this is how we redirect to the
   * initial page of the app. We replace the url, to not
   * have the initial page (i.e. the page without a
   * pageKey) in the history.
   */
  useEffect(() => {
    const currentPageId = navParams.current.pageKey ?? '';
    if (isStatelessApp && order?.[0] !== undefined && (!currentPageId || !isValidPageId(currentPageId))) {
      navigate(`/${order?.[0]}${queryKeysRef.current}`, { replace: true });
    }
  }, [isStatelessApp, order, navigate, isValidPageId, navParams, queryKeysRef]);

  const requestManualSave = FD.useRequestManualSave();
  const maybeSaveOnPageChange = useCallback(() => {
    if (autoSaveBehavior === 'onChangePage') {
      requestManualSave();
    }
  }, [autoSaveBehavior, requestManualSave]);

  const navigateToPage = useCallback(
    async (page?: string, options?: NavigateToPageOptions) => {
      const replace = options?.replace ?? false;
      if (!page) {
        window.logWarn('navigateToPage called without page');
        return;
      }
      if (!order.includes(page)) {
        window.logWarn('navigateToPage called with invalid page:', `"${page}"`);
        return;
      }

      if (options?.skipAutoSave !== true) {
        maybeSaveOnPageChange();
      }

      if (isStatelessApp) {
        return navigate(`/${page}${queryKeysRef.current}`, { replace }, () => focusMainContent(options));
      }

      const { partyId, instanceGuid, taskId } = navParams.current;
      const url = `/instance/${partyId}/${instanceGuid}/${taskId}/${page}${queryKeysRef.current}`;
      navigate(url, { replace }, () => focusMainContent(options));
    },
    [isStatelessApp, maybeSaveOnPageChange, navParams, navigate, order, queryKeysRef],
  );

  const navigateToTask = useCallback(
    (newTaskId?: string, options?: NavigateOptions & { runEffect?: boolean }) => {
      const { runEffect = true } = options ?? {};
      const { partyId, instanceGuid, taskId } = navParams.current;
      if (newTaskId === taskId) {
        return;
      }
      const url = `/instance/${partyId}/${instanceGuid}/${newTaskId ?? lastTaskId}${queryKeysRef.current}`;
      navigate(url, options, runEffect ? () => focusMainContent(options) : undefined);
    },
    [lastTaskId, navParams, navigate, queryKeysRef],
  );

  const isValidTaskId = useCallback(
    (taskId?: string) => {
      if (!taskId) {
        return false;
      }
      if (taskId === TaskKeys.ProcessEnd) {
        return true;
      }
      if (taskId === TaskKeys.CustomReceipt) {
        return true;
      }
      return processTasks?.find((task) => task.elementId === taskId) !== undefined;
    },
    [processTasks],
  );

  const getCurrentPageIndex = useCallback(() => {
    const location = window.location.href;
    const _currentPageId = location.split('/').slice(-1)[0];
    return order?.indexOf(_currentPageId) ?? undefined;
  }, [order]);

  const getNextPage = useCallback(() => {
    const currentPageIndex = getCurrentPageIndex();
    const nextPageIndex = currentPageIndex !== undefined ? currentPageIndex + 1 : undefined;

    if (nextPageIndex === undefined) {
      return undefined;
    }
    return order?.[nextPageIndex];
  }, [getCurrentPageIndex, order]);

  const getPreviousPage = useCallback(() => {
    const currentPageIndex = getCurrentPageIndex();
    const nextPageIndex = currentPageIndex !== undefined ? currentPageIndex - 1 : undefined;

    if (nextPageIndex === undefined) {
      return undefined;
    }
    return order?.[nextPageIndex];
  }, [getCurrentPageIndex, order]);

  /**
   * This function fetch the next page index on function
   * invocation and then navigates to the next page. This is
   * to be able to chain multiple ClientActions together.
   */
  const navigateToNextPage = useCallback(() => {
    const nextPage = getNextPage();
    if (!nextPage) {
      window.logWarn('Tried to navigate to next page when standing on the last page.');
      return;
    }
    navigateToPage(nextPage);
  }, [getNextPage, navigateToPage]);

  /**
   * This function fetches the previous page index on
   * function invocation and then navigates to the previous
   * page. This is to be able to chain multiple ClientActions
   * together.
   */
  const navigateToPreviousPage = useCallback(() => {
    const previousPage = getPreviousPage();

    if (!previousPage) {
      window.logWarn('Tried to navigate to previous page when standing on the first page.');
      return;
    }
    navigateToPage(previousPage);
  }, [getPreviousPage, navigateToPage]);

  return {
    navigateToPage,
    navigateToTask,
    isValidPageId,
    isValidTaskId,
    order,
    navigateToNextPage,
    navigateToPreviousPage,
    maybeSaveOnPageChange,
  };
};

export function focusMainContent(options?: NavigateToPageOptions) {
  if (options?.shouldFocusComponent !== true) {
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }
}
