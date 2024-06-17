import React from 'react';

import { Heading } from '@digdir/designsystemet-react';

import { Fieldset } from 'src/components/form/Fieldset';
import { Lang } from 'src/features/language/Lang';
import classes from 'src/layout/Likert/Summary/LikertSummary.module.css';
import { Hidden } from 'src/utils/layout/NodesContext';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import { useNodeTraversal } from 'src/utils/layout/useNodeTraversal';
import type { HeadingLevel } from 'src/layout/common.generated';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export interface IDisplayLikertContainer {
  groupNode: LayoutNode<'Likert'>;
  divRef?: React.Ref<HTMLDivElement>;
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

export function LargeLikertSummaryContainer({
  divRef,
  groupNode,
  id,
  onlyInRowUuid,
  renderLayoutNode,
}: IDisplayLikertContainer) {
  const container = useNodeItem(groupNode);
  const { title, summaryTitle } = container.textResourceBindings ?? {};
  const isHidden = Hidden.useIsHidden(groupNode);
  const depth = useNodeTraversal((t) => t.parents().length, groupNode);
  const restriction = typeof onlyInRowUuid === 'string' ? { onlyInRowUuid } : undefined;
  const children = useNodeTraversal((t) => t.children(undefined, restriction), groupNode);

  if (isHidden) {
    return null;
  }

  const headingLevel = Math.min(Math.max(depth + 1, 2), 6) as HeadingLevel;
  const headingSize = headingSizes[headingLevel];
  const legend = summaryTitle ?? title;

  return (
    <Fieldset
      legend={
        legend && (
          <Heading
            level={headingLevel}
            size={headingSize}
          >
            <Lang id={legend} />
          </Heading>
        )
      }
      className={classes.summary}
      data-componentid={container.id}
      data-componentbaseid={container.baseComponentId || container.id}
    >
      <div
        ref={divRef}
        id={id || container.id}
        data-testid='display-group-container'
        className={classes.groupContainer}
      >
        {children.map((n) => renderLayoutNode(n))}
      </div>
    </Fieldset>
  );
}
