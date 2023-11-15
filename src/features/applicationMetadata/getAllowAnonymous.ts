import { useSelector } from 'react-redux';

import { createSelector } from 'reselect';

import { getDataTypeByLayoutSetId, isStatelessApp } from 'src/features/applicationMetadata/appMetadataUtils';
import type { IRuntimeState } from 'src/types';

const getApplicationMetadata = (state: IRuntimeState) => state.applicationMetadata?.applicationMetadata;
const getLayoutSets = (state: IRuntimeState) => state.formLayout.layoutsets;

let selector: ((state: IRuntimeState) => boolean | undefined) | undefined = undefined;
const getAllowAnonymous = () => {
  if (selector) {
    return selector;
  }

  selector = createSelector([getApplicationMetadata, getLayoutSets], (application, layoutSets) => {
    // Require application metadata - return undefined if not yet loaded
    if (!application || !application.dataTypes) {
      return undefined;
    }

    if (!isStatelessApp(application)) {
      return false;
    }
    // Require layout sets for stateless apps - return undefined if not yet loaded
    if (!layoutSets?.sets) {
      return undefined;
    }

    const dataTypeId = getDataTypeByLayoutSetId(application.onEntry?.show, layoutSets, application);
    const dataType = application.dataTypes.find((d) => d.id === dataTypeId);
    const allowAnonymous = dataType?.appLogic?.allowAnonymousOnStateless;
    if (allowAnonymous !== undefined && allowAnonymous !== null) {
      return allowAnonymous;
    }

    return false;
  });

  return selector;
};

export const makeGetAllowAnonymousSelector = getAllowAnonymous;

export const useAllowAnonymous = () => {
  const getAllowAnonymous = makeGetAllowAnonymousSelector();
  return useSelector(getAllowAnonymous);
};

export const useAllowAnonymousIs = (compareWith: boolean) => {
  const allowAnonymous = useAllowAnonymous();
  return allowAnonymous === compareWith;
};
