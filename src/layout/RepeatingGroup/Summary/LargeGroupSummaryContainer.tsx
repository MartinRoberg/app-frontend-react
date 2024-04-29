import React from 'react';

import { Fieldset, Heading } from '@digdir/designsystemet-react';
import cn from 'classnames';

import { Lang } from 'src/features/language/Lang';
import classes from 'src/layout/RepeatingGroup/Summary/LargeGroupSummaryContainer.module.css';
import { pageBreakStyles } from 'src/utils/formComponentUtils';
import { BaseLayoutNode } from 'src/utils/layout/LayoutNode';
import { Hidden } from 'src/utils/layout/NodesContext';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import type { HeadingLevel } from 'src/layout/common.generated';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export interface IDisplayRepAsLargeGroup {
  groupNode: LayoutNode<'RepeatingGroup'>;
  id?: string;
  onlyInRowUuid?: string | undefined;
  renderLayoutNode: (node: LayoutNode) => JSX.Element | null;
}

const headingSizes: { [k in HeadingLevel]: Parameters<typeof Heading>[0]['size'] } = {
  [2]: 'medium',
  [3]: 'small',
  [4]: 'xsmall',
  [5]: 'xsmall',
  [6]: 'xsmall',
};

export function LargeGroupSummaryContainer({
  groupNode,
  id,
  onlyInRowUuid,
  renderLayoutNode,
}: IDisplayRepAsLargeGroup) {
  const item = useNodeItem(groupNode);
  const isHidden = Hidden.useIsHidden(groupNode);
  if (isHidden) {
    return null;
  }
  const { title, summaryTitle } = item.textResourceBindings || {};

  const isNested = groupNode.parent instanceof BaseLayoutNode;
  const headingLevel = Math.min(Math.max(groupNode.parents().length + 1, 2), 6) as HeadingLevel;
  const headingSize = headingSizes[headingLevel];
  const legend = summaryTitle ?? title;
  const restriction = typeof onlyInRowUuid === 'string' ? { onlyInRowUuid } : undefined;

  return (
    <Fieldset
      legend={
        legend && (
          <Heading
            level={headingLevel}
            size={headingSize}
          >
            <Lang
              id={legend}
              node={groupNode}
            />
          </Heading>
        )
      }
      className={cn(pageBreakStyles(item.pageBreak), classes.summary, {
        [classes.largeGroupContainer]: !isNested,
      })}
    >
      <div
        id={id || item.id}
        className={classes.largeGroupContainer}
      >
        {groupNode.children(undefined, restriction).map((n) => renderLayoutNode(n))}
      </div>
    </Fieldset>
  );
}
