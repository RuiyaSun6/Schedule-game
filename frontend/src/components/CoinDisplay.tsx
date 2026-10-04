interface CoinDisplayProps {
  coins: number;
}

export default function CoinDisplay({ coins }: CoinDisplayProps) {
  return (
    <div className="coin-display" aria-label={`${coins} coins`}>
      <span className="coin-icon" aria-hidden="true">✦</span>
      <span key={coins} className="stat-update">{coins}<small>coins</small></span>
    </div>
  );
}
