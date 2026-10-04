import type { Quest } from '../types';
import PixelButton from './PixelButton';

interface QuestCardProps { quest: Quest; busy: boolean; completing: boolean; onComplete: () => void; error?: string; }

export default function QuestCard({ quest, busy, completing, onComplete, error }: QuestCardProps) {
  return <article className={`quest-preview pixel-panel ${quest.completed ? 'quest-completed' : ''}`}>
    <h2>{quest.title}</h2>
    <p className="quest-meta">{quest.category} · {quest.difficulty} · {quest.estimatedMinutes} min</p>
    <p className="quest-rewards">✦ {quest.xpReward} XP · 🪙 {quest.coinReward} coins</p>
    {quest.completed ? <p className="quest-completed-label">✓ COMPLETED</p> :
      <PixelButton aria-busy={completing} disabled={busy} onClick={onComplete}>{completing ? 'COMPLETING…' : 'COMPLETE QUEST'}</PixelButton>}
    {error && <p className="planner-error" role="alert">{error}</p>}
  </article>;
}
