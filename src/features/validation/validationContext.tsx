import React, { useCallback, useEffect, useRef } from 'react';
import type { PropsWithChildren } from 'react';

import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createZustandContext } from 'src/core/contexts/zustandContext';
import { Loader } from 'src/core/loading/Loader';
import { useApplicationMetadata } from 'src/features/applicationMetadata/ApplicationMetadataProvider';
import { useHasPendingAttachments } from 'src/features/attachments/hooks';
import { DataModels } from 'src/features/datamodel/DataModelsProvider';
import { FD } from 'src/features/formData/FormDataWrite';
import { useLaxInstanceData } from 'src/features/instance/InstanceContext';
import {
  type BaseValidation,
  type DataModelValidations,
  type FieldValidations,
  type ValidationContext,
  ValidationMask,
  type ValidationsProcessedLast,
  type WaitForValidation,
} from 'src/features/validation';
import { BackendValidation } from 'src/features/validation/backendValidation/BackendValidation';
import {
  useGetCachedInitialValidations,
  useRefetchInitialValidations,
} from 'src/features/validation/backendValidation/backendValidationQuery';
import {
  appSupportsIncrementalValidationFeatures,
  useShouldValidateInitial,
} from 'src/features/validation/backendValidation/backendValidationUtils';
import { hasValidationErrors, mergeFieldValidations, selectValidations } from 'src/features/validation/utils';
import { useAsRef } from 'src/hooks/useAsRef';
import { useWaitForState } from 'src/hooks/useWaitForState';
import { NodesInternal } from 'src/utils/layout/NodesContext';

interface Internals {
  individualValidations: {
    backend: DataModelValidations;
    expression: DataModelValidations;
  };
  processedLast: ValidationsProcessedLast; // This should only be used to check if we have finished processing the last validations from backend so that we know if the validation state is up to date
  /**
   * updateDataModelValidations
   * if validations is undefined, nothing will be changed
   */
  updateDataModelValidations: (
    key: Exclude<keyof Internals['individualValidations'], 'backend'>,
    dataElementId: string,
    validations?: FieldValidations,
  ) => void;
  updateBackendValidations: (
    backendValidations: { [dataElementId: string]: FieldValidations } | undefined,
    processedLast?: Partial<ValidationsProcessedLast>,
    taskValidations?: BaseValidation[],
  ) => void;
  updateValidating: (validating: WaitForValidation) => void;
}

function initialCreateStore() {
  return createStore<ValidationContext & Internals>()(
    immer((set) => ({
      // =======
      // Publicly exposed state
      state: {
        task: [],
        dataModels: {},
      },
      setShowAllBackendErrors: (newValue) =>
        set((state) => {
          state.showAllBackendErrors = newValue;
        }),
      showAllBackendErrors: false,
      validating: undefined,

      // =======
      // Internal state
      individualValidations: {
        backend: {},
        expression: {},
      },
      processedLast: {
        initial: undefined,
        incremental: undefined,
      },
      updateDataModelValidations: (key, dataElementId, validations) =>
        set((state) => {
          if (validations) {
            state.individualValidations[key][dataElementId] = validations;
            state.state.dataModels[dataElementId] = mergeFieldValidations(
              state.individualValidations.backend[dataElementId],
              state.individualValidations.expression[dataElementId],
            );
          }
        }),
      updateBackendValidations: (backendValidations, processedLast, taskValidations) =>
        set((state) => {
          if (processedLast?.incremental) {
            state.processedLast.incremental = processedLast.incremental;
          }
          if (processedLast?.initial) {
            state.processedLast.initial = processedLast.initial;
          }
          if (taskValidations) {
            state.state.task = taskValidations;
          }
          if (backendValidations) {
            /**
             * If a data model no longer has any backend validations, the key will not exist in the new object,
             * we therefore need to make sure we update data model validations for any model that
             * previously had validations as well.
             */
            const keys = new Set([
              ...Object.keys(backendValidations),
              ...Object.keys(state.individualValidations.backend),
            ]);

            state.individualValidations.backend = backendValidations;
            for (const dataElementId of keys) {
              state.state.dataModels[dataElementId] = mergeFieldValidations(
                state.individualValidations.backend[dataElementId],
                state.individualValidations.expression[dataElementId],
              );
            }
          }
        }),
      updateValidating: (newValidating) =>
        set((state) => {
          state.validating = newValidating;
        }),
    })),
  );
}

