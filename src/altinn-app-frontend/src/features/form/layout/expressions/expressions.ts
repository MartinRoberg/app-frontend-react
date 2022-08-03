import { parseDsl } from 'src/features/form/layout/expressions/dsl';
import { layoutExpressionFunctions } from 'src/features/form/layout/expressions/functions';
import type {
  ILayoutExpressionArg,
  ILayoutExpressionRunnerLookups,
  ILayoutExpressionStructured,
} from 'src/features/form/layout/expressions/types';

/**
 * Run/evaluate a layout expression. You have to provide your own functions for looking up external values. If you
 * need a more concrete implementation:
 * @see useLayoutExpression
 */
export function evalExpr(
  expr: ILayoutExpressionStructured,
  lookups: ILayoutExpressionRunnerLookups,
): boolean {
  const computedArgs = expr.args.map((arg) => {
    if (typeof arg === 'object') {
      const [key] = Object.keys(arg);
      return lookups[key](arg[key]);
    }
    return arg;
  });

  return layoutExpressionFunctions[expr.function].apply(null, computedArgs);
}

function validateArgument(obj: any): obj is ILayoutExpressionArg {
  const type = typeof obj;
  const validBasicTypes: typeof type[] = [
    'boolean',
    'string',
    'undefined',
    'bigint',
    'number',
  ];
  if (validBasicTypes.includes(type)) {
    return true;
  }
  // TODO: Possibly debug and report what's wrong when validating
  if (type === 'object' && Object.keys(obj).length === 1) {
    if ('dataModel' in obj) {
      return typeof obj.dataModel === 'string';
    }
    if ('component' in obj) {
      return typeof obj.component === 'string';
    }
    if ('instanceContext' in obj) {
      return typeof obj.instanceContext === 'string';
    }
    if ('applicationSettings' in obj) {
      return typeof obj.applicationSettings === 'string';
    }
  }

  return false;
}

function asValidDsl(
  obj: any,
  debug: boolean,
): ILayoutExpressionStructured | undefined {
  if ('mapping' in obj && Object.keys(obj).length !== 2) {
    return;
  }
  if (!('mapping' in obj) && Object.keys(obj).length !== 1) {
    return;
  }

  return parseDsl(obj.expr, debug);
}

function asValidStructured(obj: any): ILayoutExpressionStructured | undefined {
  // TODO: Possibly debug and report what's wrong when validating
  if ('mapping' in obj && Object.keys(obj).length !== 3) {
    return;
  }
  if (!('mapping' in obj) && Object.keys(obj).length !== 2) {
    return;
  }
  if (typeof obj.function !== 'string') {
    return;
  }
  if (!layoutExpressionFunctions[obj.function]) {
    return;
  }
  if (!Array.isArray(obj.args)) {
    return;
  }

  const expectedArguments = obj.function === 'lookup' ? 1 : 2;
  if (obj.args.length !== expectedArguments) {
    return;
  }

  const allArgumentsValid = (obj.args as Array<any>)
    .map(validateArgument)
    .reduce((prev, current) => prev && current, true);

  if (!allArgumentsValid) {
    return;
  }

  return obj as ILayoutExpressionStructured;
}

/**
 * Takes the input object, validates it to make sure it is a valid layout expression, returns either a fully
 * parsed structured expression (ready to pass to evalExpr()), or undefined (if not a valid expression).
 *
 * @param obj Input, can be anything
 * @param debug If set to true (default) this will log an error message to the console if we found something that
 *  kind-of looks like a layout expression, but failed to validate as a proper expression. This will inform application
 *  developers of common mistakes.
 */
export function asLayoutExpression(
  obj: any,
  debug = true,
): ILayoutExpressionStructured | undefined {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  if ('expr' in obj) {
    return asValidDsl(obj, debug);
  }

  if ('function' in obj && 'args' in obj) {
    return asValidStructured(obj);
  }
}
