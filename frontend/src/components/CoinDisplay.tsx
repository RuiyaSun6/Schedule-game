import { useEffect, useRef, useState } from 'react';
import './ShopCard.css';

interface CoinDisplayProps {
  coins: number;
}

export default function CoinDisplay({ coins }: CoinDisplayProps) {
  // Show the change (e.g. "−20") floating up whenever the balance moves.
  const previous = useRef(coins);
  const [delta, setDelta] = useState<{ amount: number; key: number } | null>(null);
  useEffect(() => {
    const amount = coins - previous.current;
    previous.current = coins;
    if (amount === 0) return;
    setDelta({ amount, key: Date.now() });
    const timeout = setTimeout(() => setDelta(null), 1400);
    return () => clearTimeout(timeout);
  }, [coins]);
  return (
    <div className="coin-display" aria-label={`${coins} coins`}>
      <span className="coin-icon" aria-hidden="true">✦</span>
      <span key={coins} className="stat-update">{coins}<small>coins</small></span>
      {delta && <span key={delta.key} className={`coin-delta ${delta.amount < 0 ? 'is-spend' : 'is-earn'}`} aria-hidden="true">
        {delta.amount < 0 ? `−${-delta.amount}` : `+${delta.amount}`}
      </span>}
    </div>
  );
}
