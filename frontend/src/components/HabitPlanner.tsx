import { useEffect, useRef, useState } from 'react';
import type { HabitBoard } from '../types';
import { checkInHabit, createHabit, getHabitBoard } from '../services/api';
import PixelButton from './PixelButton';
import './Habits.css';

export default function HabitPlanner() {
  const [board, setBoard] = useState<HabitBoard | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    getHabitBoard().then((loaded) => { if (active) setBoard(loaded); })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Could not load habits.'); });
    return () => { active = false; };
  }, []);
  async function run(action: () => Promise<HabitBoard>, success: string): Promise<boolean> {
    if (pending.current) return false;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try { setBoard(await action()); setNotice(success); return true; }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Habit update failed.'); return false; }
    finally { pending.current = false; setBusy(false); }
  }
  return <section className="habit-planner pixel-panel" aria-labelledby="habit-planner-title" data-tutorial="long-term-habits">
    <span className="eyebrow">GROW AT YOUR OWN PACE</span>
    <h2 id="habit-planner-title">LONG-TERM HABITS</h2>
    <form onSubmit={(event) => { event.preventDefault(); void run(() => createHabit(text), 'Habit created. Keep showing up!').then((ok) => { if (ok) setText(''); }); }}>
      <label htmlFor="habit-input">What habit do you want to build?</label>
      <input id="habit-input" value={text} onChange={(event) => setText(event.target.value)} maxLength={200}
        placeholder="Go to the gym 3 times a week" disabled={busy} />
      <p className="habit-hint">Try “Read for 30 minutes every day” or “Study math 5 days a week”.</p>
      <PixelButton type="submit" disabled={busy || !text.trim()}>CREATE HABIT</PixelButton>
    </form>
    {error && <p role="alert" className="planner-error">{error}</p>}
    {notice && <p role="status" className="planner-notice">{notice}</p>}
    <h3>ACTIVE HABITS</h3>
    {!board && !error && <p role="status">Loading habits…</p>}
    {board?.habits.length === 0 && <p>Your first habit starts here. Small steps count.</p>}
    <div className="habit-active-list">{board?.habits.map((habit) => <article className="habit-active-card" key={habit.id}>
      <h4>{habit.title}</h4>
      <p>This week: <strong>{habit.currentProgress} / {habit.periodTarget}</strong> days
        {habit.period === 'weekly' ? ` · ${habit.targetCount} per week` : ' · every day'}</p>
      <p>{habit.totalCompletions} total check-ins · {habit.successfulWeeks} successful weeks</p>
      {habit.currentStreak > 1 && <p>🔥 {habit.currentStreak} day streak</p>}
      <PixelButton disabled={busy || habit.checkedToday} onClick={() => void run(() => checkInHabit(habit.id), `${habit.title} checked in for today.`)}>
        {habit.checkedToday ? 'COMPLETED TODAY' : 'COMPLETE TODAY'}
      </PixelButton>
    </article>)}</div>
  </section>;
}
