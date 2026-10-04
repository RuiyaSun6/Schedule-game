import { useState } from 'react';
import type { Quest } from '../types';
import PixelButton from './PixelButton';

interface QuestPreviewCardProps {
  quest: Quest;
  onEdit: (quest: Quest) => void;
  onDelete: () => void;
  onAccept: () => void;
}

export default function QuestPreviewCard({ quest, onEdit, onDelete, onAccept }: QuestPreviewCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(quest);
  return <article className="quest-preview pixel-panel">
    {editing ? <form onSubmit={(event) => { event.preventDefault(); onEdit({ ...draft, title: draft.title.trim(), category: draft.category.trim(), difficulty: draft.difficulty.trim() }); setEditing(false); }}>
      <div className="quest-edit-fields">
        {(['title', 'category', 'difficulty'] as const).map((field) => <label key={field}>{field}<input required value={draft[field]} onChange={(event) => setDraft({ ...draft, [field]: event.target.value })} /></label>)}
        {(['estimatedMinutes', 'xpReward', 'coinReward'] as const).map((field) => <label key={field}>{field === 'estimatedMinutes' ? 'Minutes' : field === 'xpReward' ? 'XP reward' : 'Coin reward'}<input type="number" min="0" step="1" required value={draft[field]} onChange={(event) => setDraft({ ...draft, [field]: Number(event.target.value) })} /></label>)}
      </div>
      <div className="quest-actions"><PixelButton type="submit" disabled={!draft.title.trim() || !draft.category.trim() || !draft.difficulty.trim()}>Save</PixelButton><PixelButton onClick={() => setEditing(false)}>Cancel</PixelButton></div>
    </form> : <>
      <h3>{quest.title}</h3>
      <p className="quest-meta">{quest.category} · {quest.difficulty} · {quest.estimatedMinutes} min</p>
      <p className="quest-rewards">✦ {quest.xpReward} XP <span>🪙 {quest.coinReward} coins</span></p>
      <div className="quest-actions">
        <PixelButton onClick={() => { setDraft(quest); setEditing(true); }}>Edit</PixelButton>
        <PixelButton onClick={onDelete}>Delete</PixelButton>
        <PixelButton onClick={onAccept}>Accept</PixelButton>
      </div>
    </>}
  </article>;
}
