import React from 'react';

import { Button, Table } from '@digdir/designsystemet-react';
import { Grid } from '@material-ui/core';
import { Delete as DeleteIcon, Edit as EditIcon, ErrorColored as ErrorIcon } from '@navikt/ds-icons';
import cn from 'classnames';

import { ConditionalWrapper } from 'src/components/ConditionalWrapper';
import { DeleteWarningPopover } from 'src/components/molecules/DeleteWarningPopover';
import { useDisplayDataProps } from 'src/features/displayData/useDisplayData';
import { useLanguage } from 'src/features/language/useLanguage';
import { useDeepValidationsForNode } from 'src/features/validation/selectors/deepValidationsForNode';
import { useAlertOnChange } from 'src/hooks/useAlertOnChange';
import { useIsMobile } from 'src/hooks/useIsMobile';
import classes from 'src/layout/RepeatingGroup/RepeatingGroup.module.css';
import { useRepeatingGroup } from 'src/layout/RepeatingGroup/RepeatingGroupContext';
import { RepeatingGroupTableCell } from 'src/layout/RepeatingGroup/RepeatingGroupTableCell';
import {
  getCellDisplayData,
  getRepeatingGroupRowCells,
  shouldEditInTable,
} from 'src/layout/RepeatingGroup/repeatingGroupUtils';
import type { IUseLanguage } from 'src/features/language/useLanguage';
import type { AlertOnChange } from 'src/hooks/useAlertOnChange';
import type { ITextResourceBindings } from 'src/layout/layout';
import type {
  CompRepeatingGroupInternal,
  IGroupEditPropertiesInternal,
} from 'src/layout/RepeatingGroup/config.generated';
import type { NodeTableCell } from 'src/layout/RepeatingGroup/repeatingGroupUtils';

export interface IRepeatingGroupTableRowProps {
  className?: string;
  uuid: string;
  mobileView: boolean;
  displayEditColumn: boolean;
  displayDeleteColumn: boolean;
}

function getTableTitle(textResourceBindings: ITextResourceBindings) {
  if (!textResourceBindings) {
    return '';
  }

  if ('tableTitle' in textResourceBindings) {
    return textResourceBindings.tableTitle;
  }

  if ('title' in textResourceBindings) {
    return textResourceBindings.title;
  }

  return '';
}

function getEditButtonText(
  isEditing: boolean,
  langTools: IUseLanguage,
  textResourceBindings: CompRepeatingGroupInternal['textResourceBindings'] | undefined,
) {
  const buttonTextKey = isEditing
    ? textResourceBindings?.edit_button_close
      ? textResourceBindings?.edit_button_close
      : 'general.save_and_close'
    : textResourceBindings?.edit_button_open
      ? textResourceBindings?.edit_button_open
      : 'general.edit_alt';
  return langTools.langAsString(buttonTextKey);
}

