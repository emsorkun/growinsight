'use client';

import { useEffect } from 'react';
import { useFilterStore } from '@/store/filter-store';

/** Prefetches filter options on mount so dropdowns have data before page loads */
export function FilterOptionsProvider({ children }: { children: React.ReactNode }) {
  const setOptions = useFilterStore((s) => s.setOptions);

  useEffect(() => {
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
  }, [setOptions]);

  return <>{children}</>;
}
