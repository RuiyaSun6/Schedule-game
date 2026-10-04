import { useEffect, useState } from 'react';
import type { Item } from '../types';
import { loadItems } from './shop';

export function useCatalog() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [demo, setDemo] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    void loadItems().then((result) => { if (active) { setItems(result.items); setDemo(result.demo); } })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Couldn’t load items.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  return { items, loading, error, demo, retry: () => setAttempt((value) => value + 1) };
}
