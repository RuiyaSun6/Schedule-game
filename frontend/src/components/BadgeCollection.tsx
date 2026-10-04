import { useState } from 'react';
import type { HabitBoard } from '../types';
import { collectBadges } from '../services/badgeCollection';
import './BadgeCollection.css';

export default function BadgeCollection({ board }: { board: HabitBoard }) {
  const badges = collectBadges(board);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = badges.find((badge) => badge.id === selectedId) ?? badges[0];
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const reward = [selected.reward.xp && `${selected.reward.xp} XP`, selected.reward.coins && `${selected.reward.coins} coins`,
    selected.reward.itemName].filter(Boolean).join(' · ');
  return <section className="badge-collection" aria-labelledby="badge-collection-title">
    <div className="badge-collection-heading">
      <div><span className="eyebrow">YOUR ACHIEVEMENT WALL</span><h3 id="badge-collection-title">MY BADGES</h3></div>
      <span className="badge-count">{earnedCount} / {badges.length} EARNED</span>
    </div>
    <div className="badge-grid">{badges.map((badge) => <button key={badge.id} type="button"
      className={`badge-tile badge-${badge.rarity} badge-${badge.id.replace(':', '-')}${badge.earned ? ' is-earned' : ' is-locked'}${selected.id === badge.id ? ' is-selected' : ''}`}
      aria-pressed={selected.id === badge.id} aria-label={`${badge.name}, ${badge.earned ? 'earned' : 'locked'}, ${badge.rarity} badge`}
      onClick={() => setSelectedId(badge.id)}>
      <span className="badge-medallion" aria-hidden="true"><span className="badge-symbol">{badge.icon}</span></span>
      <span className="badge-tile-name">{badge.name}</span>
      {!badge.earned && <span className="badge-tile-requirement">{badge.description}</span>}
      <span className="badge-tile-status">{badge.earned ? '✓ EARNED' : '🔒 LOCKED'}</span>
    </button>)}</div>
    <aside className={`badge-detail badge-${selected.rarity} badge-${selected.id.replace(':', '-')}`} aria-live="polite" aria-label={`${selected.name} badge details`}>
      <div className="badge-detail-icon" aria-hidden="true">{selected.icon}</div>
      <div>
        <h4>{selected.name}</h4>
        <strong>{selected.rarity.toUpperCase()} BADGE</strong>
        <p>{selected.description}</p>
        <p>Status: <b>{selected.earned ? 'EARNED' : 'LOCKED'}</b></p>
        {!selected.earned && <p>Progress: <b>{selected.progress} / {selected.required} {selected.unit}</b>{selected.ready ? ' · Ready to claim in the reward tab' : ''}</p>}
        {selected.earnedFrom.length > 0 && <p>Earned from: {selected.earnedFrom.join(', ')}</p>}
        <p>Reward originally received: <b>{reward || 'Badge only'}</b></p>
      </div>
    </aside>
  </section>;
}
