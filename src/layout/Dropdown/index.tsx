import React, { forwardRef } from 'react';
import type { JSX } from 'react';

import { getSelectedValueToText } from 'src/features/options/getSelectedValueToText';
import { runEmptyFieldValidationOnlySimpleBinding } from 'src/features/validation/nodeValidation/emptyFieldValidation';
import { runSchemaValidationOnlySimpleBinding } from 'src/features/validation/schemaValidation/jsonSchemaValidation';
import { DropdownDef } from 'src/layout/Dropdown/config.def.generated';
import { DropdownComponent } from 'src/layout/Dropdown/DropdownComponent';
import { DropdownSummary } from 'src/layout/Dropdown/DropdownSummary';
import { SummaryItemSimple } from 'src/layout/Summary/SummaryItemSimple';
import type { LayoutValidationCtx } from 'src/features/devtools/layoutValidation/types';
import type { DisplayDataProps } from 'src/features/displayData';
import type {
  ComponentValidation,
  EmptyFieldValidationDataSources,
  SchemaValidationDataSources,
} from 'src/features/validation';
import type { PropsFromGenericComponent } from 'src/layout';
import type { SummaryRendererProps } from 'src/layout/LayoutComponent';
import type { Summary2Props } from 'src/layout/Summary2/SummaryComponent2/types';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export class Dropdown extends DropdownDef {
  render = forwardRef<HTMLElement, PropsFromGenericComponent<'Dropdown'>>(
    function LayoutComponentDropdownRender(props, _): JSX.Element | null {
      return <DropdownComponent {...props} />;
    },
  );

  getDisplayData(
    node: LayoutNode<'Dropdown'>,
    { langTools, optionsSelector, nodeFormDataSelector }: DisplayDataProps,
  ): string {
    const value = String(nodeFormDataSelector(node).simpleBinding ?? '');
    if (!value) {
      return '';
    }

    const { options } = optionsSelector(node);
    return getSelectedValueToText(value, langTools, options) || '';
  }

  renderSummary({ targetNode }: SummaryRendererProps<'Dropdown'>): JSX.Element | null {
    const displayData = this.useDisplayData(targetNode);
    return <SummaryItemSimple formDataAsString={displayData} />;
  }

  renderSummary2(props: Summary2Props<'Dropdown'>): JSX.Element | null {
    return (
      <DropdownSummary
        componentNode={props.target}
        isCompact={props.isCompact}
        emptyFieldText={props.override?.emptyFieldText}
      />
    );
  }

  runEmptyFieldValidation(
    node: LayoutNode<'Dropdown'>,
    validationDataSources: EmptyFieldValidationDataSources,
  ): ComponentValidation[] {
    return runEmptyFieldValidationOnlySimpleBinding(node, validationDataSources);
  }

  runSchemaValidation(
    node: LayoutNode<'Dropdown'>,
    validationDataSources: SchemaValidationDataSources,
  ): ComponentValidation[] {
    return runSchemaValidationOnlySimpleBinding(node, validationDataSources);
  }

  validateDataModelBindings(ctx: LayoutValidationCtx<'Dropdown'>): string[] {
    return this.validateDataModelBindingsSimple(ctx);
  }
}
