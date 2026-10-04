import { useRef, useState } from 'react';
import type { HabitBoard, HabitBoardEntry } from '../types';
import { claimHabitReward } from '../services/api';
import { usePlayerActions } from '../services/PlayerContext';
import PixelButton from './PixelButton';
import BadgeCollection from './BadgeCollection';
import './Habits.css';

function RewardCard({ entry, onClaim, busy }: { entry: HabitBoardEntry; onClaim: (id: string) => void; busy: boolean }) {
  const reward = [entry.reward.xp && `${entry.reward.xp} XP`, entry.reward.coins && `${entry.reward.coins} coins`,
    entry.reward.badge && `${entry.reward.badge} badge`, entry.reward.itemName].filter(Boolean).join(' · ');
  return <article className={`reward-entry ${entry.state}`}>
    <h4>{entry.name}</h4>
    <p>{entry.description}</p>
    <p><strong>{entry.progress} / {entry.required}</strong> {entry.unit}</p>
    <p>Reward: {reward}</p>
    <span className="reward-state">{entry.state === 'claimed' ? '✓ CLAIMED' : entry.state === 'ready' ? '✦ READY TO CLAIM' : '🔒 LOCKED'}</span>
    {entry.state === 'ready' && <div><PixelButton disabled={busy} onClick={() => onClaim(entry.id)}>CLAIM REWARD</PixelButton></div>}
  </article>;
}

export default function RewardBoard({ board, onBoardChange, loadError, onRetry }: { board: HabitBoard | null; onBoardChange: (board: HabitBoard) => void; loadError: string; onRetry: () => void }) {
  const [tab, setTab] = useState<'milestones' | 'achievements' | 'badges'>('milestones');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const actions = usePlayerActions();
  async function claim(id: string) {
    if (pending.current || !actions.beginMutation()) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = await claimHabitReward(id);
      onBoardChange(result.board);
      actions.updatePlayer(result.player);
      setNotice('Reward claimed and added to your player and inventory.');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not claim reward.'); }
    finally { pending.current = false; setBusy(false); actions.endMutation(); }
  }
  return <div className="reward-board-content">
    <h2 id="reward-board-title">REWARD BOARD</h2>
    <p>Every small step adds to your story. Claim rewards when they are ready.</p>
    <div className="reward-board-tabs" role="tablist" aria-label="Reward sections">
      <button type="button" role="tab" aria-selected={tab === 'milestones'} onClick={() => setTab('milestones')}>HABIT MILESTONES</button>
      <button type="button" role="tab" aria-selected={tab === 'achievements'} onClick={() => setTab('achievements')}>ACHIEVEMENTS</button>
      <button type="button" role="tab" aria-selected={tab === 'badges'} onClick={() => setTab('badges')}>MY BADGES</button>
    </div>
    {error && <p role="alert" className="planner-error">{error}</p>}
    {notice && <p role="status" className="planner-notice">{notice}</p>}
    {loadError && <div role="alert"><p>{loadError}</p><PixelButton onClick={onRetry}>RETRY</PixelButton></div>}
    {!board && !loadError && <p role="status">Loading your rewards…</p>}
    {tab === 'milestones' && board && (board.milestones.length
      ? board.milestones.map((group) => <section className="reward-group" key={group.habitId}>
        <h3>{group.title}</h3><div className="reward-list">{group.entries.map((entry) => <RewardCard key={entry.id} entry={entry} onClaim={(id) => void claim(id)} busy={busy} />)}</div>
      </section>) : <p>Create a habit in the Planner to begin earning milestones.</p>)}
    {tab === 'achievements' && board && <div className="reward-list">{board.achievements.map((entry) => <RewardCard key={entry.id} entry={entry} onClaim={(id) => void claim(id)} busy={busy} />)}</div>}
    {tab === 'badges' && board && <BadgeCollection board={board} />}
  </div>;
}
