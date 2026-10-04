import { useEffect, useRef, useState } from 'react';
import type { Quest } from '../types';
import type { QuestCompletionProps } from './QuestList';

// How long a just-completed task stays to fade out (matches .today-task-leaving in index.css).
const FADE_MS = 320;

// Today's unfinished tasks only. Completed quests stay saved and appear under COMPLETED on the computer.
export default function TodaysTasksPanel({ quests, onComplete, completingId, errors, notice }: QuestCompletionProps & { quests: Quest[] }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  // Match Calendar's current scheduling rule: undated accepted quests belong to today.
  const todays = quests.filter((quest) => (quest.scheduledDate ?? today) === today);

  // A task completed here fades out briefly instead of vanishing. open: tasks shown as unfinished on
  // the previous render (so the render where one turns completed still includes it); fading: ids
  // in their fade-out.
  const open = useRef(new Set<string>());
  const [fading, setFading] = useState<ReadonlySet<string>>(() => new Set());
  const timers = useRef<number[]>([]);
  useEffect(() => {
    const done = todays.filter((quest) => quest.completed && open.current.has(quest.id)).map((quest) => quest.id);
    open.current = new Set(todays.filter((quest) => !quest.completed).map((quest) => quest.id));
    if (done.length === 0) return;
    setFading((current) => new Set([...current, ...done]));
    timers.current.push(window.setTimeout(() => setFading((current) => new Set([...current].filter((id) => !done.includes(id)))), FADE_MS));
  });
  useEffect(() => () => timers.current.forEach((timer) => clearTimeout(timer)), []);

  const tasks = todays.filter((quest) => !quest.completed || fading.has(quest.id) || open.current.has(quest.id))
    .sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'));

  return <section className="today-tasks-panel pixel-panel" aria-labelledby="today-tasks-title">
    <h2 id="today-tasks-title">TODAY'S TASKS</h2>
    {tasks.length === 0 ? <div className="today-tasks-empty">
      {todays.length > 0 ? <><p>All done for today! 🎉</p><p>Plan more on the computer anytime.</p></>
        : <><p>No tasks yet.</p><p>Use the computer to plan your day.</p></>}
    </div> : <ul className="today-tasks-list" tabIndex={0} aria-label="Today's unfinished tasks">
      {tasks.map((quest) => <li key={quest.id} className={quest.completed ? 'today-task-completed today-task-leaving' : ''}>
        <button type="button" className="today-task-check" disabled={quest.completed || completingId !== null}
          aria-label={quest.completed ? `${quest.title} completed` : `Complete ${quest.title}`}
          aria-busy={completingId === quest.id} onClick={() => onComplete(quest)}>
          {quest.completed ? '✓' : completingId === quest.id ? '…' : '○'}
        </button>
        <div><span className="today-task-title">{quest.title}</span>
          <small>{quest.estimatedMinutes} min · {quest.category}</small>
          {errors[quest.id] && <small className="today-task-error" role="alert">{errors[quest.id]}</small>}
        </div>
      </li>)}
    </ul>}
    <span className="today-tasks-status" role="status">{notice}</span>
  </section>;
}
