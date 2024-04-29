import React from 'react';

import { Heading } from '@digdir/designsystemet-react';

import { Fieldset } from 'src/components/form/Fieldset';
import { Lang } from 'src/features/language/Lang';
import classes from 'src/layout/Likert/Summary/LikertSummary.module.css';
import { Hidden } from 'src/utils/layout/NodesContext';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
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

  if (isHidden) {
    return null;
  }

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
            <Lang id={legend} />
          </Heading>
        )
      }
      className={classes.summary}
    >
      <div
        ref={divRef}
        id={id || container.id}
        data-componentid={container.id}
        data-testid='display-group-container'
        className={classes.groupContainer}
      >
        {groupNode.children(undefined, restriction).map((n) => renderLayoutNode(n))}
      </div>
    </Fieldset>
  );
}
