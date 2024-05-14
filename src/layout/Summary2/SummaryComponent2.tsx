import React from 'react';

import { useLayouts } from 'src/features/form/layout/LayoutsContext';
import { useGetLayoutSetById } from 'src/features/form/layoutSets/useCurrentLayoutSetId';
import { useGetPage, useResolvedNode } from 'src/utils/layout/NodesContext';
import type { IGrid } from 'src/layout/common.generated';
import type { SummaryDisplayProperties } from 'src/layout/Summary/config.generated';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export interface ISummaryComponent2 {
  summaryNode: LayoutNode<'Summary2'>;
  overrides?: {
    targetNode?: LayoutNode;
    grid?: IGrid;
    largeGroup?: boolean;
    display?: SummaryDisplayProperties;
  };
}

interface LayoutSetSummaryProps {
  layoutSetId: string;
}
interface PageSummaryProps {
  pageId: string;
}

interface ComponentSummaryProps {
  componentNode: LayoutNode;
}

function LayoutSetSummary({ layoutSetId }: LayoutSetSummaryProps) {
  const layoutSet = useGetLayoutSetById(layoutSetId);

  const layouts = Object.keys(useLayouts());
  if (!layoutSet) {
    throw new Error('LayoutSetId invalid in LayoutSetSummary.');
  }
  return (
    <div style={{ border: '2px solid blue' }}>
      {layouts.map((layoutId) => (
        <PageSummary
          pageId={layoutId}
          key={layoutId}
        />
      ))}
    </div>
  );
}

function ComponentSummary({ componentNode }: ComponentSummaryProps) {
  if (componentNode.isHidden()) {
    return null;
  }

  const childComponents =
    componentNode.item.type === 'Group' &&
    componentNode.item.childComponents.map((child) => (
      <ComponentSummary
        componentNode={child}
        key={child.item.id}
      />
    ));

  const renderedComponent = componentNode.def.renderSummary2
    ? componentNode.def.renderSummary2(componentNode as LayoutNode<any>)
    : null;

  return (
    <div style={{ border: '2px solid yellow', display: 'flex', flexDirection: 'column' }}>
      {renderedComponent && <div>{renderedComponent}</div>}
      {childComponents}
    </div>
  );
}

function PageSummary({ pageId }: PageSummaryProps) {
  const page = useGetPage(pageId);

  if (!page) {
    throw new Error('PageId invalid in PageSummary.');
  }

  return (
    <div style={{ border: '2px solid green' }}>
      {page.children().map((child) => (
        <ComponentSummary
          componentNode={child}
          key={child.item.id}
        />
      ))}
    </div>
  );
}

interface ResolveComponentProps {
  componentId: string;
}

function ResolveComponent({ componentId }: ResolveComponentProps) {
  const resolvedComponent = useResolvedNode(componentId);
  if (!resolvedComponent) {
    return null;
  }

  return <ComponentSummary componentNode={resolvedComponent} />;
}

function _SummaryComponent2({ summaryNode }: ISummaryComponent2) {
  if (summaryNode.item.whatToRender.type === 'layoutSet') {
    return <LayoutSetSummary layoutSetId={summaryNode.item.whatToRender.id} />;
  }

  if (summaryNode.item.whatToRender.type === 'page') {
    return <PageSummary pageId={summaryNode.item.whatToRender.id} />;
  }

  if (summaryNode.item.whatToRender.type === 'component') {
    return <ResolveComponent componentId={summaryNode.item.whatToRender.id} />;
  }

  throw new Error(`Invalid summary render type: ${summaryNode.item.whatToRender.type}`);
}
export const SummaryComponent2 = React.forwardRef(_SummaryComponent2);
