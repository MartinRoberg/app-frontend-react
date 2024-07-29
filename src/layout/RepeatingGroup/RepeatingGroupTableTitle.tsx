import React from 'react';

import { Lang } from 'src/features/language/Lang';
import classes from 'src/layout/RepeatingGroup/RepeatingGroup.module.css';
import { getColumnStylesRepeatingGroups } from 'src/utils/formComponentUtils';
import type { ITableColumnFormatting } from 'src/layout/common.generated';
import type { GenericTableCell } from 'src/layout/RepeatingGroup/repeatingGroupUtils';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

interface IProps {
  groupNode: LayoutNode<'RepeatingGroup'>;
  cell: GenericTableCell;
  columnSettings: ITableColumnFormatting;
}

export const RepeatingGroupTableTitle = ({ groupNode, cell, columnSettings }: IProps) => (
  <span
    className={classes.contentFormatting}
    style={getColumnStylesRepeatingGroups(cell, columnSettings)}
  >
    <Lang
      id={cell.header}
      node={groupNode}
    />
  </span>
);
