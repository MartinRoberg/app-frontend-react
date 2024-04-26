import React, { useEffect, useRef, useState } from 'react';

import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { useAppMutations } from 'src/core/contexts/AppQueriesProvider';
import { createContext } from 'src/core/contexts/context';
import { AppRouter } from 'src/index';
import type { IInstance } from 'src/types/shared';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { HttpClientError } from 'src/utils/network/sharedNetworking';

export interface Prefill {
  [key: string]: any;
}

export interface InstanceOwner {
  partyId: string | undefined;
}

export interface Instantiation {
  instanceOwner: InstanceOwner;
  prefill: Prefill;
}

interface InstantiationContext {
  instantiate: (node: LayoutNode | undefined, instanceOwnerPartyId: number) => void;
  instantiateWithPrefill: (node: LayoutNode | undefined, instantiation: Instantiation) => void;

  busyWithId: string | undefined;
  error: AxiosError | undefined | null;
  isLoading: boolean;
  lastResult: IInstance | undefined;
}

const { Provider, useCtx } = createContext<InstantiationContext>({ name: 'InstantiationContext', required: true });

function useInstantiateMutation() {
  const { doInstantiate } = useAppMutations();

  return useMutation({
    mutationFn: (instanceOwnerPartyId: number) => doInstantiate(instanceOwnerPartyId),
    onError: (error: HttpClientError) => {
      window.logError('Instantiation failed:\n', error);
    },
  });
}

function useInstantiateWithPrefillMutation() {
  const { doInstantiateWithPrefill } = useAppMutations();

  return useMutation({
    mutationFn: (instantiation: Instantiation) => doInstantiateWithPrefill(instantiation),
    onError: (error: HttpClientError) => {
      window.logError('Instantiation with prefill failed:\n', error);
    },
  });
}

export function InstantiationProvider({ children }: React.PropsWithChildren) {
  const instantiate = useInstantiateMutation();
  const instantiateWithPrefill = useInstantiateWithPrefillMutation();
  const [busyWithId, setBusyWithId] = useState<string | undefined>(undefined);
  const isInstantiatingRef = useRef(false);

  // Redirect to the instance page when instantiation completes
  useEffect(() => {
    if (instantiate.data?.id) {
      AppRouter.navigate(`/instance/${instantiate.data.id}`);
      setBusyWithId(undefined);
      isInstantiatingRef.current = false;
    }
    if (instantiateWithPrefill.data?.id) {
      AppRouter.navigate(`/instance/${instantiateWithPrefill.data.id}`);
      setBusyWithId(undefined);
      isInstantiatingRef.current = false;
    }
  }, [instantiate.data?.id, instantiateWithPrefill.data?.id]);

  return (
    <Provider
      value={{
        instantiate: (node, instanceOwnerPartyId) => {
          if (instantiate.data || instantiate.isPending || instantiate.error || isInstantiatingRef.current) {
            return;
          }
          isInstantiatingRef.current = true;
          setBusyWithId(node ? node.getId() : 'unknown');
          instantiate.mutate(instanceOwnerPartyId);
        },
        instantiateWithPrefill: (node, value) => {
          if (instantiateWithPrefill.data || instantiateWithPrefill.isPending || instantiateWithPrefill.error) {
            return;
          }
          isInstantiatingRef.current = true;
          setBusyWithId(node ? node.getId() : 'unknown');
          instantiateWithPrefill.mutate(value);
        },

        busyWithId,
        error: instantiate.error || instantiateWithPrefill.error,
        isLoading: instantiate.isPending || instantiateWithPrefill.isPending,
        lastResult: instantiate.data ?? instantiateWithPrefill.data,
      }}
    >
      {children}
    </Provider>
  );
}

export const useInstantiation = () => useCtx();