const { Provider, useSelector, useLaxSelector, useSelectorAsRef, useStore, useLaxSelectorAsRef, useDelayedSelector } =
  createZustandContext({
    name: 'Validation',
    required: true,
    initialCreateStore,
  });

export function ValidationProvider({ children }: PropsWithChildren) {
  const writableDataTypes = DataModels.useWritableDataTypes();
  return (
    <Provider>
      <BackendValidation dataTypes={writableDataTypes} />
      <ManageShowAllErrors />
      {children}
    </Provider>
  );
}

function useWaitForValidation(): WaitForValidation {
  const waitForNodesReady = NodesInternal.useWaitUntilReady();
  const waitForSave = FD.useWaitForSave();
  const waitForState = useWaitForState<ValidationsProcessedLast['initial'], ValidationContext & Internals>(useStore());
  const hasPendingAttachments = useHasPendingAttachments();

  // Provide a promise that resolves when all pending validations have been completed
  const pendingAttachmentsRef = useAsRef(hasPendingAttachments);
  const waitForAttachments = useWaitForState(pendingAttachmentsRef);

  const hasWritableDataTypes = !!DataModels.useWritableDataTypes()?.length;
  const enabled = useShouldValidateInitial();
  const getCachedInitialValidations = useGetCachedInitialValidations();

  return useCallback(
    async (forceSave = true) => {
      if (!enabled || !hasWritableDataTypes) {
        return;
      }

      await waitForAttachments((state) => !state);

      // Wait until we've saved changed to backend, and we've processed the backend validations we got from that save
      await waitForNodesReady();
      const validationsFromSave = await waitForSave(forceSave);
      // If validationsFromSave is not defined, we check if initial validations are done processing
      const lastInitialValidations = await waitForState((state, setReturnValue) => {
        const { isFetching, cachedInitialValidations } = getCachedInitialValidations();

        if (
          state.processedLast.incremental === validationsFromSave &&
          state.processedLast.initial === cachedInitialValidations &&
          !isFetching
        ) {
          setReturnValue(cachedInitialValidations);
          return true;
        }

        return false;
      });
      await waitForNodesReady({ initial: lastInitialValidations, incremental: validationsFromSave });
    },
    [
      enabled,
      getCachedInitialValidations,
      hasWritableDataTypes,
      waitForAttachments,
      waitForNodesReady,
      waitForSave,
      waitForState,
    ],
  );
}

export function ProvideWaitForValidation() {
  const validate = useWaitForValidation();
  const updateValidating = useSelector((state) => state.updateValidating);

  useEffect(() => {
    updateValidating(validate);
  }, [updateValidating, validate]);

  return null;
}

export function LoadingBlockerWaitForValidation({ children }: PropsWithChildren) {
  const validating = useSelector((state) => state.validating);
  if (!validating) {
    return <Loader reason='validation-awaiter' />;
  }

  return <>{children}</>;
}

function ManageShowAllErrors() {
  const showAllErrors = useSelector((state) => state.showAllBackendErrors);
  return showAllErrors ? <UpdateShowAllErrors /> : null;
}

