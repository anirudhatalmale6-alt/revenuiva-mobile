import { useState, useCallback } from 'react';

export function useRefresh(callback: () => Promise<void>): [boolean, () => void] {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    callback().finally(() => setRefreshing(false));
  }, [callback]);

  return [refreshing, onRefresh];
}
