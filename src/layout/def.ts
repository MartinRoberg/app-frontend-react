import { CompCategory } from 'src/layout/common';
import { getComponentConfigs } from 'src/layout/components.generated';
import type { CompClassMap, CompDef, ValidateComponent, ValidateEmptyField } from 'src/layout/index';
import type {
  CompTypes,
  IsActionComp,
  IsContainerComp,
  IsFormComp,
  IsPresentationComp,
  TypesFromCategory,
} from 'src/layout/layout';
import type {
  ActionComponent,
  AnyComponent,
  ContainerComponent,
  FormComponent,
  PresentationComponent,
} from 'src/layout/LayoutComponent';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

let configs: ReturnType<typeof getComponentConfigs> | undefined;
function getConfigs() {
  if (!configs) {
    configs = getComponentConfigs();
  }
  return configs;
}

function isDef(input: unknown): input is AnyComponent<CompTypes> {
  const configs = getConfigs();
  if (!input) {
    return false;
  }
  return typeof input === 'object' && 'type' in input && typeof input.type === 'string' && input.type in configs;
}

export const Def = {
  fromType<T extends CompTypes>(type: T): CompClassMap[T] | undefined {
    const configs = getConfigs();
    if (type && type in configs) {
      return configs[type].def as CompClassMap[T];
    }
    return undefined;
  },
  fromAnyNode: {
    asAny(node: LayoutNode): AnyComponent<CompTypes> {
      return node.def as AnyComponent<CompTypes>;
    },
    asForm(node: LayoutNode): FormComponent<TypesFromCategory<CompCategory.Form>> | undefined {
      return node.def.category === CompCategory.Form
        ? (node.def as FormComponent<TypesFromCategory<CompCategory.Form>>)
        : undefined;
    },
    asContainer(node: LayoutNode): ContainerComponent<TypesFromCategory<CompCategory.Container>> | undefined {
      return node.def.category === CompCategory.Container
        ? (node.def as ContainerComponent<TypesFromCategory<CompCategory.Container>>)
        : undefined;
    },
    asAction(node: LayoutNode): ActionComponent<TypesFromCategory<CompCategory.Action>> | undefined {
      return node.def.category === CompCategory.Action
        ? (node.def as ActionComponent<TypesFromCategory<CompCategory.Action>>)
        : undefined;
    },
    asPresentation(node: LayoutNode): PresentationComponent<TypesFromCategory<CompCategory.Presentation>> | undefined {
      return node.def.category === CompCategory.Presentation
        ? (node.def as PresentationComponent<TypesFromCategory<CompCategory.Presentation>>)
        : undefined;
    },
    asFormOrContainer(
      node: LayoutNode,
    ):
      | FormComponent<TypesFromCategory<CompCategory.Form>>
      | ContainerComponent<TypesFromCategory<CompCategory.Container>>
      | undefined {
      if (node.def.category === CompCategory.Container) {
        return node.def as ContainerComponent<TypesFromCategory<CompCategory.Container>>;
      }
      if (node.def.category === CompCategory.Form) {
        return node.def as FormComponent<TypesFromCategory<CompCategory.Form>>;
      }
      return undefined;
    },
  },
  fromSpecificNode: {
    asAny<T extends CompTypes>(node: LayoutNode<T>): CompClassMap[T] & AnyComponent<T> {
      return node.def as CompClassMap[T] & AnyComponent<T>;
    },
    asForm<T extends CompTypes>(
      node: LayoutNode<T>,
    ): IsFormComp<T> extends true ? CompClassMap[T] & FormComponent<T> : undefined {
      return node.def.category === CompCategory.Form ? node.def : undefined;
    },
    asContainer<T extends CompTypes>(
      node: LayoutNode<T>,
    ): IsContainerComp<T> extends true ? CompClassMap[T] & ContainerComponent<T> : undefined {
      return node.def.category === CompCategory.Container ? node.def : undefined;
    },
    asFormOrContainer<T extends CompTypes>(
      node: LayoutNode<T>,
    ): IsContainerComp<T> extends true
      ? CompClassMap[T] & ContainerComponent<T>
      : IsFormComp<T> extends true
        ? CompClassMap[T] & FormComponent<T>
        : undefined {
      if (node.def.category === CompCategory.Container) {
        return node.def;
      }
      if (node.def.category === CompCategory.Form) {
        return node.def;
      }
      return undefined;
    },
    asAction<T extends CompTypes>(
      node: LayoutNode<T>,
    ): IsActionComp<T> extends true ? CompClassMap[T] & ActionComponent<T> : undefined {
      return node.def.category === CompCategory.Action ? node.def : undefined;
    },
    asPresentation<T extends CompTypes>(
      node: LayoutNode<T>,
    ): IsPresentationComp<T> extends true ? CompClassMap[T] & PresentationComponent<T> : undefined {
      return node.def.category === CompCategory.Presentation ? node.def : undefined;
    },
  },

  is: {
    category: {
      form(def: unknown): def is CompClassMap[TypesFromCategory<CompCategory.Form>] {
        return isDef(def) && getConfigs()[def.type].category === CompCategory.Form;
      },
      formOrContainer(
        def: unknown,
      ): def is CompClassMap[TypesFromCategory<CompCategory.Form | CompCategory.Container>] {
        const config = isDef(def) ? getConfigs()[def.type] : undefined;
        return config?.category === CompCategory.Form || config?.category === CompCategory.Container;
      },
      action(def: unknown): def is CompClassMap[TypesFromCategory<CompCategory.Action>] {
        return isDef(def) && getConfigs()[def.type].category === CompCategory.Action;
      },
      container(def: unknown): def is CompClassMap[TypesFromCategory<CompCategory.Container>] {
        return isDef(def) && getConfigs()[def.type].category === CompCategory.Container;
      },
      presentation(def: unknown): def is CompClassMap[TypesFromCategory<CompCategory.Presentation>] {
        return isDef(def) && getConfigs()[def.type].category === CompCategory.Presentation;
      },
    },
  },

  implements: {
    anyValidation<Def extends CompDef<T>, T extends CompTypes = CompTypes>(
      def: Def,
    ): def is Def & (ValidateEmptyField<TypeFromDef<Def>> | ValidateComponent<TypeFromDef<Def>>) {
      return 'runEmptyFieldValidation' in def || 'runComponentValidation' in def;
    },
    validateEmptyField<Def extends CompDef<T>, T extends CompTypes = CompTypes>(
      def: Def,
    ): def is Def & ValidateEmptyField<TypeFromDef<Def>> {
      return 'runEmptyFieldValidation' in def;
    },
    validateComponent<Def extends CompDef<T>, T extends CompTypes = CompTypes>(
      def: Def,
    ): def is Def & ValidateComponent<TypeFromDef<Def>> {
      return 'runComponentValidation' in def;
    },

    displayData(def: unknown): def is CompClassMap[TypesFromCategory<CompCategory.Form | CompCategory.Container>] {
      return Def.is.category.formOrContainer(def);
    },
  },
};

type TypeFromDef<Def extends CompDef<T>, T extends CompTypes = CompTypes> = Def extends CompDef<infer U> ? U : T;
