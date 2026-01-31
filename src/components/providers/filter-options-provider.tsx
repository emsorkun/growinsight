'use client';

import { useEffect } from 'react';
import { useFilterStore } from '@/store/filter-store';

/** Fetches filter options only when store is empty (e.g. direct nav to channel-map). Dashboard/area-level etc. populate options from their own API responses. */
export function FilterOptionsProvider({ children }: { children: React.ReactNode }) {
  const options = useFilterStore((s) => s.options);
  const setOptions = useFilterStore((s) => s.setOptions);
  const hasOptions = options.months.length > 0 || options.cities.length > 0;

  useEffect(() => {
    if (hasOptions) return;

    fetch('/api/filter-options')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          setOptions(result.data);
        }
      })
      .catch(() => {
        // Ignore - pages will fetch their own data
      });
  }, [hasOptions, setOptions]);

  return <>{children}</>;
}
