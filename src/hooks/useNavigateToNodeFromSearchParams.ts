import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { SearchParams } from 'src/hooks/useNavigatePage';

export type IdAndRef = { id: string; ref: React.RefObject<HTMLDivElement> };
export function useNavigateToNodeFromSearchParams(mainIdsWithRefs: IdAndRef[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const componentId = searchParams.get(SearchParams.FocusComponentId);
  const componentToFocusRef = mainIdsWithRefs.find((n) => n.id === componentId)?.ref;

  useEffect(() => {
    if (componentToFocusRef?.current) {
      requestAnimationFrame(() => {
        searchParams.delete(SearchParams.FocusComponentId);
        setSearchParams(searchParams, { preventScrollReset: true });

        componentToFocusRef?.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }, [componentToFocusRef, searchParams, setSearchParams]);
}
