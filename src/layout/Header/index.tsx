import React, { forwardRef } from 'react';
import type { JSX } from 'react';

import { Lang } from 'src/features/language/Lang';
import { HeaderDef } from 'src/layout/Header/config.def.generated';
import { HeaderComponent } from 'src/layout/Header/HeaderComponent';
import type { PropsFromGenericComponent } from 'src/layout';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export class Header extends HeaderDef {
  render = forwardRef<HTMLElement, PropsFromGenericComponent<'Header'>>(
    function LayoutComponentHeaderRender(props, _): JSX.Element | null {
      return <HeaderComponent {...props} />;
    },
  );

  renderSummary2(summaryNode: LayoutNode<'Header'>): JSX.Element | null {
    const { textResourceBindings } = summaryNode.item;
    return (
      <h1>
        <Lang id={textResourceBindings?.title} />
      </h1>
    );
  }
}
