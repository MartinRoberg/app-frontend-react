import React from 'react';

import { Grid } from '@material-ui/core';
import cn from 'classnames';

import classes from 'src/layout/Summary2/SummaryComponent2/SummaryComponent2.module.css';
import { gridBreakpoints, pageBreakStyles } from 'src/utils/formComponentUtils';
import { useNode } from 'src/utils/layout/NodesContext';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import type { CompExternal, CompInternal, CompTypes } from 'src/layout/layout';
import type { Summary2Props } from 'src/layout/Summary2/SummaryComponent2/types';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

interface ComponentSummaryProps<T extends CompTypes> {
  componentNode: LayoutNode<T>;
  summaryOverrides?: CompInternal<'Summary2'>['overrides'];
  isCompact?: boolean;
}

export function ComponentSummary<T extends CompTypes>({
  componentNode,
  summaryOverrides,
  isCompact,
}: ComponentSummaryProps<T>) {
  const { pageBreak, grid } = useNodeItem(componentNode, (i) => ({ pageBreak: i.pageBreak, grid: i.grid }));
  const overrides = summaryOverrides?.find((override) => override.componentId === componentNode.baseId);
  const props: Summary2Props<T> = {
    target: componentNode,
    overrides: summaryOverrides,
    isCompact,
  };

  const renderedComponent = componentNode.def.renderSummary2 ? (componentNode.def as any).renderSummary2(props) : null;
  if (!renderedComponent) {
    return null;
  }

  if (overrides?.hidden) {
    return null;
  }

  return (
    <Grid
      item={true}
      className={cn(pageBreakStyles(pageBreak), classes.summaryItem)}
      {...gridBreakpoints(grid)}
    >
      {renderedComponent}
    </Grid>
  );
}

interface ResolveComponentProps {
  summaryTarget: CompExternal<'Summary2'>['target'];
  summaryOverrides?: CompInternal<'Summary2'>['overrides'];
}

export function ResolveComponent({ summaryTarget, summaryOverrides }: ResolveComponentProps) {
  if (!summaryTarget?.id) {
    window.logError('Tried to render component without component ID, please add id property to target.');
    throw new Error();
  }

  const resolvedComponent = useNode(summaryTarget.id);
  if (!resolvedComponent) {
    return null;
  }

  return (
    <ComponentSummary
      componentNode={resolvedComponent}
      summaryOverrides={summaryOverrides}
    />
  );
}