function UpdateShowAllErrors() {
  const taskValidations = useSelector((state) => state.state.task);
  const dataModelValidations = useSelector((state) => state.state.dataModels);
  const setShowAllErrors = useSelector((state) => state.setShowAllBackendErrors);
  const hasIncrementalValidationFeatures = appSupportsIncrementalValidationFeatures(useApplicationMetadata());

  const isFirstRender = useRef(true);

  /**
   * Call /validate manually whenever a data element changes to get updated non-incremental validations.
   * This should happen whenever any data element changes, so we should check the lastChanged on each data element,
   * or if new data elements are added. Single-patch does not return updated instance data so for now we need to
   * also check useLastSaveValidationIssues which will change on each patch.
   */
  const lastSaved = FD.useLastSaveValidationIssues();
  const instanceDataChanges = useLaxInstanceData((instance) =>
    instance.data.map(({ id, lastChanged }) => ({ id, lastChanged })),
  );

  // Since process/next returns non-incremental validations, we need to also check these to see when they are removed
  const refetchInitialValidations = useRefetchInitialValidations(false, !hasIncrementalValidationFeatures);
  useEffect(() => {
    // No need to invalidate initial validations right away
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Adding or deleting an attachment can lead to changes in both the data model and an update
    // in the attachments data elements, which can lead to two updates right after each other,
    // so debouncing a little so that we don't call validate too much as it can be heavy.
    const timer = setTimeout(() => refetchInitialValidations, 1000);
    return () => clearTimeout(timer);
  }, [refetchInitialValidations, instanceDataChanges, lastSaved]);

  /**
   * Hide unbound errors as soon as possible.
   */
  useEffect(() => {
    const backendMask = ValidationMask.Backend | ValidationMask.CustomBackend;
    const hasFieldErrors =
      Object.values(dataModelValidations)
        .flatMap((fields) => Object.values(fields))
        .flatMap((field) => selectValidations(field, backendMask, 'error')).length > 0;

    if (!hasFieldErrors && !hasValidationErrors(taskValidations)) {
      setShowAllErrors(false);
    }
  }, [dataModelValidations, setShowAllErrors, taskValidations]);

  return null;
}

/**
 * This hook returns a function that lets you select one or more fields from the validation state. The hook will
 * only force a re-render if the selected fields have changed.
 */
function useDS<U>(outerSelector: (state: ValidationContext) => U) {
  return useDelayedSelector({
    mode: 'innerSelector',
    makeArgs: (state) => [outerSelector(state)],
  });
}

export type ValidationSelector = ReturnType<typeof Validation.useSelector>;
export type ValidationDataModelSelector = ReturnType<typeof Validation.useDataModelSelector>;
export type DataElementHasErrorsSelector = ReturnType<typeof Validation.useDataElementHasErrorsSelector>;

export const Validation = {
  useFullStateRef: () => useSelectorAsRef((state) => state.state),

  // Selectors. These are memoized, so they won't cause a re-render unless the selected fields change.
  useSelector: () => useDS((state) => state),
  useDataModelSelector: () => useDS((state) => state.state.dataModels),

  useDataElementHasErrorsSelector: () =>
    useDelayedSelector({
      mode: 'simple',
      selector: (dataElementId: string) => (state) => {
        const dataElementValidations = state.state.dataModels[dataElementId];
        for (const fieldValidations of Object.values(dataElementValidations ?? {})) {
          for (const validation of fieldValidations) {
            if (validation.severity === 'error') {
              return true;
            }
          }
        }
        return false;
      },
    }),

  useShowAllBackendErrors: () => useSelector((state) => state.showAllBackendErrors),
  useSetShowAllBackendErrors: () =>
    useLaxSelector((state) => async () => {
      // Make sure we have finished processing validations before setting showAllErrors.
      // This is because we automatically turn off this state as soon as possible.
      // If the validations to show have not finished processing, this could get turned off before they ever became visible.
      state.validating && (await state.validating());
      state.setShowAllBackendErrors(true);
    }),
  useValidating: () => useSelector((state) => state.validating!),
  useUpdateDataModelValidations: () => useSelector((state) => state.updateDataModelValidations),
  useUpdateBackendValidations: () => useSelector((state) => state.updateBackendValidations),

  useProcessedLast: () => useSelector((state) => state.processedLast),
  useProcessedLastRef: () => useSelectorAsRef((state) => state.processedLast),

  useRef: () => useSelectorAsRef((state) => state),
  useLaxRef: () => useLaxSelectorAsRef((state) => state),
};
