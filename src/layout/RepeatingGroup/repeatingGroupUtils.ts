import { implementsDisplayData } from '..';

import { CompCategory } from 'src/layout/common';
import type { DisplayDataProps } from 'src/features/displayData';
import type { ITextResourceBindings } from 'src/layout/layout';
import type {
  CompRepeatingGroupExternal,
  IGroupEditPropertiesInternal,
} from 'src/layout/RepeatingGroup/config.generated';
import type { ChildLookupRestriction } from 'src/utils/layout/HierarchyGenerator';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

type BaseTableCell<T extends string> = {
  type: T;
  id: string;
  header: string;
};
export type NodeTableCell = BaseTableCell<'node'> & {
  node: LayoutNode;
};
export type TextTableCell = BaseTableCell<'text'> & {
  content: string;
};

export type GenericTableCell = NodeTableCell | TextTableCell;

export function isNodeTableCell(cell: GenericTableCell): cell is NodeTableCell {
  return cell.type === 'node';
}

export function isTextTableCell(cell: GenericTableCell): cell is TextTableCell {
  return cell.type === 'text';
}

function getTableTitle(trb: ITextResourceBindings | undefined) {
  if (!trb) {
    return '';
  }

  if ('tableTitle' in trb && trb.tableTitle) {
    return trb.tableTitle;
  }

  if ('title' in trb && trb.title) {
    return trb.title;
  }

  return '';
}

// Returns a list of RepeatingGroupCell objects in the correct order representing the data to show in the table
export function getRepeatingGroupRowCells(
  groupNode: LayoutNode<'RepeatingGroup'>,
  restriction: ChildLookupRestriction,
): GenericTableCell[] {
  const { tableHeaders, tableExtraColumns } = groupNode.item;

  // If no tableHeaders are specified, default to showing all nodes of category form
  if (!tableHeaders) {
    return groupNode
      .children(undefined, restriction)
      .filter((child) => child.isCategory(CompCategory.Form))
      .map((child) => ({
        type: 'node',
        id: child.item.baseComponentId ?? child.item.id,
        header: getTableTitle(child.item.textResourceBindings),
        node: child,
      }));
  }

  const nodes = groupNode.children(undefined, restriction).filter((child) => child.isCategory(CompCategory.Form));

  return tableHeaders
    .map((column) => {
      // Look for matching child node
      const matchingChild = nodes.find((child) => {
        const { id, baseComponentId } = child.item;
        return column === baseComponentId ?? id;
      });

      if (matchingChild) {
        return {
          type: 'node',
          id: column,
          header: getTableTitle(matchingChild.item.textResourceBindings),
          node: matchingChild,
        };
      }

      // Look in tableExtraColumns
      const extraColumn = tableExtraColumns?.[column];
      // eslint-disable-next-line sonarjs/no-collapsible-if
      if (extraColumn) {
        // Will add more cases later
        if ('content' in extraColumn) {
          return {
            type: 'text',
            id: column,
            header: extraColumn.columnTitle,
            content: extraColumn.content,
          };
        }
      }

      return null;
    })
    .filter((cell) => cell !== null) as GenericTableCell[]; // This typecast should become unecessary in ts 5.5 (https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-5.html#inferred-type-predicates)
}

export function getCellDisplayData(cell: GenericTableCell, displayDataProps: DisplayDataProps): string {
  if (cell.type === 'node') {
    return implementsDisplayData(cell.node.def) ? cell.node.def.getDisplayData(cell.node as any, displayDataProps) : '';
  } else if (cell.type === 'text') {
    return cell.content;
  }

  return '';
}

export function shouldEditInTable(
  groupEdit: IGroupEditPropertiesInternal,
  cell: GenericTableCell,
  columnSettings: CompRepeatingGroupExternal['tableColumns'],
): cell is NodeTableCell {
  if (cell.type !== 'node') {
    return false;
  }

  const column = columnSettings && columnSettings[cell.node.item.baseComponentId || cell.node.item.id];
  if (groupEdit?.mode === 'onlyTable' && column?.editInTable !== false) {
    return cell.node.def.canRenderInTable();
  }

  if (column && column.editInTable) {
    return cell.node.def.canRenderInTable();
  }

  return false;
}
