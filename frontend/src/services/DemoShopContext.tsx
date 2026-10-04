import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePlayer } from './PlayerContext';
import { getFurnitureVariant } from '../data/shopAssets';
interface DemoInventory { coins: number; quantities: Record<string, number>; }
interface DemoShop extends DemoInventory { buy: (id: string, quantity?: number) => string | null; }
const DemoContext = createContext<DemoShop | null>(null);
export function DemoShopProvider({ children }: { children: ReactNode }) {
  const player = usePlayer();
  // Read the previous local demo inventory too, migrating each owned ID to one copy.
  const key = `lifequest:demo-shop:v1:${player.id}`;
  const [inventory, setInventory] = useState<DemoInventory>(() => {
    try {
      const data = JSON.parse(localStorage.getItem(key) ?? 'null');
      if (data && Number.isFinite(data.coins) && data.coins >= 0) {
        const quantities: Record<string, number> = {};
        if (Array.isArray(data.ownedItems)) for (const id of data.ownedItems) if (typeof id === 'string' && getFurnitureVariant(id)) quantities[id] = 1;
        if (data.quantities && typeof data.quantities === 'object') for (const [id, count] of Object.entries(data.quantities)) if (getFurnitureVariant(id) && typeof count === 'number' && Number.isSafeInteger(count) && count > 0) quantities[id] = count;
        return { coins: data.coins, quantities };
      }
    } catch { /* Start a new local demo purse. */ }
    return { coins: 500, quantities: {} };
  });
  const current = useRef(inventory);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(inventory)); } catch { /* Keep session inventory available. */ } }, [inventory, key]);
  function buy(id: string, quantity = 1): string | null {
    const item = getFurnitureVariant(id);
    if (!item) return 'This variant is unavailable.';
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return 'Choose a quantity from 1 to 10.';
    const cost = item.price * quantity;
    if (current.current.coins < cost) return 'Not enough coins';
    const next = { coins: current.current.coins - cost, quantities: { ...current.current.quantities, [id]: (current.current.quantities[id] ?? 0) + quantity } };
    current.current = next;
    setInventory(next);
    return null;
  }
  return <DemoContext.Provider value={{ ...inventory, buy }}>{children}</DemoContext.Provider>;
}
export function useDemoShop() {
  const demo = useContext(DemoContext);
  if (!demo) throw new Error('Demo shop provider is missing');
  return demo;
}
