import React from 'react';

import deepEqual from 'fast-deep-equal';

import { useNodeValidation } from 'src/features/validation/nodeValidation/useNodeValidation';
import { getInitialMaskFromNodeItem } from 'src/features/validation/utils';
import { NodesStateQueue } from 'src/utils/layout/generator/CommitQueue';
import { GeneratorInternal } from 'src/utils/layout/generator/GeneratorContext';
import { GeneratorCondition, StageFormValidation } from 'src/utils/layout/generator/GeneratorStages';
import { useNodeDataSources } from 'src/utils/layout/generator/NodeDataSourcesProvider';
import type { AnyValidation, AttachmentValidation } from 'src/features/validation/index';
import type { CompCategory } from 'src/layout/common';
import type { TypesFromCategory } from 'src/layout/layout';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { NodeDataSelector } from 'src/utils/layout/NodesContext';

export function StoreValidationsInNode() {
  return (
    <GeneratorCondition
      stage={StageFormValidation}
      mustBeAdded='parent'
    >
      <StoreValidationsInNodeWorker />
    </GeneratorCondition>
  );
}

type Node = LayoutNode<TypesFromCategory<CompCategory.Form | CompCategory.Container>>;

function StoreValidationsInNodeWorker() {
  const item = GeneratorInternal.useIntermediateItem()!;
  const node = GeneratorInternal.useParent() as Node;
  const { nodeDataSelector } = useNodeDataSources();
  const shouldValidate = !('renderAsSummary' in item && item.renderAsSummary);

  const { validations: freshValidations, processedLast } = useNodeValidation(node, shouldValidate);
  const validations = useUpdatedValidations(freshValidations, node, nodeDataSelector);

  const shouldSetValidations = nodeDataSelector(
    (picker) => {
      const data = picker(node)!;
      return data.validations !== validations && !deepEqual(data.validations, validations);
    },
    [node],
  );
  NodesStateQueue.useSetNodeProp(
    { node, prop: 'validations', value: validations },
    shouldSetValidations && shouldValidate,
  );

  // Reduce visibility as validations are fixed
  const initialVisibility = getInitialMaskFromNodeItem(item);
  const visibilityToSet = nodeDataSelector(
    (picker) => {
      const data = picker(node)!;
      const currentValidationMask = validations.reduce((mask, { category }) => mask | category, 0);
      const newVisibilityMask = currentValidationMask & data.validationVisibility;
      if ((newVisibilityMask | initialVisibility) !== data.validationVisibility) {
        return newVisibilityMask | initialVisibility;
      }
      return undefined;
    },
    [node],
  );

  NodesStateQueue.useSetNodeProp(
    { node, prop: 'validationVisibility', value: visibilityToSet },
    visibilityToSet !== undefined,
  );

  const shouldSetProcessedLast = nodeDataSelector(
    (picker) => picker(node)!.validationsProcessedLast !== processedLast,
    [node],
  );
  NodesStateQueue.useSetNodeProp(
    { node, prop: 'validationsProcessedLast', value: processedLast, force: true },
    shouldSetProcessedLast,
  );

  return null;
}

function useUpdatedValidations(validations: AnyValidation[], node: Node, nodeDataSelector: NodeDataSelector) {
  return nodeDataSelector(
    (picker) => {
      const data = picker(node);
      if (!data?.validations) {
        return validations;
      }

      const copy = [...validations];
      for (const [idx, validation] of copy.entries()) {
        if (!('attachmentId' in validation)) {
          continue;
        }
        // Preserve the visibility of existing attachment validations
        const existing = data.validations.find(
          (v) => 'attachmentId' in v && v.attachmentId === validation.attachmentId,
        ) as AttachmentValidation;
        if (existing) {
          copy[idx] = { ...validation, visibility: existing.visibility };
        }
      }

      return copy;
    },
    [node],
  );
}
