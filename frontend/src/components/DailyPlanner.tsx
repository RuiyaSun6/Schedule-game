import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Quest } from '../types';
import { generateQuests } from '../services/api';
import { usePlayer } from '../services/PlayerContext';
import PixelButton from './PixelButton';
import QuestPreviewCard from './QuestPreviewCard';

interface DailyPlannerProps {
  onAccept: (quest: Quest) => void;
  acceptedCount: number;
}

export default function DailyPlanner({ onAccept, acceptedCount }: DailyPlannerProps) {
  const player = usePlayer();
  const [text, setText] = useState('');
  const [previews, setPreviews] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const mounted = useRef(true);
  const pending = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function generate() {
    if (pending.current) return;
    setError('');
    if (!text.trim()) { setError('Please enter at least one task for today.'); return; }
    pending.current = true;
    setLoading(true);
    setNotice('');
    try {
      const result = await generateQuests(player.id, text);
      if (!mounted.current) return;
      setPreviews(result.quests);
      setNotice('Your quests are ready. Make them your own.');
    } catch {
      if (mounted.current) setError('Something went wrong. Please try again.');
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  }

  return <div className="computer-view planner-view">
    <span className="eyebrow">ONE LITTLE STEP AT A TIME</span>
    <h2 id="computer-screen-title">DAILY PLANNER</h2>
    <form aria-busy={loading} onSubmit={(event) => { event.preventDefault(); void generate(); }}>
      <label htmlFor="daily-tasks">What do you need to do today?</label>
      <textarea id="daily-tasks" value={text} disabled={loading} onChange={(event) => setText(event.target.value)} placeholder="Finish my algorithms assignment tonight, work out for one hour, and clean my room." aria-describedby={error ? 'planner-error' : undefined} aria-invalid={!!error} />
      <PixelButton type="submit" aria-busy={loading} disabled={loading}>{loading ? 'CREATING QUESTS…' : 'GENERATE QUESTS'}</PixelButton>
    </form>
    {error && <p id="planner-error" className="planner-error" role="alert">{error}</p>}
    <p className="planner-notice" role="status">{loading ? 'Turning your day into little adventures…' : notice}</p>
    {previews.length > 0 && <section aria-label="Quest previews" className="quest-previews"><h3>YOUR QUEST PREVIEW</h3>
      {previews.map((quest) => <QuestPreviewCard key={quest.id} quest={quest}
        onEdit={(updated) => setPreviews((current) => current.map((q) => q.id === updated.id ? updated : q))}
        onDelete={() => setPreviews((current) => current.filter((q) => q.id !== quest.id))}
        onAccept={() => { onAccept(quest); setPreviews((current) => current.filter((q) => q.id !== quest.id)); setNotice(`Accepted “${quest.title}”.`); }} />)}
    </section>}
    {acceptedCount > 0 && <Link className="accepted-quests-link" to="/quests">View accepted quests ({acceptedCount}) →</Link>}
  </div>;
}
