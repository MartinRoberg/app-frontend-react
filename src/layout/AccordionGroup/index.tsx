import React, { forwardRef } from 'react';
import type { JSX } from 'react';

import { AccordionGroup as AccordionGroupComponent } from 'src/layout/AccordionGroup/AccordionGroup';
import { AccordionGroupDef } from 'src/layout/AccordionGroup/config.def.generated';
import { SummaryAccordionGroupComponent } from 'src/layout/AccordionGroup/SummaryAccordionGroupComponent';
import type { PropsFromGenericComponent } from 'src/layout';
import type { SummaryRendererProps } from 'src/layout/LayoutComponent';

export class AccordionGroup extends AccordionGroupDef {
  render = forwardRef<HTMLElement, PropsFromGenericComponent<'AccordionGroup'>>(
    function LayoutComponentAccordionGroupRender(props, _): JSX.Element | null {
      return <AccordionGroupComponent {...props} />;
    },
  );

  renderSummary(props: SummaryRendererProps<'AccordionGroup'>): JSX.Element | null {
    return <SummaryAccordionGroupComponent {...props} />;
  }

  renderSummaryBoilerplate(): boolean {
    return false;
  }
}
