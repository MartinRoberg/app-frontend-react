import dot from 'dot-object';
import escapeStringRegexp from 'escape-string-regexp';
import type { Mutable } from 'utility-types';

import { ContextNotProvided } from 'src/core/contexts/context';
import { exprCastValue } from 'src/features/expressions';
import { ExprRuntimeError, NodeNotFound, NodeNotFoundWithoutContext } from 'src/features/expressions/errors';
import { ExprVal } from 'src/features/expressions/types';
import { addError } from 'src/features/expressions/validation';
import { SearchParams } from 'src/features/routing/AppRoutingContext';
import { implementsDisplayData } from 'src/layout';
import { buildAuthContext } from 'src/utils/authContext';
import { transposeDataBinding } from 'src/utils/databindings/DataBinding';
import { formatDateLocale } from 'src/utils/formatDateLocale';
import { BaseLayoutNode } from 'src/utils/layout/LayoutNode';
import { LayoutPage } from 'src/utils/layout/LayoutPage';
import type { DisplayData } from 'src/features/displayData';
import type { EvaluateExpressionParams } from 'src/features/expressions';
import type { ExprValToActual } from 'src/features/expressions/types';
import type { ValidationContext } from 'src/features/expressions/validation';
import type { IDataModelReference } from 'src/layout/common.generated';
import type { IAuthContext, IInstanceDataSources } from 'src/types/shared';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

type ArgsToActualOrNull<T extends readonly ExprVal[]> = {
  [Index in keyof T]: ExprValToActual<T[Index]> | null;
};

export interface FuncDef<Args extends readonly ExprVal[], Ret extends ExprVal> {
  impl: (this: EvaluateExpressionParams, ...params: ArgsToActualOrNull<Args>) => ExprValToActual<Ret> | null;
  args: Args;
  minArguments?: number;
  returns: Ret;

  // Optional: Set this to true if the last argument type is considered a '...spread' argument, meaning
  // all the rest of the arguments should be cast to the last type (and that the function allows any
  // amount  of parameters).
  lastArgSpreads?: true;

  // Optional: Validator function which runs when the function is validated. This allows a function to add its own
  // validation requirements. Use the addError() function if any errors are found.
  validator?: (options: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rawArgs: any[];
    argTypes: (ExprVal | undefined)[];
    ctx: ValidationContext;
    path: string[];
  }) => void;

  // Optional: Set this to false if the automatic 'number of arguments validator' should NOT be run for this function.
  // Defaults to true. The minimum number of arguments will be args.length unless minArguments is set, and the
  // maximum number of arguments will be args.length unless lastArgSpreads is set.
  runNumArgsValidator?: boolean;
}

function defineFunc<Args extends readonly ExprVal[], Ret extends ExprVal>(
  def: FuncDef<Args, Ret>,
): FuncDef<Mutable<Args>, Ret> {
  if (def.returns === ExprVal.Date) {
    throw new Error(
      'Date is not a valid return type for an expression function. It is only possible to receive a Date as ' +
        'an argument, and if you need to return a Date, you should return it as a string (formatted in a way ' +
        'that lets the date parser parse it).',
    );
  }

  return def;
}

/**
 * All the functions available to execute inside expressions
 */
