import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Quest } from '../types';
import { ApiError, generateQuests } from '../services/api';
import { usePlayer } from '../services/PlayerContext';
import PixelButton from './PixelButton';
import QuestPreviewCard from './QuestPreviewCard';
import HabitPlanner from './HabitPlanner';

/** A message that says what actually went wrong instead of a generic failure. */
function generateErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Something unexpected went wrong while creating quests. Please try again.';
  switch (error.kind) {
    case 'timeout': return 'The AI is taking too long to answer right now. Please try again in a moment.';
    case 'network': return 'Network error: couldn’t reach the LifeQuest server. Check your connection and that the backend is running.';
    case 'rate-limit': return 'Too many requests right now. Please wait a minute, then try again.';
    case 'format': return 'The AI sent back quests in an unexpected format. Please try again.';
    default:
      // 4xx with a server explanation (e.g. text too long) is useful as-is.
      return error.status !== undefined && error.status < 500 ? error.message : `The server had a problem creating quests (error ${error.status}). Please try again.`;
  }
}

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
    if (!text.trim()) { setError('Please enter at least one task for this week.'); return; }
    pending.current = true;
    setLoading(true);
    setNotice('');
    try {
      const result = await generateQuests(player.id, text);
      if (!mounted.current) return;
      setPreviews(result.quests);
      setNotice('Your quests are ready. Make them your own.');
    } catch (error) {
      // Full details for debugging: the error, HTTP status, and the raw response body.
      console.error('[DailyPlanner] Generate Quests failed', {
        error,
        status: error instanceof ApiError ? error.status : undefined,
        kind: error instanceof ApiError ? error.kind : undefined,
        responseBody: error instanceof ApiError ? error.details.body : undefined,
      });
      if (mounted.current) setError(generateErrorMessage(error));
    } finally {
      pending.current = false;
      if (mounted.current) setLoading(false);
    }
  }

  return <div className="computer-view planner-view">
    <span className="eyebrow">ONE LITTLE STEP AT A TIME</span>
    <h2 id="computer-screen-title">WEEKLY PLAN</h2>
    <form aria-busy={loading} onSubmit={(event) => { event.preventDefault(); void generate(); }}>
      <label htmlFor="daily-tasks">What do you need to do this week?</label>
      <textarea id="daily-tasks" data-tutorial="weekly-plan" value={text} disabled={loading} onChange={(event) => setText(event.target.value)} placeholder="Finish my algorithms assignment by Friday, go to the gym on Tuesday, and study statistics this weekend." aria-describedby={error ? 'planner-error' : undefined} aria-invalid={!!error} />
      <PixelButton type="submit" data-tutorial="generate-quests" aria-busy={loading} disabled={loading}>{loading ? 'CREATING QUESTS…' : 'GENERATE QUESTS'}</PixelButton>
    </form>
    {error && <p id="planner-error" className="planner-error" role="alert">{error}</p>}
    <p className="planner-notice" role="status">{loading ? 'Turning your week into little adventures…' : notice}</p>
    {previews.length > 0 && <section aria-label="Quest previews" className="quest-previews"><h3>YOUR QUEST PREVIEW</h3>
      {previews.map((quest) => <QuestPreviewCard key={quest.id} quest={quest}
        onEdit={(updated) => setPreviews((current) => current.map((q) => q.id === updated.id ? updated : q))}
        onDelete={() => setPreviews((current) => current.filter((q) => q.id !== quest.id))}
        onAccept={() => { onAccept(quest); setPreviews((current) => current.filter((q) => q.id !== quest.id)); setNotice(`Accepted “${quest.title}”.`); }} />)}
    </section>}
    {acceptedCount > 0 && <Link className="accepted-quests-link" to="/quests">View accepted quests ({acceptedCount}) →</Link>}
    <HabitPlanner />
  </div>;
}