export function RepeatingGroupTableRow({
  className,
  uuid,
  mobileView,
  displayEditColumn,
  displayDeleteColumn,
}: IRepeatingGroupTableRowProps): JSX.Element | null {
  const mobileViewSmall = useIsMobile();

  const { node, deleteRow, isEditing, isDeleting, toggleEditing } = useRepeatingGroup();
  const langTools = useLanguage();
  const { langAsString } = langTools;
  const id = node.item.id;
  const group = node.item;
  const row = group.rows.find((r) => r.uuid === uuid);
  const expressionsForRow = row?.groupExpressions;
  const columnSettings = group.tableColumns;
  const edit = {
    ...group.edit,
    ...expressionsForRow?.edit,
  } as IGroupEditPropertiesInternal;
  const resolvedTextBindings = {
    ...group.textResourceBindings,
    ...expressionsForRow?.textResourceBindings,
  } as CompRepeatingGroupInternal['textResourceBindings'];

  const alertOnDelete = useAlertOnChange(Boolean(edit?.alertOnDelete), deleteRow);

  const cells = getRepeatingGroupRowCells(node, { onlyInRowUuid: uuid });
  const displayDataProps = useDisplayDataProps();
  const displayData = cells.map((cell) => getCellDisplayData(cell, displayDataProps));
  const firstCellData = displayData.find((c) => !!c);
  const isEditingRow = isEditing(uuid);
  const isDeletingRow = isDeleting(uuid);

  // If the row has errors we should highlight the row, unless the errors are for components that are shown in the table,
  // then the component getting highlighted is enough
  const tableEditingNodeIds = cells
    .filter((c) => shouldEditInTable(edit, c, columnSettings))
    .map((c: NodeTableCell) => c.node.item.id);
  const rowValidations = useDeepValidationsForNode(node, true, uuid);
  const rowHasErrors = rowValidations.some(
    (validation) => validation.severity === 'error' && !tableEditingNodeIds.includes(validation.componentId),
  );

  const editButtonText = rowHasErrors
    ? langAsString('general.edit_alt_error')
    : getEditButtonText(isEditingRow, langTools, resolvedTextBindings);

  const deleteButtonText = langAsString('general.delete');

  if (!row) {
    return null;
  }

  return (
    <Table.Row
      key={`repeating-group-row-${uuid}`}
      className={cn(
        {
          [classes.tableRowError]: rowHasErrors,
        },
        className,
      )}
      data-row-num={row.index}
    >
      {!mobileView ? (
        cells.map((cell, index, { length }) => (
          <RepeatingGroupTableCell
            key={`${cell.id}-${row.uuid}`}
            cell={cell}
            index={index}
            length={length}
            row={row}
            edit={edit}
            columnSettings={columnSettings}
          />
        ))
      ) : (
        <Table.Cell className={classes.mobileTableCell}>
          <Grid
            container={true}
            spacing={3}
          >
            {cells.map(
              (cell, index, { length }) =>
                !isEditingRow && (
                  <RepeatingGroupTableCell
                    key={`${cell.id}-${row.uuid}`}
                    cell={cell}
                    index={index}
                    length={length}
                    row={row}
                    edit={edit}
                    columnSettings={columnSettings}
                    mobileView={true}
                  />
                ),
            )}
          </Grid>
        </Table.Cell>
      )}
      {!mobileView ? (
        <>
          {edit?.editButton === false && edit?.deleteButton === false && (displayEditColumn || displayDeleteColumn) ? (
            <Table.Cell
              key={`editDelete-${uuid}`}
              colSpan={displayEditColumn && displayDeleteColumn ? 2 : 1}
            />
          ) : null}
          {edit?.editButton !== false && displayEditColumn && (
            <Table.Cell
              key={`edit-${uuid}`}
              className={classes.buttonCell}
              colSpan={displayDeleteColumn && edit?.deleteButton === false ? 2 : 1}
            >
              <div className={classes.buttonInCellWrapper}>
                <Button
                  aria-expanded={isEditingRow}
                  aria-controls={isEditingRow ? `group-edit-container-${id}-${uuid}` : undefined}
                  variant='tertiary'
                  color='second'
                  size='small'
                  onClick={() => toggleEditing(uuid)}
                  aria-label={`${editButtonText} ${firstCellData}`}
                  data-testid='edit-button'
                  className={classes.tableButton}
                >
                  {editButtonText}
                  {rowHasErrors ? (
                    <ErrorIcon
                      fontSize='1rem'
                      aria-hidden='true'
                    />
                  ) : (
                    <EditIcon
                      fontSize='1rem'
                      aria-hidden='true'
                    />
                  )}
                </Button>
              </div>
            </Table.Cell>
          )}
          {edit?.deleteButton !== false && displayDeleteColumn && (
            <Table.Cell
              key={`delete-${uuid}`}
              className={cn(classes.buttonCell)}
              colSpan={displayEditColumn && edit?.editButton === false ? 2 : 1}
            >
              <div className={classes.buttonInCellWrapper}>
                <DeleteElement
                  uuid={uuid}
                  isDeletingRow={isDeletingRow}
                  edit={edit}
                  deleteButtonText={deleteButtonText}
                  firstCellData={firstCellData}
                  alertOnDeleteProps={alertOnDelete}
                  langAsString={langAsString}
                >
                  {deleteButtonText}
                </DeleteElement>
              </div>
            </Table.Cell>
          )}
        </>
      ) : (
        <Table.Cell
          className={cn(classes.buttonCell, classes.mobileTableCell)}
          style={{ verticalAlign: 'top' }}
        >
          <div className={classes.buttonInCellWrapper}>
            {edit?.editButton !== false && (
              <Button
                aria-expanded={isEditingRow}
                aria-controls={isEditingRow ? `group-edit-container-${id}-${uuid}` : undefined}
                variant='tertiary'
                color='second'
                size='small'
                icon={!isEditingRow && mobileViewSmall}
                onClick={() => toggleEditing(uuid)}
                aria-label={`${editButtonText} ${firstCellData}`}
                data-testid='edit-button'
                className={classes.tableButton}
              >
                {(isEditingRow || !mobileViewSmall) && editButtonText}
                {rowHasErrors ? (
                  <ErrorIcon
                    fontSize='1rem'
                    aria-hidden='true'
                  />
                ) : (
                  <EditIcon
                    fontSize='1rem'
                    aria-hidden='true'
                  />
                )}
              </Button>
            )}
            {edit?.deleteButton !== false && (
              <>
                <div style={{ height: 8 }} />
                <DeleteElement
                  uuid={uuid}
                  isDeletingRow={isDeletingRow}
                  edit={edit}
                  deleteButtonText={deleteButtonText}
                  firstCellData={firstCellData}
                  alertOnDeleteProps={alertOnDelete}
                  langAsString={langAsString}
                >
                  {isEditingRow || !mobileViewSmall ? deleteButtonText : null}
                </DeleteElement>
              </>
            )}
          </div>
        </Table.Cell>
      )}
    </Table.Row>
  );
}

const DeleteElement = ({
  uuid,
  isDeletingRow,
  edit,
  deleteButtonText,
  firstCellData,
  langAsString,
  alertOnDeleteProps: { alertOpen, setAlertOpen, confirmChange, cancelChange, handleChange: handleDelete },
  children,
}: {
  uuid: string;
  isDeletingRow: boolean;
  edit: IGroupEditPropertiesInternal;
  deleteButtonText: string;
  firstCellData: string | undefined;
  langAsString: (key: string) => string;
  alertOnDeleteProps: AlertOnChange<(uuid: string) => void>;
  children: React.ReactNode;
}) => (
  <ConditionalWrapper
    condition={Boolean(edit?.alertOnDelete)}
    wrapper={(children) => (
      <DeleteWarningPopover
        placement='left'
        deleteButtonText={langAsString('group.row_popover_delete_button_confirm')}
        messageText={langAsString('group.row_popover_delete_message')}
        onCancelClick={cancelChange}
        onPopoverDeleteClick={confirmChange}
        open={alertOpen}
        setOpen={setAlertOpen}
      >
        {children}
      </DeleteWarningPopover>
    )}
  >
    <Button
      variant='tertiary'
      color='danger'
      size='small'
      disabled={isDeletingRow}
      onClick={() => handleDelete(uuid)}
      aria-label={`${deleteButtonText}-${firstCellData}`}
      data-testid='delete-button'
      icon={!children}
      className={classes.tableButton}
    >
      {children}
      <DeleteIcon
        fontSize='1rem'
        aria-hidden='true'
      />
    </Button>
  </ConditionalWrapper>
);
