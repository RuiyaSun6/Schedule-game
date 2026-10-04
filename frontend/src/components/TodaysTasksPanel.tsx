import type { Quest } from '../types';
import type { QuestCompletionProps } from './QuestList';

export default function TodaysTasksPanel({ quests, onComplete, completingId, errors, notice }: QuestCompletionProps & { quests: Quest[] }) {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  // Match Calendar's current scheduling rule: undated accepted quests belong to today.
  const tasks = quests.filter((quest) => (quest.scheduledDate ?? today) === today)
    .sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'));

  return <section className="today-tasks-panel pixel-panel" aria-labelledby="today-tasks-title">
    <h2 id="today-tasks-title">TODAY'S TASKS</h2>
    {tasks.length === 0 ? <div className="today-tasks-empty">
      <p>No tasks yet.</p><p>Use the computer to plan your day.</p>
    </div> : <ul className="today-tasks-list" tabIndex={0} aria-label="Today's accepted tasks">
      {tasks.map((quest) => <li key={quest.id} className={quest.completed ? 'today-task-completed' : ''}>
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
