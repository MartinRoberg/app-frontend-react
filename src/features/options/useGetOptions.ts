import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useDataModelBindings } from 'src/features/formData/useDataModelBindings';
import { useCurrentLanguage } from 'src/features/language/LanguageProvider';
import { useLanguage } from 'src/features/language/useLanguage';
import { castOptionsToStrings } from 'src/features/options/castOptionsToStrings';
import { useGetOptionsQuery } from 'src/features/options/useGetOptionsQuery';
import { useNodeOptions } from 'src/features/options/useNodeOptions';
import { useSourceOptions } from 'src/hooks/useSourceOptions';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import { filterDuplicateOptions, filterEmptyOptions } from 'src/utils/options';
import type { IUseLanguage } from 'src/features/language/useLanguage';
import type { IOptionInternal } from 'src/features/options/castOptionsToStrings';
import type { IDataModelBindingsOptionsSimple, IDataModelBindingsSimple } from 'src/layout/common.generated';
import type { CompIntermediateExact, CompWithBehavior } from 'src/layout/layout';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export type OptionsValueType = 'single' | 'multi';

interface FetchOptionsProps {
  valueType: OptionsValueType;
  node: LayoutNode<CompWithBehavior<'canHaveOptions'>>;
  item: CompIntermediateExact<CompWithBehavior<'canHaveOptions'>>;
}

interface SetOptionsProps {
  valueType: OptionsValueType;
  dataModelBindings?: IDataModelBindingsOptionsSimple | IDataModelBindingsSimple;
}

export interface GetOptionsResult {
  // The final list of options deduced from the component settings. This will be an array of objects, where each object
  // has a string-typed 'value' property, regardless of the underlying options configuration.
  options: IOptionInternal[];

  // Whether the options are currently being fetched from the API. This is usually false in normal components, as
  // options are always fetched on page load, but it can be true if the options are fetched dynamically based on
  // mapping or query parameters. In those cases you most likely want to render a spinner.
  isFetching: boolean;
}

export interface SetOptionsResult {
  // This is guaranteed to only contain values that actually exist in the options that are returned.
  // The Combobox component will crash if a value does not exist in the options list.
  // The values are guaranteed to be stringy even if the underlying options JSON and/or data model contains numbers, booleans, etc.
  selectedValues: string[];

  rawData: string;

  setData: (values: string[]) => void;
}

interface EffectProps {
  options: IOptionInternal[] | undefined;
  preselectedOption: IOptionInternal | undefined;
  selectedValues: string[];
  setValue: (values: string[]) => void;
}

const getLabelsForActiveOptions = (selectedOptions: string[], allOptions: IOptionInternal[]): string[] =>
  allOptions.filter((option) => selectedOptions.includes(option.value)).map((option) => option.label);

const usePrevious = (value: any) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
const useHasChanged = (val: any) => {
  const prevVal = usePrevious(val);
  return prevVal !== val;
};

const defaultOptions: IOptionInternal[] = [];

type SortOrder = 'asc' | 'desc';
const compareOptionAlphabetically =
  (langAsString: IUseLanguage['langAsString'], sortOrder: SortOrder = 'asc', language: string = 'nb') =>
  (a: IOptionInternal, b: IOptionInternal) => {
    const comparison = langAsString(a.label).localeCompare(langAsString(b.label), language, {
      sensitivity: 'base',
      numeric: true,
    });
    return sortOrder === 'asc' ? comparison : -comparison;
  };

function useSetOptions(props: SetOptionsProps, alwaysOptions: IOptionInternal[]): SetOptionsResult {
  const { valueType, dataModelBindings } = props;
  const { formData, setValue } = useDataModelBindings(dataModelBindings);
  const value = formData.simpleBinding ?? '';
  const { langAsString } = useLanguage();

  const currentValues = useMemo(() => (value && value.length > 0 ? value.split(',') : []), [value]);

  const selectedValues = useMemo(
    () => currentValues.filter((value) => alwaysOptions.find((option) => option.value === value)),
    [alwaysOptions, currentValues],
  );

  const translatedLabels = useMemo(
    () => getLabelsForActiveOptions(currentValues, alwaysOptions).map((label) => langAsString(label)),
    [alwaysOptions, currentValues, langAsString],
  );

  const labelsHaveChanged = useHasChanged(translatedLabels.join(','));

  useEffect(() => {
    if (!(dataModelBindings as IDataModelBindingsOptionsSimple)?.label) {
      return;
    }

    if (!labelsHaveChanged) {
      return;
    }

    if (valueType === 'single') {
      setValue('label' as any, translatedLabels.at(0));
    } else {
      setValue('label' as any, translatedLabels);
    }
  }, [translatedLabels, labelsHaveChanged, dataModelBindings, setValue, valueType]);

  const setData = useCallback((values: string[]) => setValue('simpleBinding', values.join(',')), [setValue]);

  return {
    rawData: value,
    selectedValues,
    setData,
  };
}
/**
 * If given the 'preselectedOptionIndex' property, we should automatically select the given option index as soon
 * as options are ready. The code is complex to guard against overwriting data that has been set by the user.
 */
