import React from 'react';

import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { useAppQueries } from 'src/contexts/appQueriesContext';
import { createStrictContext } from 'src/features/contexts/createContext';
import { FormDynamicsActions } from 'src/features/form/dynamics/formDynamicsSlice';
import { useCurrentLayoutSetId } from 'src/features/form/layout/useCurrentLayoutSetId';
import { UnknownError } from 'src/features/instantiate/containers/UnknownError';
import { Loader } from 'src/features/loading/Loader';
import { useAppDispatch } from 'src/hooks/useAppDispatch';

const { Provider } = createStrictContext<undefined>({ name: 'DynamicsContext' });

function useDynamicsQuery() {
  const dispatch = useAppDispatch();
  const { fetchDynamics } = useAppQueries();
  const layoutSetId = useCurrentLayoutSetId();

  return useQuery(['fetchDynamics', layoutSetId], () => fetchDynamics(layoutSetId), {
    onSuccess: (dynamics) => {
      if (dynamics) {
        dispatch(FormDynamicsActions.fetchFulfilled(dynamics.data));
      }
    },
    onError: (error: AxiosError) => {
      window.logError('Fetching dynamics failed:\n', error);
    },
  });
}

export function DynamicsProvider({ children }: React.PropsWithChildren) {
  const query = useDynamicsQuery();

  if (query.error) {
    return <UnknownError />;
  }

  if (query.isLoading) {
    return <Loader reason='form-dynamics' />;
  }

  return <Provider value={undefined}>{children}</Provider>;
}
