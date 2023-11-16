import { useQuery } from '@tanstack/react-query';

import { useAppQueries } from 'src/core/contexts/AppQueriesProvider';
import { delayedContext } from 'src/core/contexts/delayedContext';
import { createStrictQueryContext } from 'src/core/contexts/queryContext';
import { ApplicationMetadataActions } from 'src/features/applicationMetadata/applicationMetadataSlice';
import { useAppDispatch } from 'src/hooks/useAppDispatch';
import type { IApplicationMetadata } from 'src/features/applicationMetadata/index';
import type { HttpClientError } from 'src/utils/network/sharedNetworking';

const useApplicationMetadataQuery = () => {
  const dispatch = useAppDispatch();
  const { fetchApplicationMetadata } = useAppQueries();
  return useQuery({
    queryKey: ['fetchApplicationMetadata'],
    queryFn: () => fetchApplicationMetadata(),
    onSuccess: (applicationMetadata) => {
      dispatch(ApplicationMetadataActions.getFulfilled({ applicationMetadata }));
    },
    onError: (error: HttpClientError) => {
      window.logError('Fetching application metadata failed:\n', error);
    },
  });
};

const { Provider, useCtx } = delayedContext(() =>
  createStrictQueryContext<IApplicationMetadata>({
    name: 'ApplicationMetadata',
    useQuery: useApplicationMetadataQuery,
  }),
);

export const ApplicationMetadataProvider = Provider;
export const useApplicationMetadata = () => useCtx();
