import React, { useState } from 'react';

import { Spinner, Table } from '@digdir/designsystemet-react';
import { Grid } from '@material-ui/core';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@navikt/ds-icons';
import cn from 'classnames';
import dot from 'dot-object';

import { Button } from 'src/app-components/Button/Button';
import { Caption } from 'src/components/form/caption/Caption';
import { ContextNotProvided } from 'src/core/contexts/context';
import { useApplicationMetadata } from 'src/features/applicationMetadata/ApplicationMetadataProvider';
import { useApplicationSettings } from 'src/features/applicationSettings/ApplicationSettingsProvider';
import { ExprVal } from 'src/features/expressions/types';
import { useExternalApis } from 'src/features/externalApi/useExternalApi';
import { useDataTypeFromLayoutSet } from 'src/features/form/layout/LayoutsContext';
import { useLayoutSets } from 'src/features/form/layoutSets/LayoutSetsProvider';
import { useFormDataQuery } from 'src/features/formData/useFormDataQuery';
import {
  useLaxInstanceDataSources,
  useStrictDataElements,
  useStrictInstanceId,
} from 'src/features/instance/InstanceContext';
import { useLaxProcessData } from 'src/features/instance/ProcessContext';
import { Lang } from 'src/features/language/Lang';
import { useCurrentLanguage } from 'src/features/language/LanguageProvider';
import { useInnerLanguageWithForcedNodeSelector, useLanguage } from 'src/features/language/useLanguage';
import { useIsSubformPage, useNavigate } from 'src/features/routing/AppRoutingContext';
import { useAddEntryMutation, useDeleteEntryMutation } from 'src/features/subformData/useSubformMutations';
import { isSubformValidation } from 'src/features/validation';
import { useComponentValidationsForNode } from 'src/features/validation/selectors/componentValidationsForNode';
import { useShallowObjectMemo } from 'src/hooks/useShallowObjectMemo';
import { ComponentStructureWrapper } from 'src/layout/ComponentStructureWrapper';
import classes from 'src/layout/Subform/SubformComponent.module.css';
import { useEvalExpression } from 'src/utils/layout/generator/useEvalExpression';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import { getStatefulDataModelUrl } from 'src/utils/urls/appUrlHelper';
import type { AttachmentsSelector } from 'src/features/attachments/AttachmentsStorePlugin';
import type { ExprValToActualOrExpr } from 'src/features/expressions/types';
import type { NodeOptionsSelector } from 'src/features/options/OptionsStorePlugin';
import type { PropsFromGenericComponent } from 'src/layout';
import type { IDataModelReference } from 'src/layout/common.generated';
import type { IData } from 'src/types/shared';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { Hidden, NodeDataSelector } from 'src/utils/layout/NodesContext';
import type { DataModelTransposeSelector } from 'src/utils/layout/useDataModelBindingTranspose';
import type { ExpressionDataSources } from 'src/utils/layout/useExpressionDataSources';
import type { NodeFormDataSelector } from 'src/utils/layout/useNodeItem';
import type { NodeTraversalSelector } from 'src/utils/layout/useNodeTraversal';

