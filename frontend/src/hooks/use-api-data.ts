"use client";

import { useCallback, useEffect, useState } from "react";

export function useApiData<T>(loadData: (() => Promise<T>) | null) {
  const [data, setData] = useState<T | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!loadData) return;
    let isStale = false;
    loadData()
      .then((loadedData) => {
        if (isStale) return;
        setData(loadedData);
        setErrorMessage(null);
      })
      .catch((error: Error) => {
        if (!isStale) setErrorMessage(error.message);
      });
    return () => {
      isStale = true;
    };
  }, [loadData, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { data, errorMessage, reload };
}
