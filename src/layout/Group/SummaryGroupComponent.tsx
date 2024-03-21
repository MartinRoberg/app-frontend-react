import React from 'react';

import cn from 'classnames';

import { ErrorPaper } from 'src/components/message/ErrorPaper';
import { FD } from 'src/features/formData/FormDataWrite';
import { Lang } from 'src/features/language/Lang';
import { useLanguage } from 'src/features/language/useLanguage';
import { useDeepValidationsForNode } from 'src/features/validation/selectors/deepValidationsForNode';
import { hasValidationErrors } from 'src/features/validation/utils';
import { CompCategory } from 'src/layout/common';
import { GroupComponent } from 'src/layout/Group/GroupComponent';
import classes from 'src/layout/Group/SummaryGroupComponent.module.css';
import { EditButton } from 'src/layout/Summary/EditButton';
import { SummaryComponent } from 'src/layout/Summary/SummaryComponent';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import type { ITextResourceBindings } from 'src/layout/layout';
import type { ISummaryComponent } from 'src/layout/Summary/SummaryComponent';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export interface ISummaryGroupComponent {
  changeText: string | null;
  onChangeClick: () => void;
  summaryNode: LayoutNode<'Summary'>;
  targetNode: LayoutNode<'Group'>;
  overrides?: ISummaryComponent['overrides'];
}

export function SummaryGroupComponent({
  onChangeClick,
  changeText,
  summaryNode,
  targetNode,
  overrides,
}: ISummaryGroupComponent) {
  const summaryItem = useNodeItem(summaryNode);
  const targetItem = useNodeItem(targetNode);
  const excludedChildren = summaryItem.excludedChildren;
  const display = overrides?.display || summaryItem.display;
  const { langAsString } = useLanguage();
  const formDataSelector = FD.useDebouncedSelector();

  const inExcludedChildren = (n: LayoutNode) =>
    excludedChildren && (excludedChildren.includes(n.getId()) || excludedChildren.includes(n.getBaseId()));

  const groupValidations = useDeepValidationsForNode(targetNode);
  const groupHasErrors = hasValidationErrors(groupValidations);

  const textBindings = targetItem.textResourceBindings as ITextResourceBindings;
  const summaryAccessibleTitleTrb =
    textBindings && 'summaryAccessibleTitle' in textBindings ? textBindings.summaryAccessibleTitle : undefined;
  const summaryTitleTrb = textBindings && 'summaryTitle' in textBindings ? textBindings.summaryTitle : undefined;
  const titleTrb = textBindings && 'title' in textBindings ? textBindings.title : undefined;
  const ariaLabel = langAsString(summaryAccessibleTitleTrb ?? summaryTitleTrb ?? titleTrb);

  if (summaryItem.largeGroup && overrides?.largeGroup !== false) {
    return (
      <>
        {
          <GroupComponent
            key={`summary-${targetNode.getId()}`}
            id={`summary-${targetNode.getId()}`}
            groupNode={targetNode}
            isSummary={true}
            renderLayoutNode={(n) => {
              if (inExcludedChildren(n) || n.isHidden()) {
                return null;
              }

              return (
                <SummaryComponent
                  key={n.getId()}
                  summaryNode={summaryNode}
                  overrides={{
                    ...overrides,
                    targetNode: n,
                    grid: {},
                    largeGroup: true,
                  }}
                />
              );
            }}
          />
        }
      </>
    );
  }

  const childSummaryComponents = targetNode
    .children(undefined, undefined)
    .filter((n) => !inExcludedChildren(n))
    .map((child) => {
      if (child.isHidden() || !child.isCategory(CompCategory.Form)) {
        return;
      }
      const RenderCompactSummary = child.def.renderCompactSummary.bind(child.def);
      return (
        <RenderCompactSummary
          onChangeClick={onChangeClick}
          changeText={changeText}
          key={child.getId()}
          targetNode={child}
          summaryNode={summaryNode}
          overrides={{}}
          formDataSelector={formDataSelector}
        />
      );
    });

  return (
    <>
      <div
        data-testid={'summary-group-component'}
        style={{ width: '100%' }}
      >
        <div className={classes.container}>
          <span
            className={cn(classes.label, groupHasErrors && !display?.hideValidationMessages && classes.labelWithError)}
          >
            <Lang id={summaryTitleTrb ?? titleTrb} />
          </span>

          {!display?.hideChangeButton && (
            <EditButton
              onClick={onChangeClick}
              editText={changeText}
              label={ariaLabel}
            />
          )}
        </div>
        <div style={{ width: '100%' }}>
          <div className={classes.border}>{childSummaryComponents}</div>
        </div>
      </div>

      {groupHasErrors && !display?.hideValidationMessages && (
        <div className={classes.gridStyle}>
          <ErrorPaper message={langAsString('group.row_error')} />
          <div>
            {!display?.hideChangeButton && (
              <button
                className={classes.link}
                onClick={onChangeClick}
                type='button'
              >
                <Lang id={'form_filler.summary_go_to_correct_page'} />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
