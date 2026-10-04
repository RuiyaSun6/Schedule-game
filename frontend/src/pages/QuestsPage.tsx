import { Link } from 'react-router-dom';
import type { Quest } from '../types';
import QuestCard from '../components/QuestCard';
import GameTopBar from '../components/GameTopBar';

interface QuestsPageProps {
  quests: Quest[];
  onComplete: (quest: Quest) => void;
  completingId: string | null;
  errors: Record<string, string>;
  notice: string;
}

export default function QuestsPage({ quests, onComplete, completingId, errors, notice }: QuestsPageProps) {
  return <section className="accepted-quests-page">
    <GameTopBar />
    <span className="eyebrow">YOUR LITTLE ADVENTURES</span>
    <h1>ALL QUESTS</h1>
    <p>Take them one step at a time.</p>
    <p role="status" className="planner-notice">{notice}</p>
    {quests.length === 0 ? <p>No quests yet. Open your bedroom computer to plan your day.</p> :
      <div className="quest-previews">{quests.map((quest) => <QuestCard key={quest.id} quest={quest}
        busy={completingId !== null} completing={completingId === quest.id} error={errors[quest.id]}
        onComplete={() => onComplete(quest)} />)}</div>}
    <Link className="accepted-quests-link" to="/home">← Back to bedroom</Link>
  </section>;
}