function usePreselectedOptionIndex(props: EffectProps) {
  const { setValue, preselectedOption } = props;
  const hasSelectedInitial = useRef(false);
  const hasValue = props.selectedValues.length > 0;
  const shouldSelectOptionAutomatically = !hasValue && !hasSelectedInitial.current && preselectedOption !== undefined;

  useEffect(() => {
    if (shouldSelectOptionAutomatically) {
      setValue([preselectedOption.value]);
      hasSelectedInitial.current = true;
    }
  }, [preselectedOption, shouldSelectOptionAutomatically, setValue]);
}

/**
 * If options has changed and the values no longer include the current value, we should clear the value.
 * This is especially useful when fetching options from an API with mapping, or when generating options
 * from a repeating group. If the options changed and the selected option (or selected row in a repeating group)
 * is gone, we should not save stale/invalid data, so we clear it.
 */
function useRemoveStaleValues(props: EffectProps) {
  useEffect(() => {
    const { options, selectedValues, setValue } = props;
    const itemsToRemove = selectedValues.filter((v) => !options?.find((option) => option.value === v));
    if (itemsToRemove.length > 0) {
      setValue(selectedValues.filter((v) => !itemsToRemove.includes(v)));
    }
  }, [props]);
}

export function useFetchOptions({ node, valueType, item }: FetchOptionsProps): GetOptionsResult {
  const { options, optionsId, secure, source, mapping, queryParameters, sortOrder, dataModelBindings } = item;
  const preselectedOptionIndex = 'preselectedOptionIndex' in item ? item.preselectedOptionIndex : undefined;
  const { langAsString } = useLanguage();
  const selectedLanguage = useCurrentLanguage();
  const { setValue } = useDataModelBindings(item.dataModelBindings as any);

  const sourceOptions = useSourceOptions({ source, node });
  const staticOptions = useMemo(() => (optionsId ? undefined : castOptionsToStrings(options)), [options, optionsId]);
  const { data: fetchedOptions, isFetching, isError } = useGetOptionsQuery(optionsId, mapping, queryParameters, secure);

  const [calculatedOptions, preselectedOption] = useMemo(() => {
    let draft = sourceOptions || fetchedOptions?.data || staticOptions;
    let preselectedOption: IOptionInternal | undefined = undefined;
    if (preselectedOptionIndex !== undefined && draft && draft[preselectedOptionIndex]) {
      // This index uses the original options array, before any filtering or sorting
      preselectedOption = draft[preselectedOptionIndex];
    }

    if (draft && draft.length < 2) {
      // No need to sort or filter if there are 0 or 1 options. Using langAsString() can lead to re-rendering, so
      // we avoid it if we don't need it.
      return [draft, preselectedOption];
    }

    if (draft) {
      draft = filterDuplicateOptions(draft);
      draft = filterEmptyOptions(draft);
    }
    if (draft && sortOrder) {
      draft = [...draft].sort(compareOptionAlphabetically(langAsString, sortOrder, selectedLanguage));
    }

    return [draft, preselectedOption];
  }, [
    fetchedOptions?.data,
    langAsString,
    preselectedOptionIndex,
    selectedLanguage,
    sortOrder,
    sourceOptions,
    staticOptions,
  ]);

  // Log error if fetching options failed
  useEffect(() => {
    if (isError) {
      const _optionsId = optionsId ? `\noptionsId: ${optionsId}` : '';
      const _mapping = mapping ? `\nmapping: ${JSON.stringify(mapping)}` : '';
      const _queryParameters = queryParameters ? `\nqueryParameters: ${JSON.stringify(queryParameters)}` : '';
      const _secure = secure ? `\nsecure: ${secure}` : '';

      window.logErrorOnce(
        `Failed to fetch options for node ${node.getId()}${_optionsId}${_mapping}${_queryParameters}${_secure}`,
      );
    }
  }, [isError, mapping, node, optionsId, queryParameters, secure]);

  const alwaysOptions = calculatedOptions || defaultOptions;
  const { selectedValues, setData } = useSetOptions(
    { valueType, dataModelBindings: dataModelBindings as any },
    alwaysOptions,
  );

  const downstreamParameters: string = fetchedOptions?.headers['altinn-downstreamparameters'];
  useEffect(() => {
    if (dataModelBindings && 'metadata' in dataModelBindings && dataModelBindings.metadata && downstreamParameters) {
      // The value might be url-encoded
      setValue('metadata', decodeURIComponent(downstreamParameters));
    }
  }, [dataModelBindings, downstreamParameters, setValue]);

  const effectProps: EffectProps = useMemo(
    () => ({
      options: calculatedOptions,
      valueType,
      preselectedOption,
      selectedValues,
      setValue: setData,
    }),
    [calculatedOptions, selectedValues, preselectedOption, setData, valueType],
  );

  usePreselectedOptionIndex(effectProps);
  useRemoveStaleValues(effectProps);

  return {
    options: alwaysOptions,
    isFetching,
  };
}

export function useGetOptions(
  node: LayoutNode<CompWithBehavior<'canHaveOptions'>>,
  valueType: OptionsValueType,
): GetOptionsResult & SetOptionsResult {
  const dataModelBindings = useNodeItem(node, (i) => i.dataModelBindings) as any;
  const get = useNodeOptions(node);
  const set = useSetOptions({ valueType, dataModelBindings }, get.options);

  return useMemo(() => ({ ...get, ...set }), [get, set]);
}
