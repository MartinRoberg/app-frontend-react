import type { MutableRefObject } from 'react';

import { getComponentConfigs } from 'src/layout/components.generated';
import type { CompBehaviors } from 'src/codegen/Config';
import type { BaseValidation, ComponentValidation, ValidationDataSources } from 'src/features/validation';
import type { IGenericComponentProps } from 'src/layout/GenericComponent';
import type { CompInternal, CompTypes } from 'src/layout/layout';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { NodeDataSelector } from 'src/utils/layout/NodesContext';
import type { BaseRow } from 'src/utils/layout/types';

type ComponentConfigs = ReturnType<typeof getComponentConfigs>;

export type CompClassMap = {
  [K in keyof ComponentConfigs]: ComponentConfigs[K]['def'];
};

export type CompClassMapCategories = {
  [K in keyof CompClassMap]: CompClassMap[K]['category'];
};

export type CompDef<T extends CompTypes = CompTypes> = ComponentConfigs[T]['def'];

export interface IComponentProps {
  containerDivRef: MutableRefObject<HTMLDivElement | null>;
}

export interface PropsFromGenericComponent<T extends CompTypes = CompTypes> extends IComponentProps {
  node: LayoutNode<T>;
  overrideItemProps?: Partial<Omit<CompInternal<T>, 'id'>>;
  overrideDisplay?: IGenericComponentProps<T>['overrideDisplay'];
}

export function getComponentCapabilities<T extends CompTypes>(type: T): ComponentConfigs[T]['capabilities'] {
  const configs = getComponentConfigs();
  if (type && type in configs) {
    return configs[type].capabilities;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return undefined as any;
}

export function getComponentBehavior<T extends CompTypes, K extends keyof CompBehaviors>(
  type: T,
  behavior: K,
): ComponentConfigs[T]['behaviors'][K] {
  return getComponentConfigs()[type].behaviors[behavior];
}

export interface ValidateEmptyField<Type extends CompTypes> {
  runEmptyFieldValidation: (node: LayoutNode<Type>, validationContext: ValidationDataSources) => ComponentValidation[];
}

export interface ValidateComponent<Type extends CompTypes> {
  runComponentValidation: (node: LayoutNode<Type>, validationContext: ValidationDataSources) => ComponentValidation[];
}

export type ValidationFilterFunction = (
  validation: BaseValidation,
  index: number,
  validations: BaseValidation[],
) => boolean;

export interface ValidationFilter {
  getValidationFilters: (node: LayoutNode, nodeDataSelector: NodeDataSelector) => ValidationFilterFunction[];
}

export type FormDataSelector = (path: string) => unknown;
export type FormDataRowsSelector = (path: string) => BaseRow[];