export const ExprFunctions = {
  argv: defineFunc({
    impl(idx) {
      if (!this.positionalArguments?.length) {
        throw new ExprRuntimeError(this.expr, this.path, 'No positional arguments available');
      }

      if (idx === null || idx < 0 || idx >= this.positionalArguments.length) {
        throw new ExprRuntimeError(this.expr, this.path, `Index ${idx} out of range`);
      }

      return this.positionalArguments[idx];
    },
    args: [ExprVal.Number] as const,
    returns: ExprVal.Any,
  }),
  value: defineFunc({
    impl(key) {
      const config = this.valueArguments;
      if (!config) {
        throw new ExprRuntimeError(this.expr, this.path, 'No value arguments available');
      }

      const realKey = (key ?? config.defaultKey) as string | null;
      if (!realKey) {
        throw new ExprRuntimeError(
          this.expr,
          this.path,
          `Invalid key (expected string, got ${realKey ? typeof realKey : 'null'})`,
        );
      }

      if (!Object.prototype.hasOwnProperty.call(config.data, realKey)) {
        throw new ExprRuntimeError(
          this.expr,
          this.path,
          `Unknown key ${realKey}, Valid keys are: ${Object.keys(config.data).join(', ')}`,
        );
      }

      const value = config.data[realKey];
      return value ?? null;
    },
    minArguments: 0,
    args: [ExprVal.String] as const,
    returns: ExprVal.Any,
  }),
  equals: defineFunc({
    impl(arg1, arg2) {
      return compare(this, 'equals', arg1, arg2);
    },
    args: [ExprVal.String, ExprVal.String] as const,
    returns: ExprVal.Boolean,
  }),
  notEquals: defineFunc({
    impl(arg1, arg2) {
      return !compare(this, 'equals', arg1, arg2);
    },
    args: [ExprVal.String, ExprVal.String] as const,
    returns: ExprVal.Boolean,
  }),
  not: defineFunc({
    impl: (arg) => !arg,
    args: [ExprVal.Boolean] as const,
    returns: ExprVal.Boolean,
  }),
  greaterThan: defineFunc({
    impl(arg1, arg2) {
      return compare(this, 'greaterThan', arg1, arg2);
    },
    args: [ExprVal.Number, ExprVal.Number] as const,
    returns: ExprVal.Boolean,
  }),
  greaterThanEq: defineFunc({
    impl(arg1, arg2) {
      return compare(this, 'greaterThanEq', arg1, arg2);
    },
    args: [ExprVal.Number, ExprVal.Number] as const,
    returns: ExprVal.Boolean,
  }),
  lessThan: defineFunc({
    impl(arg1, arg2) {
      return compare(this, 'lessThan', arg1, arg2);
    },
    args: [ExprVal.Number, ExprVal.Number] as const,
    returns: ExprVal.Boolean,
  }),
  lessThanEq: defineFunc({
    impl(arg1, arg2) {
      return compare(this, 'lessThanEq', arg1, arg2);
    },
    args: [ExprVal.Number, ExprVal.Number] as const,
    returns: ExprVal.Boolean,
  }),
  concat: defineFunc({
    impl: (...args) => args.join(''),
    args: [ExprVal.String],
    minArguments: 0,
    returns: ExprVal.String,
    lastArgSpreads: true,
  }),
  and: defineFunc({
    impl: (...args) => args.reduce((prev, cur) => prev && !!cur, true),
    args: [ExprVal.Boolean],
    returns: ExprVal.Boolean,
    lastArgSpreads: true,
  }),
  or: defineFunc({
    impl: (...args) => args.reduce((prev, cur) => prev || !!cur, false),
    args: [ExprVal.Boolean],
    returns: ExprVal.Boolean,
    lastArgSpreads: true,
  }),
  if: defineFunc({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl(...args): any {
      const [condition, result] = args;
      if (condition === true) {
        return result;
      }

      return args.length === 4 ? args[3] : null;
    },
    validator: ({ rawArgs, ctx, path }) => {
      if (rawArgs.length === 2) {
        return;
      }
      if (rawArgs.length > 2 && rawArgs[2] !== 'else') {
        addError(ctx, [...path, '[2]'], 'Expected third argument to be "else"');
      }
      if (rawArgs.length === 4) {
        return;
      }
      addError(ctx, path, 'Expected either 2 arguments (if) or 4 (if + else), got %s', `${rawArgs.length}`);
    },
    runNumArgsValidator: false,
    args: [ExprVal.Boolean, ExprVal.Any, ExprVal.String, ExprVal.Any],
    returns: ExprVal.Any,
  }),
  instanceContext: defineFunc({
    impl(key): string | null {
      const instanceDataSourcesKeys: { [key in keyof IInstanceDataSources]: true } = {
        instanceId: true,
        appId: true,
        instanceOwnerPartyId: true,
        instanceOwnerPartyType: true,
      };

      if (key === null || instanceDataSourcesKeys[key] !== true) {
        throw new ExprRuntimeError(this.expr, this.path, `Unknown Instance context property ${key}`);
      }

      return (this.dataSources.instanceDataSources && this.dataSources.instanceDataSources[key]) || null;
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.String,
  }),
  frontendSettings: defineFunc({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl(key): any {
      if (key === null) {
        throw new ExprRuntimeError(this.expr, this.path, `Value cannot be null. (Parameter 'key')`);
      }

      return (this.dataSources.applicationSettings && this.dataSources.applicationSettings[key]) || null;
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.Any,
  }),
  authContext: defineFunc({
    impl(key): boolean | null {
      const authContextKeys: { [key in keyof IAuthContext]: true } = {
        read: true,
        write: true,
        instantiate: true,
        confirm: true,
        sign: true,
        reject: true,
      };

      if (key === null || authContextKeys[key] !== true) {
        throw new ExprRuntimeError(this.expr, this.path, `Unknown auth context property ${key}`);
      }

      const authContext = buildAuthContext(this.dataSources.process?.currentTask);
      return Boolean(authContext?.[key]);
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.Boolean,
  }),
  component: defineFunc({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl(id): any {
      if (id === null) {
        throw new ExprRuntimeError(this.expr, this.path, `Cannot lookup component null`);
      }

      const node = ensureNode(this.node);
      const closest = this.dataSources.nodeTraversal((t) => t.with(node).closestId(id), [node, id]);

      const dataModelBindings = closest
        ? this.dataSources.nodeDataSelector((picker) => picker(closest)?.layout.dataModelBindings, [closest])
        : undefined;

      const simpleBinding =
        dataModelBindings && 'simpleBinding' in dataModelBindings ? dataModelBindings.simpleBinding : undefined;
      if (closest && simpleBinding) {
        if (this.dataSources.isHiddenSelector(closest)) {
          return null;
        }

        return pickSimpleValue(simpleBinding, this);
      }

      // Expressions can technically be used without having all the layouts available, which might lead to unexpected
      // results. We should note this in the error message, so we know the reason we couldn't find the component.
      const hasAllLayouts = node instanceof LayoutPage ? !!node.layoutSet : !!node.page.layoutSet;
      throw new ExprRuntimeError(
        this.expr,
        this.path,
        hasAllLayouts
          ? `Unable to find component with identifier ${id} or it does not have a simpleBinding`
          : `Unable to find component with identifier ${id} in the current layout or it does not have a simpleBinding`,
      );
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.Any,
  }),
  dataModel: defineFunc({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl(propertyPath, maybeDataType): any {
      if (propertyPath === null) {
        throw new ExprRuntimeError(this.expr, this.path, `Cannot lookup dataModel null`);
      }

      const dataType = maybeDataType ?? this.dataSources.currentLayoutSet?.dataType;
      if (!dataType) {
        throw new ExprRuntimeError(this.expr, this.path, `Cannot lookup dataType undefined`);
      }

      const reference: IDataModelReference = { dataType, field: propertyPath };
      if (this.dataSources.currentDataModelPath && this.dataSources.currentDataModelPath.dataType === dataType) {
        const newReference = transposeDataBinding({
          subject: reference,
          currentLocation: this.dataSources.currentDataModelPath,
        });
        return pickSimpleValue(newReference, this);
      }

      const node = ensureNode(this.node);
      if (node instanceof BaseLayoutNode) {
        const newReference = this.dataSources.transposeSelector(node as LayoutNode, reference);
        return pickSimpleValue(newReference, this);
      }

      // No need to transpose the data model according to the location inside a repeating group when the context is
      // a LayoutPage (i.e., when we're resolving an expression directly on the layout definition).
      return pickSimpleValue(reference, this);
    },
    args: [ExprVal.String, ExprVal.String] as const,
    minArguments: 1,
    returns: ExprVal.Any,
    validator({ rawArgs, ctx, path }) {
      if (rawArgs.length > 1 && rawArgs[1] !== null && typeof rawArgs[1] !== 'string') {
        addError(ctx, [...path, '[2]'], 'The data type must be a string (expressions cannot be used here)');
      }
    },
  }),
  countDataElements: defineFunc({
    impl(dataType): number {
      if (dataType === null) {
        throw new ExprRuntimeError(this.expr, this.path, `Cannot count the number of data elements for null`);
      }

      const length = this.dataSources.dataElementSelector(
        (elements) => elements.filter((e) => e.dataType === dataType).length,
        [dataType],
      );

      if (length === ContextNotProvided) {
        return 0; // Stateless never has any data elements
      }

      return length;
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.Number,
  }),
  hasRole: defineFunc({
    impl(roleName): boolean | null {
      if (!this.dataSources.roles || !roleName) {
        return false;
      }
      return this.dataSources.roles.data?.map((role) => role.value).includes(roleName) ?? null;
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.Boolean,
  }),
  externalApi: defineFunc({
    impl(externalApiId, path): string | null {
      if (externalApiId === null) {
        throw new ExprRuntimeError(this.expr, this.path, `Expected an external API id`);
      }
      if (!path) {
        return null;
      }

      const externalApiData: unknown = this.dataSources.externalApis.data[externalApiId];

      const res =
        path && externalApiData && typeof externalApiData === 'object'
          ? dot.pick(path, externalApiData)
          : externalApiData;

      if (!res || typeof res === 'object') {
        return null; // Print error?
      }

      return String(res);
    },
    args: [ExprVal.String, ExprVal.String] as const,
    returns: ExprVal.String,
  }),
  displayValue: defineFunc({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    impl(id): any {
      if (id === null) {
        throw new ExprRuntimeError(this.expr, this.path, `Cannot lookup component null`);
      }

      const node = ensureNode(this.node);
      const targetNode = this.dataSources.nodeTraversal((t) => t.with(node).closestId(id), [node, id]);

      if (!targetNode) {
        throw new ExprRuntimeError(this.expr, this.path, `Unable to find component with identifier ${id}`);
      }

      const def = targetNode.def;
      if (!implementsDisplayData(def)) {
        throw new ExprRuntimeError(
          this.expr,
          this.path,
          `Component with identifier ${id} does not have a displayValue`,
        );
      }

      if (this.dataSources.isHiddenSelector(targetNode)) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (def as DisplayData<any>).getDisplayData(targetNode, {
        attachmentsSelector: this.dataSources.attachmentsSelector,
        optionsSelector: this.dataSources.optionsSelector,
        langTools: this.dataSources.langToolsSelector(node as LayoutNode),
        currentLanguage: this.dataSources.currentLanguage,
        formDataSelector: this.dataSources.formDataSelector,
        nodeFormDataSelector: this.dataSources.nodeFormDataSelector,
        nodeDataSelector: this.dataSources.nodeDataSelector,
      });
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.String,
  }),
  formatDate: defineFunc({
    impl(date, format) {
      return date ? formatDateLocale(this.dataSources.currentLanguage, date, format ?? undefined) : null;
    },
    minArguments: 1,
    args: [ExprVal.Date, ExprVal.String] as const,
    returns: ExprVal.String,
  }),
  compare: defineFunc({
    impl(arg1, arg2, arg3, arg4) {
      return arg2 === 'not'
        ? !compare(this, arg3 as CompareOperator, arg1, arg4, 0, 3)
        : compare(this, arg2 as CompareOperator, arg1, arg3, 0, 2);
    },
    minArguments: 3,
    args: [ExprVal.Any, ExprVal.Any, ExprVal.Any, ExprVal.Any] as const,
    returns: ExprVal.Boolean,
    validator({ rawArgs, ctx, path }) {
      if (rawArgs.length === 4 && rawArgs[1] !== 'not') {
        addError(ctx, [...path, '[1]'], 'Second argument must be "not" when providing 4 arguments in total');
        return;
      }

      const opIdx = rawArgs.length === 4 ? 2 : 1;
      const op = rawArgs[opIdx];
      if (!(typeof op === 'string')) {
        addError(ctx, [...path, `[${opIdx + 1}]`], 'Invalid operator (it cannot be an expression or null)');
        return;
      }
      const validOperators = Object.keys(CompareOperators);
      if (!validOperators.includes(op)) {
        const validList = validOperators.map((o) => `"${o}"`).join(', ');
        addError(ctx, [...path, `[${opIdx + 1}]`], 'Invalid operator "%s", valid operators are %s', op, validList);
      }
    },
  }),
  round: defineFunc({
    impl(number, decimalPoints) {
      const realNumber = number === null ? 0 : number;
      const realDecimalPoints = decimalPoints === null ? 0 : decimalPoints;
      return parseFloat(`${realNumber}`).toFixed(realDecimalPoints);
    },
    args: [ExprVal.Number, ExprVal.Number] as const,
    minArguments: 1,
    returns: ExprVal.String,
  }),
  text: defineFunc({
    impl(key) {
      if (key === null) {
        return null;
      }

      const node = this.node instanceof BaseLayoutNode ? this.node : undefined;
      return this.dataSources.langToolsSelector(node).langAsNonProcessedString(key);
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.String,
  }),
  linkToComponent: defineFunc({
    impl(linkText, id) {
      if (id == null) {
        window.logWarn('Component id was empty but must be set for linkToComponent to work');
        return null;
      }
      if (linkText == null) {
        window.logWarn('Link text was empty but must be set for linkToComponent to work');
        return null;
      }

      const node = ensureNode(this.node);
      const closest = this.dataSources.nodeTraversal((t) => t.with(node).closestId(id), [node, id]);

      if (!closest) {
        throw new ExprRuntimeError(this.expr, this.path, `Unable to find component with identifier ${id}`);
      }

      const taskId = this.dataSources.process?.currentTask?.elementId;
      const instanceId = this.dataSources.instanceDataSources?.instanceId;

      let url = '';
      if (taskId && instanceId) {
        url = `/instance/${instanceId}/${taskId}/${closest.pageKey}`;
      } else {
        url = `/${closest.pageKey}`;
      }

      const searchParams = new URLSearchParams();
      searchParams.set(SearchParams.FocusComponentId, closest.id);
      const newUrl = `${url}?${searchParams.toString()}`;
      return `<a href="${newUrl}" data-link-type="LinkToPotentialNode">${linkText}</a>`;
    },
    args: [ExprVal.String, ExprVal.String] as const,
    minArguments: 2,
    returns: ExprVal.String,
  }),
  linkToPage: defineFunc({
    impl(linkText, pageId) {
      if (pageId == null) {
        window.logWarn('Page id was empty but must be set for linkToPage to work');
        return null;
      }
      if (linkText == null) {
        window.logWarn('Link text was empty but must be set for linkToPage to work');
        return null;
      }
      const taskId = this.dataSources.process?.currentTask?.elementId;
      const instanceId = this.dataSources.instanceDataSources?.instanceId;

      let url = '';
      if (taskId && instanceId) {
        url = `/instance/${instanceId}/${taskId}/${pageId}`;
      } else {
        url = `/${pageId}`;
      }
      return `<a href="${url}" data-link-type="LinkToPotentialPage">${linkText}</a>`;
    },
    args: [ExprVal.String, ExprVal.String] as const,
    minArguments: 2,
    returns: ExprVal.String,
  }),
  language: defineFunc({
    impl() {
      return this.dataSources.currentLanguage;
    },
    args: [] as const,
    returns: ExprVal.String,
  }),
  contains: defineFunc({
    impl(string, stringToContain): boolean {
      if (string === null || stringToContain === null) {
        return false;
      }

      return string.includes(stringToContain);
    },
    args: [ExprVal.String, ExprVal.String] as const,
    returns: ExprVal.Boolean,
  }),
  notContains: defineFunc({
    impl(string: string, stringToNotContain: string): boolean {
      if (string === null || stringToNotContain === null) {
        return true;
      }
      return !string.includes(stringToNotContain);
    },
    args: [ExprVal.String, ExprVal.String] as const,
    returns: ExprVal.Boolean,
  }),
  endsWith: defineFunc({
    impl(string: string, stringToMatch: string): boolean {
      if (string === null || stringToMatch === null) {
        return false;
      }
      return string.endsWith(stringToMatch);
    },
    args: [ExprVal.String, ExprVal.String] as const,
    returns: ExprVal.Boolean,
  }),
  startsWith: defineFunc({
    impl(string: string, stringToMatch: string): boolean {
      if (string === null || stringToMatch === null) {
        return false;
      }
      return string.startsWith(stringToMatch);
    },
    args: [ExprVal.String, ExprVal.String] as const,
    returns: ExprVal.Boolean,
  }),
  stringReplace: defineFunc({
    impl(string, search, replace) {
      if (!string || !search || replace === null) {
        return null;
      }
      return string.replace(new RegExp(escapeStringRegexp(search), 'g'), replace);
    },
    args: [ExprVal.String, ExprVal.String, ExprVal.String] as const,
    returns: ExprVal.String,
  }),
  stringLength: defineFunc({
    impl: (string) => (string === null ? 0 : string.length),
    args: [ExprVal.String] as const,
    returns: ExprVal.Number,
  }),
  stringSlice: defineFunc({
    impl(string, start, length) {
      if (!string || start === null || length === null) {
        return null;
      }

      return string.substring(start, start + length);
    },
    args: [ExprVal.String, ExprVal.Number, ExprVal.Number] as const,
    returns: ExprVal.String,
  }),
  stringIndexOf: defineFunc({
    impl(string, search) {
      if (!string || !search) {
        return null;
      }

      return string.indexOf(search);
    },
    args: [ExprVal.String, ExprVal.String] as const,
    returns: ExprVal.Number,
  }),
  commaContains: defineFunc({
    impl(commaSeparatedString, stringToMatch) {
      if (commaSeparatedString === null || stringToMatch === null) {
        return false;
      }

      // Split the comma separated string into an array and remove whitespace from each part
      const parsedToArray = commaSeparatedString.split(',').map((part) => part.trim());
      return parsedToArray.includes(stringToMatch);
    },
    args: [ExprVal.String, ExprVal.String] as const,
    returns: ExprVal.Boolean,
  }),
  lowerCase: defineFunc({
    impl(string) {
      if (string === null) {
        return null;
      }
      return string.toLowerCase();
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.String,
  }),
  upperCase: defineFunc({
    impl(string) {
      if (string === null) {
        return null;
      }
      return string.toUpperCase();
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.String,
  }),
  upperCaseFirst: defineFunc({
    impl(string) {
      if (string === null) {
        return null;
      }
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.String,
  }),
  lowerCaseFirst: defineFunc({
    impl(string) {
      if (string === null) {
        return null;
      }
      return string.charAt(0).toLowerCase() + string.slice(1);
    },
    args: [ExprVal.String] as const,
    returns: ExprVal.String,
  }),
  _experimentalSelectAndMap: defineFunc({
    args: [ExprVal.String, ExprVal.String, ExprVal.String, ExprVal.String, ExprVal.Boolean] as const,
    impl(path, propertyToSelect, prepend, append, appendToLastElement = true) {
      if (path === null || propertyToSelect == null) {
        throw new ExprRuntimeError(this.expr, this.path, `Cannot lookup dataModel null`);
      }

      const dataType = this.dataSources.currentLayoutSet?.dataType;
      if (!dataType) {
        throw new ExprRuntimeError(this.expr, this.path, `Cannot lookup dataType undefined`);
      }
      const array = this.dataSources.formDataSelector({ field: path, dataType });
      if (typeof array != 'object' || !Array.isArray(array)) {
        return '';
      }
      return array
        .map((x, i) => {
          const hideLastElement = i == array.length - 1 && !appendToLastElement;

          const valueToPrepend = prepend == null ? '' : prepend;
          const valueToAppend = append == null || hideLastElement ? '' : append;

          return `${valueToPrepend}${x[propertyToSelect]}${valueToAppend}`;
        })
        .join(' ');
    },
    minArguments: 2,
    returns: ExprVal.String,
  }),
};

function pickSimpleValue(path: IDataModelReference, params: EvaluateExpressionParams) {
  const isValidDataType = params.dataSources.dataModelNames.includes(path.dataType);
  if (!isValidDataType) {
    throw new ExprRuntimeError(params.expr, params.path, `Data model with type ${path.dataType} not found`);
  }

  const value = params.dataSources.formDataSelector(path);
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return null;
}

export function ensureNode(
  node: LayoutNode | LayoutPage | BaseLayoutNode | NodeNotFoundWithoutContext,
): LayoutNode | BaseLayoutNode | LayoutPage {
  if (node instanceof NodeNotFoundWithoutContext) {
    throw new NodeNotFound(node.getId());
  }
  return node;
}

/**
 * Allows you to cast an argument to a stricter type late during execution of an expression function, as opposed to
 * before the function runs (as arguments are processed on the way in). This is useful in functions such as
 * 'compare', where the operator will determine the type of the arguments, and cast them accordingly.
 */
function lateCastArg<T extends ExprVal>(
  context: EvaluateExpressionParams,
  arg: unknown,
  argIndex: number,
  type: T,
): ExprValToActual<T> | null {
  const actualIndex = argIndex + 1; // Adding 1 because the function name is at index 0
  const newContext = { ...context, path: [...context.path, `[${actualIndex}]`] };
  return exprCastValue(arg, type, newContext);
}

type CompareOpArg<T extends ExprVal, BothReq extends boolean> = BothReq extends true
  ? ExprValToActual<T>
  : ExprValToActual<T> | null;
type CompareOpImplementation<T extends ExprVal, BothReq extends boolean> = (
  this: EvaluateExpressionParams,
  a: CompareOpArg<T, BothReq>,
  b: CompareOpArg<T, BothReq>,
) => boolean;

export interface CompareOperatorDef<T extends ExprVal, BothReq extends boolean> {
  bothArgsMustBeValid: BothReq;
  argType: T;
  impl: CompareOpImplementation<T, BothReq>;
}

function defineCompareOp<T extends ExprVal, BothReq extends boolean>(
  def: CompareOperatorDef<T, BothReq>,
): CompareOperatorDef<T, BothReq> {
  return def;
}

/**
 * All the comparison operators available to execute inside the 'compare' function. This list of operators
 * have the following behaviors:
 */
export const CompareOperators = {
  equals: defineCompareOp({
    bothArgsMustBeValid: false,
    argType: ExprVal.String,
    impl: (a, b) => a === b,
  }),
  greaterThan: defineCompareOp({
    bothArgsMustBeValid: true,
    argType: ExprVal.Number,
    impl: (a, b) => a > b,
  }),
  greaterThanEq: defineCompareOp({
    bothArgsMustBeValid: true,
    argType: ExprVal.Number,
    impl: (a: number, b: number) => a >= b,
  }),
  lessThan: defineCompareOp({
    bothArgsMustBeValid: true,
    argType: ExprVal.Number,
    impl: (a: number, b: number) => a < b,
  }),
  lessThanEq: defineCompareOp({
    bothArgsMustBeValid: true,
    argType: ExprVal.Number,
    impl: (a: number, b: number) => a <= b,
  }),
  isBefore: defineCompareOp({
    bothArgsMustBeValid: true,
    argType: ExprVal.Date,
    impl: (a, b) => a < b,
  }),
  isBeforeEq: defineCompareOp({
    bothArgsMustBeValid: true,
    argType: ExprVal.Date,
    impl: (a, b) => a <= b,
  }),
  isAfter: defineCompareOp({
    bothArgsMustBeValid: true,
    argType: ExprVal.Date,
    impl: (a, b) => a > b,
  }),
  isAfterEq: defineCompareOp({
    bothArgsMustBeValid: true,
    argType: ExprVal.Date,
    impl: (a, b) => a >= b,
  }),
  isSameDay: defineCompareOp({
    bothArgsMustBeValid: true,
    argType: ExprVal.Date,
    impl: (a, b) => a.toDateString() === b.toDateString(),
  }),
} as const;

type CompareOperator = keyof typeof CompareOperators;

function compare(
  ctx: EvaluateExpressionParams,
  operator: CompareOperator,
  arg1: unknown,
  arg2: unknown,
  idxArg1 = 1,
  idxArg2 = 2,
): boolean {
  const def = CompareOperators[operator];
  const a = lateCastArg(ctx, arg1, idxArg1, def.argType);
  const b = lateCastArg(ctx, arg2, idxArg2, def.argType);

  if (def.bothArgsMustBeValid && (a === null || b === null)) {
    return false;
  }

  return def.impl.call(ctx, a, b);
}
