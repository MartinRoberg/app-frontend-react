import type { GridCellLabelFrom, GridCellText, GridComponentRef, GridRow } from 'src/layout/common.generated';
import type { CompTypes } from 'src/layout/layout';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export interface GridCellNode<T extends CompTypes = CompTypes> extends Omit<GridComponentRef, 'component'> {
  node: LayoutNode<T>;
}

export type GridCellInternal = GridCellNode | null | GridCellText | GridCellLabelFrom;

export interface GridRowInternal extends Omit<GridRow, 'cells'> {
  cells: GridCellInternal[];
}

export type GridRowsInternal = GridRowInternal[];
