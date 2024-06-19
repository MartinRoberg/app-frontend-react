import React from 'react';

import { Lang } from 'src/features/language/Lang';
import { useUnifiedValidationsForNode } from 'src/features/validation/selectors/unifiedValidationsForNode';
import { validationsOfSeverity } from 'src/features/validation/utils';
import { MultipleValueSummary } from 'src/layout/Summary2/CommonSummaryComponents/MultipleValueSummary';
import type { CompCheckboxesInternal } from 'src/layout/Checkboxes/config.generated';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

type CheckboxesSummaryProps = {
  componentNode: LayoutNode<'Checkboxes'>;
  summaryOverrides?: CompCheckboxesInternal['summaryProps'];
  displayData: string;
};

export const CheckboxesSummary = ({ componentNode, summaryOverrides, displayData }: CheckboxesSummaryProps) => {
  const maxStringLength = 75;
  const showAsList =
    summaryOverrides?.displayType === 'list' ||
    (!summaryOverrides?.displayType && displayData?.length >= maxStringLength);
  const validations = useUnifiedValidationsForNode(componentNode);
  const errors = validationsOfSeverity(validations, 'error');
  const title = componentNode.item.textResourceBindings?.title;
  return (
    <MultipleValueSummary
      title={<Lang id={title} />}
      displayData={displayData}
      errors={errors}
      componentNode={componentNode}
      showAsList={showAsList}
    />
  );
};
