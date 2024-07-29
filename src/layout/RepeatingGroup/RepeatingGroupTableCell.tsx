import React from 'react';

import { Table } from '@digdir/designsystemet-react';
import { Grid } from '@material-ui/core';
import cn from 'classnames';

import { useDisplayDataProps } from 'src/features/displayData/useDisplayData';
import { Lang } from 'src/features/language/Lang';
import { GenericComponent } from 'src/layout/GenericComponent';
import classes from 'src/layout/RepeatingGroup/RepeatingGroup.module.css';
import { useRepeatingGroup } from 'src/layout/RepeatingGroup/RepeatingGroupContext';
import { useRepeatingGroupsFocusContext } from 'src/layout/RepeatingGroup/RepeatingGroupFocusContext';
import {
  type GenericTableCell,
  getCellDisplayData,
  shouldEditInTable,
} from 'src/layout/RepeatingGroup/repeatingGroupUtils';
import { getColumnStylesRepeatingGroups } from 'src/utils/formComponentUtils';
import type { ITableColumnFormatting } from 'src/layout/common.generated';
import type { HRepGroupRow, IGroupEditPropertiesInternal } from 'src/layout/RepeatingGroup/config.generated';

type RepeatingGroupTableCellProps = {
  cell: GenericTableCell;
  index: number;
  length: number;
  row: HRepGroupRow;
  edit: IGroupEditPropertiesInternal;
  columnSettings: ITableColumnFormatting | undefined;
  mobileView?: boolean;
};

export function RepeatingGroupTableCell(props: RepeatingGroupTableCellProps) {
  const { mobileView } = props;

  if (mobileView) {
    return <RepeatingGroupTableCellContent {...props} />;
  }

  return (
    <Table.Cell className={classes.tableCell}>
      <RepeatingGroupTableCellContent {...props} />
    </Table.Cell>
  );
}

function RepeatingGroupTableCellContent({
  cell,
  index,
  length,
  row,
  edit,
  columnSettings,
  mobileView,
}: RepeatingGroupTableCellProps) {
  const { isEditing, node: groupNode } = useRepeatingGroup();
  const { refSetter } = useRepeatingGroupsFocusContext();
  const displayDataProps = useDisplayDataProps();

  const isEditingRow = isEditing(row.uuid);

  // Render component in table
  if (shouldEditInTable(edit, cell, columnSettings)) {
    return (
      <div
        style={{ display: 'contents' }}
        ref={(ref) => refSetter && refSetter(row.index, `component-${cell.node.item.id}`, ref)}
      >
        <GenericComponent
          node={cell.node}
          overrideDisplay={
            !mobileView
              ? {
                  renderedInTable: true,
                  renderLabel: false,
                  renderLegend: false,
                }
              : {}
          }
          overrideItemProps={{
            grid: {},
          }}
        />
      </div>
    );
  }

  // Render text content in table
  if (mobileView) {
    return (
      <Grid
        container={true}
        item={true}
      >
        <b className={cn(classes.contentFormatting, classes.spaceAfterContent)}>
          <Lang
            id={cell.header}
            node={groupNode}
          />
          :
        </b>
        <span className={classes.contentFormatting}>{getCellDisplayData(cell, displayDataProps)}</span>
        {index < length - 1 && <div style={{ height: 8 }} />}
      </Grid>
    );
  }
  return (
    <span
      className={classes.contentFormatting}
      style={getColumnStylesRepeatingGroups(cell, columnSettings)}
    >
      {isEditingRow ? null : getCellDisplayData(cell, displayDataProps)}
    </span>
  );
}
