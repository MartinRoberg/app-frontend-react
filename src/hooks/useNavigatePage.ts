import { useCallback, useEffect, useMemo } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import type { NavigateOptions } from 'react-router-dom';

import { useIsStatelessApp } from 'src/features/applicationMetadata/appMetadataUtils';
import { usePageNavigationContext } from 'src/features/form/layout/PageNavigationContext';
import { useUiConfigContext } from 'src/features/form/layout/UiConfigContext';
import { useLaxProcessData, useTaskType } from 'src/features/instance/ProcessContext';
import { useAppSelector } from 'src/hooks/useAppSelector';
import { ProcessTaskType } from 'src/types';

type NavigateToPageOptions = {
  focusComponentId?: string;
  returnToView?: string;
};

export enum TaskKeys {
  ProcessEnd = 'ProcessEnd',
}

export enum PageKeys {
  Confirmation = '@confirmation',
  Receipt = '@receipt',
  Feedback = '@feedback',
}

export const useNavigationParams = () => {
  const instanceMatch = useMatch('/instance/:partyId/:instanceGuid');
  const taskIdMatch = useMatch('/instance/:partyId/:instanceGuid/:taskId');
  const pageKeyMatch = useMatch('/instance/:partyId/:instanceGuid/:taskId/:pageKey');

  const statelessMatch = useMatch('/:pageKey');

  const partyId = pageKeyMatch?.params.partyId ?? taskIdMatch?.params.partyId ?? instanceMatch?.params.partyId;
  const instanceGuid =
    pageKeyMatch?.params.instanceGuid ?? taskIdMatch?.params.instanceGuid ?? instanceMatch?.params.instanceGuid;
  const taskId = pageKeyMatch?.params.taskId ?? taskIdMatch?.params.taskId;
  const pageKey = pageKeyMatch?.params.pageKey ?? statelessMatch?.params.pageKey;

  return {
    partyId,
    instanceGuid,
    taskId,
    pageKey,
  };
};