export function SubformComponent({ node }: PropsFromGenericComponent<'Subform'>): React.JSX.Element | null {
  const {
    id,
    layoutSet,
    textResourceBindings,
    tableColumns = [],
    showAddButton = true,
    showDeleteButton = true,
  } = useNodeItem(node);

  const isSubformPage = useIsSubformPage();
  if (isSubformPage) {
    window.logErrorOnce('Cannot use a SubformComponent component within a subform');
    throw new Error('Cannot use a SubformComponent component within a subform');
  }

  const dataType = useDataTypeFromLayoutSet(layoutSet);

  if (!dataType) {
    window.logErrorOnce(`Unable to find data type for subform with id ${id}`);
    throw new Error(`Unable to find data type for subform with id ${id}`);
  }

  const { langAsString } = useLanguage();
  const addEntryMutation = useAddEntryMutation(dataType);
  const dataElements = useStrictDataElements(dataType);
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [subformEntries, updateSubformEntries] = useState(dataElements);

  const subformIdsWithError = useComponentValidationsForNode(node).find(isSubformValidation)?.subformDataElementIds;

  const addEntry = async () => {
    setIsAdding(true);

    try {
      const result = await addEntryMutation.mutateAsync({});
      navigate(`${node.id}/${result.id}`);
    } catch {
      // NOTE: Handled by useAddEntryMutation
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <ComponentStructureWrapper node={node}>
      <Grid
        id={node.id}
        container={true}
        item={true}
        data-componentid={node.id}
        data-componentbaseid={node.baseId}
      >
        <Table
          id={`subform-${id}-table`}
          className={classes.subformTable}
        >
          <Caption
            id={`subform-${id}-caption`}
            title={<Lang id={textResourceBindings?.title} />}
            description={textResourceBindings?.description && <Lang id={textResourceBindings?.description} />}
          />
          {subformEntries.length > 0 && (
            <>
              <Table.Head id={`subform-${id}-table-body`}>
                <Table.Row>
                  {tableColumns.length ? (
                    tableColumns.map((entry, index) => (
                      <Table.HeaderCell
                        className={classes.tableCellFormatting}
                        key={index}
                      >
                        <Lang id={entry.headerContent} />
                      </Table.HeaderCell>
                    ))
                  ) : (
                    <Table.HeaderCell className={classes.tableCellFormatting}>
                      <Lang id='form_filler.subform_default_header' />
                    </Table.HeaderCell>
                  )}
                  <Table.HeaderCell>
                    <span className={classes.visuallyHidden}>
                      <Lang id='general.edit' />
                    </span>
                  </Table.HeaderCell>
                  {showDeleteButton && (
                    <Table.HeaderCell>
                      <span className={classes.visuallyHidden}>
                        <Lang id='general.delete' />
                      </span>
                    </Table.HeaderCell>
                  )}
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {subformEntries.map((dataElement, index) => (
                  <SubformTableRow
                    key={dataElement.id}
                    dataElement={dataElement}
                    node={node}
                    hasErrors={Boolean(subformIdsWithError?.includes(dataElement.id))}
                    rowNumber={index}
                    showDeleteButton={showDeleteButton}
                    deleteEntryCallback={(d) => {
                      const items = subformEntries.filter((x) => x.id != d.id);
                      updateSubformEntries([...items]);
                    }}
                  />
                ))}
              </Table.Body>
            </>
          )}
        </Table>

        {showAddButton && (
          <div className={classes.addButton}>
            <Button
              id={`subform-${id}-add-button`}
              size='md'
              disabled={isAdding}
              onClick={async () => await addEntry()}
              onKeyUp={async (event: React.KeyboardEvent<HTMLButtonElement>) => {
                const allowedKeys = ['enter', ' ', 'spacebar'];
                if (allowedKeys.includes(event.key.toLowerCase())) {
                  await addEntry();
                }
              }}
              variant='secondary'
              fullWidth
            >
              <AddIcon
                fontSize='1.5rem'
                aria-hidden='true'
              />
              {langAsString(textResourceBindings?.addButton)}
            </Button>
          </div>
        )}
      </Grid>
    </ComponentStructureWrapper>
  );
}

function SubformTableRow({
  dataElement,
  node,
  hasErrors,
  rowNumber,
  showDeleteButton,
  deleteEntryCallback,
}: {
  dataElement: IData;
  node: LayoutNode<'Subform'>;
  hasErrors: boolean;
  rowNumber: number;
  showDeleteButton: boolean;
  deleteEntryCallback: (dataElement: IData) => void;
}) {
  const id = dataElement.id;
  const { tableColumns = [], layoutSet } = useNodeItem(node);
  const instanceId = useStrictInstanceId();
  const url = getStatefulDataModelUrl(instanceId, id, true);
  const { isFetching, data, error, failureCount } = useFormDataQuery(url);
  const { langAsString } = useLanguage();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteEntryMutation = useDeleteEntryMutation(id);
  const deleteButtonText = langAsString('general.delete');
  const editButtonText = langAsString('general.edit');

  const numColumns = tableColumns.length;
  const actualColumns = showDeleteButton ? numColumns + 1 : numColumns;

  if (isFetching) {
    return (
      <Table.Row>
        <Table.Cell colSpan={actualColumns}>
          <Spinner title={langAsString('general.loading')} />
        </Table.Cell>
      </Table.Row>
    );
  } else if (error) {
    console.error(`Error loading data element ${id} from server. Gave up after ${failureCount} attempt(s).`, error);
    return (
      <Table.Row>
        <Table.Cell colSpan={actualColumns}>
          <Lang id='form_filler.error_fetch_subform' />
        </Table.Cell>
      </Table.Row>
    );
  }

  const deleteEntry = async () => {
    setIsDeleting(true);

    try {
      await deleteEntryMutation.mutateAsync(id);
      deleteEntryCallback(dataElement);
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <Table.Row
      key={`subform-row-${id}`}
      data-row-num={rowNumber}
      className={cn({ [classes.disabledRow]: isDeleting, [classes.tableRowError]: hasErrors })}
    >
      {tableColumns.length ? (
        tableColumns.map((entry, index) => (
          <Table.Cell key={`subform-cell-${id}-${index}`}>
            {entry.cellContent.query ? (
              <DataQueryWithDefaultValue
                data={data}
                query={entry.cellContent.query}
                defaultValue={entry.cellContent.default}
              />
            ) : entry.cellContent.expr ? (
              <ExpressionData
                data={data}
                layoutSet={layoutSet}
                node={node}
                expr={entry.cellContent.expr}
                defaultValue={entry.cellContent.default}
              />
            ) : (
              ''
            )}
          </Table.Cell>
        ))
      ) : (
        <Table.Cell key={`subform-cell-${id}-0`}>{String(id)}</Table.Cell>
      )}
      <Table.Cell className={classes.buttonCell}>
        <div className={classes.buttonInCellWrapper}>
          <Button
            disabled={isDeleting}
            variant='tertiary'
            color='second'
            onClick={async () => navigate(`${node.id}/${id}${hasErrors ? '?validate=true' : ''}`)}
            aria-label={editButtonText}
            className={classes.tableButton}
          >
            {editButtonText}
            <EditIcon
              fontSize='1rem'
              aria-hidden='true'
            />
          </Button>
        </div>
      </Table.Cell>
      {showDeleteButton && (
        <Table.Cell className={classes.buttonCell}>
          <div className={classes.buttonInCellWrapper}>
            <Button
              disabled={isDeleting}
              variant='tertiary'
              color='danger'
              onClick={async () => await deleteEntry()}
              aria-label={deleteButtonText}
              className={classes.tableButton}
            >
              {deleteButtonText}
              <DeleteIcon
                fontSize='1rem'
                aria-hidden='true'
              />
            </Button>
          </div>
        </Table.Cell>
      )}
    </Table.Row>
  );
}

export interface DataQueryParams {
  data: unknown;
  query: string;
  defaultValue?: string;
}

export function DataQueryWithDefaultValue(props: DataQueryParams) {
  const { data, query, defaultValue } = props;
  const { langAsString } = useLanguage();
  let content = dot.pick(query, data);

  if (!content && defaultValue != undefined) {
    const textLookup = langAsString(defaultValue);
    content = textLookup ? textLookup : defaultValue;
  }

  if (typeof content === 'object' || content === undefined) {
    return null;
  }

  return <>{String(content)}</>;
}

export interface ExpressionDataProps {
  data: unknown;
  layoutSet: string;
  node: LayoutNode<'Subform'>;
  expr: ExprValToActualOrExpr<ExprVal.String>;
  defaultValue?: string;
}

export function ExpressionData({ data, layoutSet, node, expr, defaultValue }: ExpressionDataProps) {
  const { langAsString } = useLanguage();

  const dataType = useLayoutSets().sets.find(({ id }) => id === layoutSet)?.dataType ?? null;
  const dataSources = useExpressionDataSourcesForSubform(dataType, data);

  // To avoid trying to find the transposed data model binding wrt. the node, we have to run the expression in the context of the layout page instead
  const page = node.page;
  let content = useEvalExpression(ExprVal.String, page, expr, '', dataSources);

  if (!content && defaultValue != undefined) {
    content = langAsString(defaultValue);
  }

  if (typeof content === 'object' || content === undefined) {
    return null;
  }

  return <>{String(content)}</>;
}

function notImplementedSelector(..._args: unknown[]): unknown {
  throw 'Expression function `component` and `displayValue` is not implemented for Subform';
}
function notImplementedLaxSelector(..._args: unknown[]): typeof ContextNotProvided {
  return ContextNotProvided;
}

function useExpressionDataSourcesForSubform(dataType: string | null, formData: unknown): ExpressionDataSources {
  const attachmentsSelector = notImplementedSelector as AttachmentsSelector;
  const optionsSelector = notImplementedSelector as NodeOptionsSelector;
  const nodeDataSelector = notImplementedSelector as NodeDataSelector;
  const isHiddenSelector = notImplementedSelector as ReturnType<typeof Hidden.useIsHiddenSelector>;
  const nodeTraversal = notImplementedSelector as NodeTraversalSelector;
  const transposeSelector = notImplementedSelector as DataModelTransposeSelector;
  const nodeFormDataSelector = notImplementedSelector as NodeFormDataSelector;

  const formDataSelector = (reference: IDataModelReference) => {
    // TODO: Should we allow selecting from data types in the main form as well?
    if (reference.dataType !== dataType) {
      return null;
    }
    return dot.pick(reference.field, formData);
  };

  const dataModelNames = dataType ? [dataType] : [];

  const process = useLaxProcessData();
  const applicationSettings = useApplicationSettings();
  const currentLanguage = useCurrentLanguage();

  const instanceDataSources = useLaxInstanceDataSources();
  const externalApis = useExternalApis(useApplicationMetadata().externalApiIds ?? []);
  const langToolsSelector = useInnerLanguageWithForcedNodeSelector(
    dataType ?? undefined,
    dataModelNames,
    formDataSelector,
    notImplementedLaxSelector as NodeDataSelector,
  );

  return useShallowObjectMemo({
    formDataSelector,
    attachmentsSelector,
    optionsSelector,
    nodeDataSelector,
    process,
    applicationSettings,
    instanceDataSources,
    langToolsSelector,
    currentLanguage,
    isHiddenSelector,
    nodeFormDataSelector,
    nodeTraversal,
    transposeSelector,
    defaultDataType: dataType,
    externalApis,
    dataModelNames,
  });
}
