import React from 'react';
import type { PropsWithChildren } from 'react';

import { shallow } from 'zustand/shallow';

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
import { Hidden, NodesInternal } from 'src/utils/layout/NodesContext';
import { useDataModelBindingTranspose } from 'src/utils/layout/useDataModelBindingTranspose';
import { useNodeFormDataSelector } from 'src/utils/layout/useNodeItem';
import { useNodeTraversalSelector } from 'src/utils/layout/useNodeTraversal';
import type { ApplicationMetadata } from 'src/features/applicationMetadata/types';
import type { AttachmentsSelector } from 'src/features/attachments/AttachmentsStorePlugin';
import type { ExternalApisResult } from 'src/features/externalApi/useExternalApi';
import type { IUseLanguage } from 'src/features/language/useLanguage';
import type { NodeOptionsSelector } from 'src/features/options/OptionsStorePlugin';
import type { FormDataRowsSelector, FormDataSelector } from 'src/layout';
import type { ILayoutSet, ILayoutSets } from 'src/layout/common.generated';
import type { IApplicationSettings, IData, IInstanceDataSources, IProcess } from 'src/types/shared';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { NodeDataSelector } from 'src/utils/layout/NodesContext';
import type { DataModelTransposeSelector } from 'src/utils/layout/useDataModelBindingTranspose';
import type { ExpressionDataSources } from 'src/utils/layout/useExpressionDataSources';
import type { NodeFormDataSelector } from 'src/utils/layout/useNodeItem';
import type { NodeTraversalSelector } from 'src/utils/layout/useNodeTraversal';

type NodeDataSources = {
  currentLanguage: string;
  formDataSelector: FormDataSelector;
  invalidDataSelector: FormDataSelector;
  attachmentsSelector: AttachmentsSelector;
  nodeDataSelector: NodeDataSelector;
  applicationMetadata: ApplicationMetadata;
  dataElements: IData[];
  layoutSets: ILayoutSets;
  process?: IProcess;
  instanceDataSources: IInstanceDataSources | null;
  applicationSettings: IApplicationSettings | null;
  dataModelNames: string[];
  formDataRowsSelector: FormDataRowsSelector;
  optionsSelector: NodeOptionsSelector;
  langToolsSelector: (node: LayoutNode | undefined) => IUseLanguage;
  currentLayoutSet: ILayoutSet | null;
  isHiddenSelector: ReturnType<typeof Hidden.useIsHiddenSelector>;
  nodeFormDataSelector: NodeFormDataSelector;
  nodeTraversal: NodeTraversalSelector;
  transposeSelector: DataModelTransposeSelector;
  externalApis: ExternalApisResult;
};

const { Provider, useCtx } = createContext<NodeDataSources>({
  name: 'NodeDataSources',
  required: true,
});

export function NodeDataSourcesProvider({ children }: PropsWithChildren) {
  const formDataSelector = FD.useDebouncedSelector();
  const invalidDataSelector = FD.useInvalidDebouncedSelector();
  const attachmentsSelector = useAttachmentsSelector();
  const currentLanguage = useCurrentLanguage();
  const nodeDataSelector = NodesInternal.useNodeDataSelector();
  const applicationMetadata = useApplicationMetadata();
  const dataElements = useLaxInstanceAllDataElements();
  const layoutSets = useLayoutSets();
  const instanceDataSources = useLaxInstanceDataSources();
  const formDataRowsSelector = FD.useDebouncedRowsSelector();
  const optionsSelector = useNodeOptionsSelector();
  const process = useLaxProcessData();
  const applicationSettings = useApplicationSettings();
  const langToolsSelector = useLanguageWithForcedNodeSelector();
  const isHiddenSelector = Hidden.useIsHiddenSelector();
  const nodeFormDataSelector = useNodeFormDataSelector();
  const nodeTraversal = useNodeTraversalSelector();
  const transposeSelector = useDataModelBindingTranspose();
  const currentLayoutSet = useCurrentLayoutSet() ?? null;
  const dataModelNames = DataModels.useReadableDataTypes();
  const externalApiIds = useApplicationMetadata().externalApiIds ?? [];
  const externalApis = useExternalApis(externalApiIds);

  const prev = React.useRef<NodeDataSources>();
  const next: NodeDataSources = {
    formDataSelector,
    invalidDataSelector,
    attachmentsSelector,
    currentLanguage,
    nodeDataSelector,
    applicationMetadata,
    dataElements,
    layoutSets,
    instanceDataSources,
    formDataRowsSelector,
    optionsSelector,
    process,
    applicationSettings,
    langToolsSelector,
    isHiddenSelector,
    nodeFormDataSelector,
    nodeTraversal,
    transposeSelector,
    currentLayoutSet,
    dataModelNames,
    externalApis,
  };
  const value = shallow(prev.current, next) ? (prev.current as NodeDataSources) : (prev.current = next);
  return <Provider value={value}>{children}</Provider>;
}

export const useNodeDataSources = useCtx;
export const useNodeDataExpressionSources = () => {
  const {
    formDataSelector,
    formDataRowsSelector,
    attachmentsSelector,
    process,
    optionsSelector,
    applicationSettings,
    instanceDataSources,
    langToolsSelector,
    currentLanguage,
    isHiddenSelector,
    nodeFormDataSelector,
    nodeDataSelector,
    nodeTraversal,
    transposeSelector,
    currentLayoutSet,
    externalApis,
    dataModelNames,
  } = useCtx();

  const prev = React.useRef<ExpressionDataSources>();
  const next: ExpressionDataSources = {
    formDataSelector,
    formDataRowsSelector,
    attachmentsSelector,
    process,
    optionsSelector,
    applicationSettings,
    instanceDataSources,
    langToolsSelector,
    currentLanguage,
    isHiddenSelector,
    nodeFormDataSelector,
    nodeDataSelector,
    nodeTraversal,
    transposeSelector,
    currentLayoutSet,
    externalApis,
    dataModelNames,
  };
  return shallow(prev.current, next) ? (prev.current as ExpressionDataSources) : (prev.current = next);
};