export const useNavigatePage = () => {
  const navigate = useNavigate();
  const isStatelessApp = useIsStatelessApp();
  const currentTaskId = useLaxProcessData()?.currentTask?.elementId;
  const processTasks = useLaxProcessData()?.processTasks;
  const lastTaskId = processTasks?.slice(-1)[0]?.elementId;

  const { partyId, instanceGuid, taskId, pageKey } = useNavigationParams();
  const { orderWithHidden } = useUiConfigContext();
  const autoSaveBehavior = useAppSelector((state) => state.formLayout.uiConfig.autoSaveBehavior);

  const { setFocusId, setReturnToView, hidden } = usePageNavigationContext();
  const taskType = useTaskType(taskId);

  const hiddenPages = useMemo(() => new Set(hidden), [hidden]);
  const order = useMemo(
    () => orderWithHidden?.filter((page) => !hiddenPages.has(page)),
    [orderWithHidden, hiddenPages],
  );

  const currentPageId = pageKey ?? '';
  const currentPageIndex = order?.indexOf(currentPageId) ?? -1;
  const nextPageIndex = currentPageIndex !== -1 ? currentPageIndex + 1 : -1;
  const previousPageIndex = currentPageIndex !== -1 ? currentPageIndex - 1 : -1;

  const isValidPageId = useCallback(
    (pageId: string) => {
      if (taskType !== ProcessTaskType.Data && Object.values<string>(PageKeys).includes(pageId)) {
        return true;
      }
      if (taskType === ProcessTaskType.Confirm && pageId === PageKeys.Confirmation) {
        return true;
      }
      if (taskType === ProcessTaskType.Archived && pageId === PageKeys.Receipt) {
        return true;
      }
      if (taskType === ProcessTaskType.Feedback && pageId === PageKeys.Feedback) {
        return true;
      }
      return order?.includes(pageId) ?? false;
    },
    [order, taskType],
  );

  /**
   * For stateless apps, this is how we redirect to the
   * initial page of the app. We replace the url, to not
   * have the initial page (i.e. the page without a
   * pageKey) in the history.
   */
  useEffect(() => {
    if (isStatelessApp && order?.[0] !== undefined && (!currentPageId || !isValidPageId(currentPageId))) {
      navigate(`/${order?.[0]}`, { replace: true });
    }
  }, [isStatelessApp, order, navigate, currentPageId, isValidPageId]);

  const navigateToPage = useCallback(
    (page?: string, options?: NavigateToPageOptions) => {
      if (!page) {
        return;
      }
      if (!order.includes(page)) {
        return;
      }
      setFocusId(options?.focusComponentId);
      if (options?.returnToView) {
        setReturnToView(options.returnToView);
      }

      if (autoSaveBehavior === 'onChangePage' && order?.includes(currentPageId)) {
        // TODO: Re-implement form data saving when saving via page navigation
        // dispatch(FormDataActions.saveLatest({}));
      }

      if (isStatelessApp) {
        return navigate(`/${page}`);
      }

      const url = `/instance/${partyId}/${instanceGuid}/${taskId}/${page}`;
      navigate(url);
    },
    [
      navigate,
      partyId,
      instanceGuid,
      taskId,
      setFocusId,
      setReturnToView,
      autoSaveBehavior,
      order,
      currentPageId,
      isStatelessApp,
    ],
  );

  const navigateToTask = useCallback(
    (taskId?: string, options?: NavigateOptions) => {
      const url = `/instance/${partyId}/${instanceGuid}/${taskId ?? lastTaskId}`;
      navigate(url, options);
    },
    [partyId, instanceGuid, lastTaskId, navigate],
  );

  const isCurrentTask = useMemo(() => currentTaskId === taskId, [currentTaskId, taskId]);

  const startUrl = useMemo(() => {
    if (taskType === ProcessTaskType.Confirm) {
      return `/instance/${partyId}/${instanceGuid}/${taskId}/${PageKeys.Confirmation}`;
    }
    if (taskType === ProcessTaskType.Archived) {
      return `/instance/${partyId}/${instanceGuid}/ProcessEnd/${PageKeys.Receipt}`;
    }
    if (taskType === ProcessTaskType.Feedback) {
      return `/instance/${partyId}/${instanceGuid}/${taskId}/${PageKeys.Feedback}`;
    }
    const firstPage = order?.[0];
    if (taskId && firstPage) {
      return `/instance/${partyId}/${instanceGuid}/${taskId}/${firstPage}`;
    }
    if (taskId) {
      return `/instance/${partyId}/${instanceGuid}/${taskId}`;
    }
    return `/instance/${partyId}/${instanceGuid}`;
  }, [partyId, instanceGuid, taskId, order, taskType]);

  const next = order?.[nextPageIndex];
  const previous = order?.[previousPageIndex];

  const isValidTaskId = useCallback(
    (taskId?: string) => {
      if (!taskId) {
        return false;
      }
      if (taskId === TaskKeys.ProcessEnd) {
        return true;
      }
      return processTasks?.find((task) => task.elementId === taskId) !== undefined;
    },
    [processTasks],
  );

  const getCurrentPageIndex = () => {
    const location = window.location.href;
    const _currentPageId = location.split('/').slice(-1)[0];
    return order?.indexOf(_currentPageId) ?? undefined;
  };

  const getNextPage = () => {
    const currentPageIndex = getCurrentPageIndex();
    const nextPageIndex = currentPageIndex !== undefined ? currentPageIndex + 1 : undefined;

    if (nextPageIndex === undefined) {
      return undefined;
    }
    return order?.[nextPageIndex];
  };

  const getPreviousPage = () => {
    const currentPageIndex = getCurrentPageIndex();
    const nextPageIndex = currentPageIndex !== undefined ? currentPageIndex - 1 : undefined;

    if (nextPageIndex === undefined) {
      return undefined;
    }
    return order?.[nextPageIndex];
  };

  /**
   * This function fetch the next page index on function
   * invocation and then navigates to the next page. This is
   * to be able to chain multiple ClientActions together.
   */
  const navigateToNextPage = () => {
    const nextPage = getNextPage();
    if (nextPage) {
      navigateToPage(nextPage);
    }
  };
  /**
   * This function fetches the previous page index on
   * function invocation and then navigates to the previous
   * page. This is to be able to chain multiple ClientActions
   * together.
   */
  const navigateToPreviousPage = () => {
    const previousPage = getPreviousPage();
    if (previousPage) {
      navigateToPage(previousPage);
    }
  };

  return {
    navigateToPage,
    navigateToTask,
    isCurrentTask,
    isValidPageId,
    isValidTaskId,
    startUrl,
    order,
    next,
    partyId,
    instanceGuid,
    currentPageId,
    taskId,
    previous,
    navigateToNextPage,
    navigateToPreviousPage,
  };
};