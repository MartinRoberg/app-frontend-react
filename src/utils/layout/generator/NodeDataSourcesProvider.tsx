import React, { useRef } from 'react';
import type { PropsWithChildren } from 'react';

import { createContext } from 'src/core/contexts/context';
import { useApplicationMetadata } from 'src/features/applicationMetadata/ApplicationMetadataProvider';
import { useApplicationSettings } from 'src/features/applicationSettings/ApplicationSettingsProvider';
import { useAttachmentsSelector } from 'src/features/attachments/hooks';
import { DataModels } from 'src/features/datamodel/DataModelsProvider';
import { useExternalApis } from 'src/features/externalApi/useExternalApi';
import { useLayoutSets } from 'src/features/form/layoutSets/LayoutSetsProvider';
import { useCurrentLayoutSet } from 'src/features/form/layoutSets/useCurrentLayoutSet';
import { FD } from 'src/features/formData/FormDataWrite';
import { useLaxInstanceAllDataElements, useLaxInstanceDataSources } from 'src/features/instance/InstanceContext';
import { useLaxProcessData } from 'src/features/instance/ProcessContext';
import { useCurrentLanguage } from 'src/features/language/LanguageProvider';
import { useLanguageWithForcedNodeSelector } from 'src/features/language/useLanguage';
import { useNodeOptionsSelector } from 'src/features/options/useNodeOptions';
import { Validation } from 'src/features/validation/validationContext';
import { useShallowObjectMemo, useShallowObjectSelectorMemo } from 'src/hooks/useShallowObjectMemo';
import { Hidden, NodesInternal } from 'src/utils/layout/NodesContext';
import { useDataModelBindingTranspose } from 'src/utils/layout/useDataModelBindingTranspose';
import { useNodeFormDataSelector } from 'src/utils/layout/useNodeItem';
import { useNodeTraversalSelector } from 'src/utils/layout/useNodeTraversal';
import type { ComponentValidationDataSources, EmptyFieldValidationDataSources } from 'src/features/validation';
import type { ExpressionDataSources } from 'src/utils/layout/useExpressionDataSources';

const useRawNodeDataSources = () =>
  useShallowObjectMemo({
    formDataSelector: FD.useDebouncedSelector(),
    invalidDataSelector: FD.useInvalidDebouncedSelector(),
    attachmentsSelector: useAttachmentsSelector(),
    currentLanguage: useCurrentLanguage(),
    nodeDataSelector: NodesInternal.useNodeDataSelector(),
    applicationMetadata: useApplicationMetadata(),
    dataElements: useLaxInstanceAllDataElements(),
    dataElementHasErrorsSelector: Validation.useDataElementHasErrorsSelector(),
    layoutSets: useLayoutSets(),
    instanceDataSources: useLaxInstanceDataSources(),
    formDataRowsSelector: FD.useDebouncedRowsSelector(),
    optionsSelector: useNodeOptionsSelector(),
    process: useLaxProcessData(),
    applicationSettings: useApplicationSettings(),
    langToolsSelector: useLanguageWithForcedNodeSelector(),
    isHiddenSelector: Hidden.useIsHiddenSelector(),
    nodeFormDataSelector: useNodeFormDataSelector(),
    nodeTraversal: useNodeTraversalSelector(),
    transposeSelector: useDataModelBindingTranspose(),
    currentLayoutSet: useCurrentLayoutSet() ?? null,
    dataModelNames: DataModels.useReadableDataTypes(),
    externalApis: useExternalApis(useApplicationMetadata().externalApiIds ?? []),
  });

type NodeDataSources = ReturnType<typeof useRawNodeDataSources>;

const { Provider, useCtx } = createContext<NodeDataSources>({
  name: 'NodeDataSources',
  required: true,
});

export function NodeDataSourcesProvider({ children }: PropsWithChildren) {
  const value = useRawNodeDataSources();
  return <Provider value={value}>{children}</Provider>;
}

/**
 * Select multiple data sources with shallow memoization
 */
export function useNodeDataSources<T extends Partial<NodeDataSources> | NodeDataSources[keyof NodeDataSources][]>(
  selector: (store: NodeDataSources) => T,
) {
  return useShallowObjectSelectorMemo(useCtx(), selector);
}

/**
 * Select a single data source with shallow memoization
 */
export function useNodeDataSource<T extends NodeDataSources[keyof NodeDataSources]>(
  selector: (store: NodeDataSources) => T,
) {
  const prev = useRef<T>();
  const next = selector(useCtx());
  return prev.current === next ? (prev.current as T) : (prev.current = next);
}

export const useNodeDataExpressionSources = () => {
  const dataSources = useCtx();
  return useShallowObjectMemo<ExpressionDataSources>({
    formDataSelector: dataSources.formDataSelector,
    formDataRowsSelector: dataSources.formDataRowsSelector,
    attachmentsSelector: dataSources.attachmentsSelector,
    process: dataSources.process,
    optionsSelector: dataSources.optionsSelector,
    applicationSettings: dataSources.applicationSettings,
    instanceDataSources: dataSources.instanceDataSources,
    langToolsSelector: dataSources.langToolsSelector,
    currentLanguage: dataSources.currentLanguage,
    isHiddenSelector: dataSources.isHiddenSelector,
    nodeFormDataSelector: dataSources.nodeFormDataSelector,
    nodeDataSelector: dataSources.nodeDataSelector,
    nodeTraversal: dataSources.nodeTraversal,
    transposeSelector: dataSources.transposeSelector,
    currentLayoutSet: dataSources.currentLayoutSet,
    externalApis: dataSources.externalApis,
    dataModelNames: dataSources.dataModelNames,
  });
};
export const useEmptyFieldValidationDataSources = () => {
  const dataSources = useCtx();
  return useShallowObjectMemo<EmptyFieldValidationDataSources>({
    nodeDataSelector: dataSources.nodeDataSelector,
    invalidDataSelector: dataSources.invalidDataSelector,
    formDataSelector: dataSources.formDataSelector,
  });
};
export const useComponentValidationDataSources = () => {
  const dataSources = useCtx();
  return useShallowObjectMemo<ComponentValidationDataSources>({
    nodeDataSelector: dataSources.nodeDataSelector,
    formDataSelector: dataSources.formDataSelector,
    currentLanguage: dataSources.currentLanguage,
    attachmentsSelector: dataSources.attachmentsSelector,
    layoutSets: dataSources.layoutSets,
    dataElements: dataSources.dataElements,
    applicationMetadata: dataSources.applicationMetadata,
    dataElementHasErrorsSelector: dataSources.dataElementHasErrorsSelector,
  });
};
