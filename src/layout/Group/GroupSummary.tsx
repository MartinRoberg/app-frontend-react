import React from 'react';

import { Heading, Paragraph } from '@digdir/designsystemet-react';
import cn from 'classnames';
import type { HeadingProps } from '@digdir/designsystemet-react';

import classes from 'src/layout/Group/GroupSummary.module.css';
import { ComponentSummary } from 'src/layout/Summary2/SummaryComponent2/ComponentSummary';
import type { GroupSummaryOverrideProps } from 'src/layout/Summary2/config.generated';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

type GroupComponentSummaryProps = {
  componentNode: LayoutNode<'Group'>;
  hierarchyLevel?: number;
  summaryOverrides?: GroupSummaryOverrideProps;
};

type HeadingLevel = HeadingProps['level'];

function getHeadingLevel(hierarchyLevel: number): HeadingLevel {
  const minimumHeadingLevel = 3;
  const maximumHeadingLevel = 6;
  const computedHeadingLevel = minimumHeadingLevel + hierarchyLevel;
  if (computedHeadingLevel <= maximumHeadingLevel) {
    return computedHeadingLevel as HeadingLevel;
  }
  if (computedHeadingLevel > maximumHeadingLevel) {
    return maximumHeadingLevel;
  }
}
const RenderChildComponents = ({ componentNode, hierarchyLevel, summaryOverrides }: GroupComponentSummaryProps) => {
  if (!('childComponents' in componentNode.item)) {
    return null;
  }

  return (
    componentNode?.item?.childComponents?.length &&
    componentNode.item.childComponents.map((child) => {
      if (child?.item?.type === 'Group') {
        return (
          <GroupSummary
            componentNode={child as LayoutNode<'Group'>}
            hierarchyLevel={hierarchyLevel ? hierarchyLevel + 1 : 1}
            key={componentNode.item.id}
            summaryOverrides={summaryOverrides as GroupSummaryOverrideProps}
          />
        );
      } else {
        const isCompact = summaryOverrides?.['isCompact'];
        return (
          <div
            key={child?.item?.id}
            className={cn(classes.childItem)}
          >
            <ComponentSummary
              componentNode={child}
              isCompact={isCompact}
            />
          </div>
        );
      }
    })
  );
};

export const GroupSummary = ({ componentNode, hierarchyLevel = 0, summaryOverrides }: GroupComponentSummaryProps) => {
  const title = componentNode.item.textResourceBindings?.title;
  const description = componentNode.item.textResourceBindings?.description;
  const headingLevel = getHeadingLevel(hierarchyLevel);
  const isGroup = componentNode.item.type === 'Group';
  const isNestedGroup = isGroup && hierarchyLevel > 0;

  return (
    <section className={isNestedGroup ? cn(classes.groupContainer, classes.nested) : cn(classes.groupContainer)}>
      <div className={cn(classes.groupHeading)}>
        <Heading
          size={isNestedGroup ? 'xsmall' : 'small'}
          level={headingLevel}
        >
          {title}
        </Heading>
        <Paragraph className={cn(classes.description)}>{description}</Paragraph>
      </div>
      <RenderChildComponents
        componentNode={componentNode}
        hierarchyLevel={hierarchyLevel}
        summaryOverrides={summaryOverrides}
      />
    </section>
  );
};
