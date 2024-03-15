import React, { forwardRef } from 'react';
import type { JSX } from 'react';

import dot from 'dot-object';

import { FrontendValidationSource, ValidationMask } from 'src/features/validation';
import { ListDef } from 'src/layout/List/config.def.generated';
import { ListComponent } from 'src/layout/List/ListComponent';
import { SummaryItemSimple } from 'src/layout/Summary/SummaryItemSimple';
import { getFieldNameKey } from 'src/utils/formComponentUtils';
import type { LayoutValidationCtx } from 'src/features/devtools/layoutValidation/types';
import type { DisplayDataProps } from 'src/features/displayData';
import type { ComponentValidation, ValidationDataSources } from 'src/features/validation';
import type { PropsFromGenericComponent } from 'src/layout';
import type { CompInternal } from 'src/layout/layout';
import type { ExprResolver, SummaryRendererProps } from 'src/layout/LayoutComponent';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export class List extends ListDef {
  render = forwardRef<HTMLElement, PropsFromGenericComponent<'List'>>(
    function LayoutComponentListRender(props, _): JSX.Element | null {
      return <ListComponent {...props} />;
    },
  );

  evalExpressions({ item, evalTrb, evalCommon }: ExprResolver<'List'>) {
    return {
      ...item,
      ...evalCommon(item),
      ...evalTrb(item),
    };
  }

  getDisplayData(node: LayoutNode<'List'>, item: CompInternal<'List'>, { formDataSelector }: DisplayDataProps): string {
    const formData = node.getFormData(formDataSelector);
    const dmBindings = item.dataModelBindings;
    for (const [key, binding] of Object.entries(dmBindings || {})) {
      if (binding == item.bindingToShowInSummary) {
        return formData[key] || '';
      }
    }

    return '';
  }

  renderSummary({ targetNode }: SummaryRendererProps<'List'>): JSX.Element | null {
    const displayData = this.useDisplayData(targetNode);
    return <SummaryItemSimple formDataAsString={displayData} />;
  }

  runEmptyFieldValidation(
    node: LayoutNode<'List'>,
    item: CompInternal<'List'>,
    { formData }: ValidationDataSources,
  ): ComponentValidation[] {
    if (!item.required || !item.dataModelBindings) {
      return [];
    }

    const fields = Object.values(item.dataModelBindings);
    const validations: ComponentValidation[] = [];
    const textResourceBindings = item.textResourceBindings;

    let listHasErrors = false;
    for (const field of fields) {
      const data = dot.pick(field, formData);
      const dataAsString =
        typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean' ? String(data) : undefined;

      if (!dataAsString?.length) {
        listHasErrors = true;
      }
    }
    if (listHasErrors) {
      const key = textResourceBindings?.requiredValidation
        ? textResourceBindings?.requiredValidation
        : 'form_filler.error_required';

      const fieldNameReference = {
        key: getFieldNameKey(item.textResourceBindings, undefined),
        makeLowerCase: true,
      };

      validations.push({
        message: {
          key,
          params: [fieldNameReference],
        },
        severity: 'error',
        componentId: node.getId(),
        source: FrontendValidationSource.EmptyField,
        category: ValidationMask.Required,
      });
    }
    return validations;
  }

  validateDataModelBindings(ctx: LayoutValidationCtx<'List'>): string[] {
    const possibleBindings = Object.keys(ctx.item.tableHeaders || {});

    const errors: string[] = [];
    for (const binding of possibleBindings) {
      if (possibleBindings.includes(binding)) {
        const [newErrors] = this.validateDataModelBindingsAny(
          ctx,
          binding,
          ['string', 'number', 'integer', 'boolean'],
          false,
        );
        errors.push(...(newErrors || []));
      } else {
        errors.push(
          `Bindingen ${binding} er ikke gyldig for denne komponenten. Gyldige bindinger er definert i 'tableHeaders'`,
        );
      }
    }

    return errors;
  }
}
