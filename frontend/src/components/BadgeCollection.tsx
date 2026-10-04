import { useState } from 'react';
import type { HabitBoard } from '../types';
import { collectBadges } from '../services/badgeCollection';
import BadgeIcon from './BadgeIcon';
import PixelButton from './PixelButton';
import './BadgeCollection.css';

export default function BadgeCollection({ board, onClaim, busy }: { board: HabitBoard; onClaim: (id: string) => void; busy: boolean }) {
  const badges = collectBadges(board);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = badges.find((badge) => badge.id === selectedId) ?? badges[0];
  const selectedClaimId = selected.claimId;
  const earnedCount = badges.filter((badge) => badge.state === 'claimed').length;
  const reward = [selected.reward.xp && `${selected.reward.xp} XP`, selected.reward.coins && `${selected.reward.coins} coins`,
    selected.reward.itemName].filter(Boolean).join(' · ');
  return <section className="badge-collection" aria-labelledby="badge-collection-title">
    <div className="badge-collection-heading">
      <div><span className="eyebrow">YOUR ACHIEVEMENT WALL</span><h3 id="badge-collection-title">MY BADGES</h3></div>
      <span className="badge-count">{earnedCount} / {badges.length} EARNED</span>
    </div>
    <div className="badge-grid">{badges.map((badge) => <button key={badge.id} type="button"
      className={`badge-tile badge-${badge.rarity} badge-${badge.id.replace(':', '-')} is-${badge.state === 'claimed' ? 'earned' : badge.state}${selected.id === badge.id ? ' is-selected' : ''}`}
      aria-pressed={selected.id === badge.id} aria-label={`${badge.name}, ${badge.state === 'claimed' ? 'earned' : badge.state === 'ready' ? 'ready to claim' : 'locked'}, ${badge.rarity} badge`}
      onClick={() => setSelectedId(badge.id)}>
      <span className="badge-medallion" aria-hidden="true"><BadgeIcon name={badge.icon} /></span>
      <span className="badge-tile-name">{badge.name}</span>
      {badge.state !== 'claimed' && <span className="badge-tile-requirement">{badge.description}</span>}
      <span className="badge-tile-status">{badge.state === 'claimed' ? '✓ EARNED' : badge.state === 'ready' ? '✦ READY TO CLAIM' : '🔒 LOCKED'}</span>
    </button>)}</div>
    <aside className={`badge-detail badge-${selected.rarity} badge-${selected.id.replace(':', '-')} is-${selected.state === 'claimed' ? 'earned' : selected.state}`} aria-live="polite" aria-label={`${selected.name} badge details`}>
      <div className="badge-detail-icon" aria-hidden="true"><BadgeIcon name={selected.icon} /></div>
      <div>
        <h4>{selected.name}</h4>
        <strong>{selected.rarity.toUpperCase()} BADGE</strong>
        <p>{selected.description}</p>
        <p>Status: <b>{selected.state === 'claimed' ? '✓ EARNED' : selected.state === 'ready' ? 'READY TO CLAIM' : 'LOCKED'}</b></p>
        {selected.state !== 'claimed' && <p>Progress: <b>{selected.progress} / {selected.required} {selected.unit}</b></p>}
        {selectedClaimId && <PixelButton disabled={busy} onClick={() => onClaim(selectedClaimId)}>CLAIM REWARD</PixelButton>}
        {selected.earnedFrom.length > 0 && <p>Earned from: {selected.earnedFrom.join(', ')}</p>}
        <p>Reward originally received: <b>{reward || 'Badge only'}</b></p>
      </div>
    </aside>
  </section>;
}
