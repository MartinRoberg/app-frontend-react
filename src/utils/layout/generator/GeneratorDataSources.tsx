import React from 'react';
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
import { useLaxDataElementsSelector, useLaxInstanceDataSources } from 'src/features/instance/InstanceContext';
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
import type {
  ComponentValidationDataSources,
  DataModelValidationDataSources,
  EmptyFieldValidationDataSources,
} from 'src/features/validation';
import type { ShallowObjectSelectorReturn } from 'src/hooks/useShallowObjectMemo';
import type { ExpressionDataSources } from 'src/utils/layout/useExpressionDataSources';

// Hooks that can be safely shared between nodes,
// these should not depend on nodes and should not update often.
const useRawGlobalGeneratorDataSources = () =>
  useShallowObjectMemo({
    instanceDataSources: useLaxInstanceDataSources(),
    currentLayoutSet: useCurrentLayoutSet() ?? null,
    dataModelNames: DataModels.useReadableDataTypes(),
    getDataElementIdForDataType: DataModels.useGetDataElementIdForDataType(),
    externalApis: useExternalApis(useApplicationMetadata().externalApiIds ?? []),
    currentLanguage: useCurrentLanguage(),
    process: useLaxProcessData(),
    layoutSets: useLayoutSets(),
    applicationSettings: useApplicationSettings(),
    applicationMetadata: useApplicationMetadata(),
  });
type GlobalGeneratorDataSources = ReturnType<typeof useRawGlobalGeneratorDataSources>;
const { Provider: GlobalProvider, useCtx: useGlobalCtx } = createContext<GlobalGeneratorDataSources>({
  name: 'GlobalGeneratorDataSources',
  required: true,
});
/**
 * Provides shared expression data sources to the entire node generator
 */
export function GlobalGeneratorDataSourcesProvider({ children }: PropsWithChildren) {
  const value = useRawGlobalGeneratorDataSources();
  return (
    <GlobalProvider value={value}>
      <NodeGeneratorDataSourcesProvider>{children}</NodeGeneratorDataSourcesProvider>
    </GlobalProvider>
  );
}

type NodeGeneratorDataSources = ExpressionDataSources &
  EmptyFieldValidationDataSources &
  ComponentValidationDataSources &
  DataModelValidationDataSources;
const { Provider: NodeProvider, useCtx: useNodeCtx } = createContext<NodeGeneratorDataSources>({
  name: 'NodeGeneratorDataSources',
  required: true,
});
export function NodeGeneratorDataSourcesProvider({ children }: PropsWithChildren) {
  const globalData = useGlobalCtx();
  const value: NodeGeneratorDataSources = useShallowObjectMemo({
    formDataSelector: FD.useDebouncedSelector(),
    invalidDataSelector: FD.useInvalidDebouncedSelector(),
    attachmentsSelector: useAttachmentsSelector(),
    nodeDataSelector: NodesInternal.useNodeDataSelector(),
    dataElementsSelector: useLaxDataElementsSelector(),
    dataElementHasErrorsSelector: Validation.useDataElementHasErrorsSelector(),
    dataModelValidationSelector: Validation.useDataModelValidationSelector(),
    formDataRowsSelector: FD.useDebouncedRowsSelector(),
    optionsSelector: useNodeOptionsSelector(),
    langToolsSelector: useLanguageWithForcedNodeSelector(),
    isHiddenSelector: Hidden.useIsHiddenSelector(),
    nodeFormDataSelector: useNodeFormDataSelector(),
    nodeTraversal: useNodeTraversalSelector(),
    transposeSelector: useDataModelBindingTranspose(),

    instanceDataSources: globalData.instanceDataSources,
    currentLayoutSet: globalData.currentLayoutSet,
    dataModelNames: globalData.dataModelNames,
    getDataElementIdForDataType: globalData.getDataElementIdForDataType,
    externalApis: globalData.externalApis,
    currentLanguage: globalData.currentLanguage,
    process: globalData.process,
    layoutSets: globalData.layoutSets,
    applicationSettings: globalData.applicationSettings,
    applicationMetadata: globalData.applicationMetadata,
  });
  return <NodeProvider value={value}>{children}</NodeProvider>;
}

type D = NodeGeneratorDataSources;
export const GeneratorData = {
  /**
   * Select multiple data sources, either as an array or object,
   * only updates when any of the selected values change
   */
  useShallowDataSources<T extends ShallowObjectSelectorReturn<D>>(selector: (store: D) => T) {
    return useShallowObjectSelectorMemo(useNodeCtx(), selector);
  },
  /**
   * Select a single data source with shallow memoization
   */
  useDataSource<T extends D[keyof D]>(selector: (store: D) => T) {
    return selector(useNodeCtx());
  },
  useExpressionDataSources() {
    const data = useNodeCtx();
    return useShallowObjectMemo<ExpressionDataSources>({
      formDataSelector: data.formDataSelector,
      formDataRowsSelector: data.formDataRowsSelector,
      attachmentsSelector: data.attachmentsSelector,
      optionsSelector: data.optionsSelector,
      langToolsSelector: data.langToolsSelector,
      isHiddenSelector: data.isHiddenSelector,
      nodeFormDataSelector: data.nodeFormDataSelector,
      nodeDataSelector: data.nodeDataSelector,
      nodeTraversal: data.nodeTraversal,
      transposeSelector: data.transposeSelector,
      instanceDataSources: data.instanceDataSources,
      currentLayoutSet: data.currentLayoutSet,
      externalApis: data.externalApis,
      dataModelNames: data.dataModelNames,
      currentLanguage: data.currentLanguage,
      process: data.process,
      applicationSettings: data.applicationSettings,
    });
  },
  useEmptyFieldValidationDataSources() {
    const data = useNodeCtx();
    return useShallowObjectMemo<EmptyFieldValidationDataSources>({
      nodeDataSelector: data.nodeDataSelector,
      invalidDataSelector: data.invalidDataSelector,
      formDataSelector: data.formDataSelector,
    });
  },
  useComponentValidationDataSources() {
    const data = useNodeCtx();
    return useShallowObjectMemo<ComponentValidationDataSources>({
      nodeDataSelector: data.nodeDataSelector,
      formDataSelector: data.formDataSelector,
      attachmentsSelector: data.attachmentsSelector,
      layoutSets: data.layoutSets,
      dataElementsSelector: data.dataElementsSelector,
      dataElementHasErrorsSelector: data.dataElementHasErrorsSelector,
      currentLanguage: data.currentLanguage,
      applicationMetadata: data.applicationMetadata,
    });
  },
  useDataModelValidationDataSources() {
    const data = useNodeCtx();
    return useShallowObjectMemo<DataModelValidationDataSources>({
      nodeDataSelector: data.nodeDataSelector,
      dataModelValidationSelector: data.dataModelValidationSelector,
      getDataElementIdForDataType: data.getDataElementIdForDataType,
    });
  },
};
