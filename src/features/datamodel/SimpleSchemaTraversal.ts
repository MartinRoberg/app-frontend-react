import levenshtein from 'js-levenshtein';
import pointer from 'jsonpointer';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';

import { pointerToDotNotation } from 'src/features/datamodel/notations';
import { isSchemaLookupError } from 'src/features/datamodel/SimpleSchemaTraversal.tools';
import type { SchemaLookupError } from 'src/features/datamodel/SimpleSchemaTraversal.tools';

interface Props {
  schema: JSONSchema7;
  targetPointer: string;
  rootElementPath?: string;
}

/**
 * A simple JSON schema traversal tool that can be used to lookup a binding in a schema to find the
 * corresponding JSON schema definition for that binding.
 */
class SimpleSchemaTraversal {
  private current: JSONSchema7;
  private currentPath: string[] = [''];
  private currentSchemaPath: string[] = [''];

  constructor(
    private fullSchema: JSONSchema7,
    private targetPointer: string,
    rootElementPath?: string,
  ) {
    this.current = rootElementPath ? this.lookupRef(rootElementPath) : fullSchema;
    if (rootElementPath) {
      this.currentSchemaPath = rootElementPath.replace(/^#/g, '').split('/');
    }
  }

  public get(item = this.current, path = this.currentSchemaPath): JSONSchema7 {
    const [resolvedItem, resolvedPath] = this.resolveRef(item, path);
    if (resolvedItem && Array.isArray(resolvedItem.type)) {
      const nonNullables = resolvedItem.type.filter((type) => type !== 'null');
      if (nonNullables.length === 1) {
        return {
          ...resolvedItem,
          type: nonNullables[0],
        };
      }
    }
    if (resolvedItem && resolvedItem.oneOf) {
      const nonNullables = resolvedItem.oneOf.filter(
        (type) => type && this.resolveRef(type, resolvedPath)[0].type !== 'null',
      );
      if (nonNullables.length === 1) {
        return this.resolveRef(nonNullables[0], resolvedPath)[0];
      }
    }

    if (resolvedItem && resolvedItem.type === undefined && resolvedItem.properties) {
      return {
        ...resolvedItem,
        type: 'object',
      };
    }

    return resolvedItem;
  }

  public getAsResolved(item = this.current): JSONSchema7 {
    const resolved = structuredClone(this.get(item));

    const recursiveResolve = (obj: JSONSchema7 | JSONSchema7Definition) => {
      if (typeof obj === 'object' && !Array.isArray(obj)) {
        if (obj.$ref) {
          const [resolved] = structuredClone(this.resolveRef(obj));
          return recursiveResolve(resolved);
        }
        if (obj.properties) {
          for (const key in obj.properties) {
            obj.properties[key] = recursiveResolve(obj.properties[key]) as JSONSchema7Definition;
          }
          if (!obj.type) {
            obj.type = 'object';
          }
        }
        if (obj.items && typeof obj.items === 'object' && !Array.isArray(obj.items)) {
          obj.items = recursiveResolve(obj.items) as JSONSchema7Definition;
          if (!obj.type) {
            obj.type = 'array';
          }
        }
        if (obj.items && Array.isArray(obj.items)) {
          obj.items = obj.items.map((i) => recursiveResolve(i));
          if (!obj.type) {
            obj.type = 'array';
          }
        }
        if (obj.allOf) {
          obj.allOf = obj.allOf.map((i) => recursiveResolve(i));
        }
        if (obj.anyOf) {
          obj.anyOf = obj.anyOf.map((i) => recursiveResolve(i));
        }
        if (obj.oneOf) {
          obj.oneOf = obj.oneOf.map((i) => recursiveResolve(i));
        }
      }

      return obj;
    };

    return recursiveResolve(resolved) as JSONSchema7;
  }

  public getCurrentPath(): string {
    return this.currentPath.join('/');
  }

  public getCurrentSchemaPath(): string {
    return this.currentSchemaPath.join('/');
  }

  public gotoProperty(property: string): this {
    const foundProperties: string[] = [];
    const alternatives = this.getAlternatives();
    for (const [alternative, path] of alternatives) {
      if (alternative.properties) {
        if (alternative.properties[property]) {
          this.current = alternative.properties[property] as JSONSchema7;
          this.currentPath.push(property);
          this.currentSchemaPath = structuredClone(path);
          this.currentSchemaPath.push('properties', property);
          return this;
        }

        foundProperties.push(...Object.keys(alternative.properties));
      }
    }

    const [isMisCased, correctCasing] = this.isMisCased(property, foundProperties);
    if (isMisCased) {
      throw this.makeError('misCasedProperty', {
        actualName: correctCasing,
        referencedName: property,
      });
    }

    if (this.isRepeatingGroup(alternatives)) {
      throw this.makeError('missingRepeatingGroup', {});
    }

    const sortedByLikeness = foundProperties.sort((a, b) => levenshtein(property, a) - levenshtein(property, b));
    const mostLikelyProperty = sortedByLikeness[0];
    const likeness = mostLikelyProperty && levenshtein(property, mostLikelyProperty);
    const similarity = likeness && Math.round((1 - likeness / property.length) * 100);

    throw this.makeError('missingProperty', {
      property,
      mostLikelyProperty: similarity && similarity > 50 ? mostLikelyProperty : undefined,
      validProperties: foundProperties,
    });
  }

  public gotoIndex(index: number): this {
    const alternatives = this.getAlternatives();
    for (const [alternative, path] of alternatives) {
      if (
        (alternative.type === 'array' || (Array.isArray(alternative.type) && alternative.type.includes('array'))) &&
        alternative.items
      ) {
        this.current = alternative.items as JSONSchema7;
        this.currentPath.push(`${index}`);
        this.currentSchemaPath = structuredClone(path);
        this.currentSchemaPath.push('items');
        return this;
      }
    }

    const actual = alternatives.length === 1 ? this.get(alternatives[0][0]) : undefined;
    throw this.makeError('notAnArray', { actualType: typeof actual?.type === 'string' ? actual.type : undefined });
  }

  private isMisCased(property: string, foundProperties: string[]): [boolean, string] {
    const lowerCaseMap: { [key: string]: string } = {};
    for (const key of foundProperties) {
      lowerCaseMap[key.toLowerCase()] = key;
    }
    if (lowerCaseMap[property.toLowerCase()]) {
      return [true, lowerCaseMap[property.toLowerCase()]];
    }

    return [false, ''];
  }

  private isRepeatingGroup(alternatives: [JSONSchema7, string[]][]): boolean {
    return alternatives.some(([alternative]) => {
      if (alternative.type === 'array' && alternative.items) {
        const items =
          typeof alternative.items === 'object' && !Array.isArray(alternative.items)
            ? this.resolveRef(alternative.items)
            : undefined;

        if (typeof items === 'object' && (items[0].type === 'object' || items[0].properties)) {
          return true;
        }
      }
      return false;
    });
  }

  private lookupRef(path: string): JSONSchema7 {
    const resolved = pointer.get(this.fullSchema, path.replace(/^#/g, ''));
    if (resolved) {
      return resolved as JSONSchema7;
    }

    throw this.makeError('referenceError', { reference: path });
  }

  /**
   * Resolve $ref that points to another place in the schema (maybe recursive),
   * and resolve other rarities (like allOf that combines an empty schema)
   */
  private resolveRef(
    item: JSONSchema7 | JSONSchema7Definition | undefined,
    schemaPath: string[] = this.currentSchemaPath,
  ): [JSONSchema7, string[]] {
    let currentSchema = item as JSONSchema7;
    let currentSchemaPath = schemaPath;
    while (currentSchema && typeof currentSchema === 'object' && '$ref' in currentSchema && currentSchema.$ref) {
      currentSchemaPath = currentSchema.$ref!.replace(/^#/g, '').split('/');
      currentSchema = this.lookupRef(currentSchema.$ref);
    }

    if (currentSchema && typeof currentSchema === 'object' && 'allOf' in currentSchema && currentSchema.allOf) {
      const nonEmptyAllOf = currentSchema.allOf.filter(
        (i) => i !== null && i !== undefined && Object.keys(i).length > 0,
      );
      if (nonEmptyAllOf.length === 1) {
        [currentSchema, currentSchemaPath] = this.resolveRef(nonEmptyAllOf[0], currentSchemaPath);
      }
    }

    return [currentSchema, currentSchemaPath];
  }

  public getAlternatives(_item = this.current, _path = this.currentSchemaPath): [JSONSchema7, string[]][] {
    const [item, currentSchemaPath] = this.resolveRef(_item, _path);
    const alternatives = [[item, currentSchemaPath]] as [JSONSchema7, string[]][];
    const others = [item.allOf, item.anyOf, item.oneOf].map((list) =>
      list?.map((i) => this.resolveRef(i, [...currentSchemaPath, 'allOf'])),
    );
    for (const other of others) {
      for (const [_innerItem, _innerPath] of other || []) {
        const [innerItem, innerPath] = this.resolveRef(_innerItem, _innerPath);
        if (typeof innerItem === 'object') {
          const innerAlternatives = this.getAlternatives(innerItem, innerPath);
          alternatives.push(...innerAlternatives);
        }
      }
    }

    return alternatives;
  }

  private makeError<T extends ErrorUnion>(type: T, error: MinimalError<T>): ErrorFromType<T> {
    return {
      error: type,
      fullPointer: this.targetPointer,
      fullDotNotation: pointerToDotNotation(this.targetPointer),
      stoppedAtPointer: this.getCurrentPath(),
      stoppedAtDotNotation: pointerToDotNotation(this.getCurrentPath()),
      ...error,
    } as ErrorFromType<T>;
  }
}

type ErrorUnion = SchemaLookupError['error'];
type ErrorFromType<T extends ErrorUnion> = Extract<SchemaLookupError, { error: T }>;
type MinimalError<T extends ErrorUnion> = Omit<
  ErrorFromType<T>,
  'isError' | 'error' | 'stoppedAtDotNotation' | 'stoppedAtPointer' | 'fullPointer' | 'fullDotNotation'
>;

export type SchemaLookupResult = [JSONSchema7, undefined] | [undefined, SchemaLookupError];

/**
 * Looks up a binding in a schema to find the corresponding JSON schema definition for that binding.
 * Uses the SimpleSchemaTraversal class to do the actual lookup, but use this function instead of
 * instantiating the class directly.
 */
export function lookupBindingInSchema(props: Props): SchemaLookupResult {
  const { schema, rootElementPath, targetPointer } = props;

  try {
    const traverser = new SimpleSchemaTraversal(schema, targetPointer, rootElementPath);
    const parts = targetPointer.split('/').filter((part) => part !== '' && part !== '#');
    for (const part of parts) {
      const isIndex = /^\d+$/.test(part);
      if (isIndex) {
        traverser.gotoIndex(parseInt(part, 10));
      } else {
        traverser.gotoProperty(part);
      }
    }
    return [traverser.getAsResolved(), undefined];
  } catch (error) {
    if (isSchemaLookupError(error)) {
      return [undefined, error];
    }
    throw error;
  }
}

export function lookupPropertiesInSchema(schema: JSONSchema7, rootElementPath: string): Set<string> {
  const traverser = new SimpleSchemaTraversal(schema, '', rootElementPath);
  const resolved = traverser.getAsResolved();
  if (resolved.properties) {
    return new Set(Object.keys(resolved.properties));
  }

  const alternatives = traverser.getAlternatives();
  const properties = new Set<string>();
  for (const [alternative] of alternatives) {
    if (alternative.properties) {
      for (const key of Object.keys(alternative.properties)) {
        properties.add(key);
      }
    }
  }

  return properties;
}

export function lookupPathInSchema(props: Props): [string | null, JSONSchema7 | null] {
  const { schema, rootElementPath, targetPointer } = props;

  try {
    const traverser = new SimpleSchemaTraversal(schema, targetPointer, rootElementPath);
    const parts = targetPointer.split('/').filter((part) => part !== '' && part !== '#');
    for (const part of parts) {
      const isIndex = /^\d+$/.test(part);
      if (isIndex) {
        traverser.gotoIndex(parseInt(part, 10));
      } else {
        traverser.gotoProperty(part);
      }
    }
    return [traverser.getCurrentSchemaPath(), traverser.getAsResolved()];
  } catch {
    window.logWarnOnce(`Unable to find ${targetPointer} in schema`);
    return [null, null];
  }
}
