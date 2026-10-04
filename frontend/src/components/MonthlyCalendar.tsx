import { useState } from 'react';
import type { Quest } from '../types';
import QuestList, { type QuestCompletionProps } from './QuestList';
import { questsByDate } from '../services/calendarSchedule';

interface MonthlyCalendarProps extends QuestCompletionProps { quests: Quest[]; }
function localDateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export default function MonthlyCalendar({ quests, ...completion }: MonthlyCalendarProps) {
  const today = localDateKey();
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const title = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = month.getDay();
  const cellCount = Math.ceil((offset + days) / 7) * 7;
  const byDate = questsByDate(quests, today);
  function navigate(delta: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + delta, 1);
    setMonth(next);
    setSelected(localDateKey(next));
  }
  return <section className="monthly-calendar" aria-label="Monthly quest calendar">
    <header className="calendar-toolbar">
      <h3 aria-live="polite">{title.toUpperCase()}</h3>
      <div>
        <button onClick={() => navigate(-1)} aria-label="Previous month">‹</button>
        <button onClick={() => { const now = new Date(); setMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelected(localDateKey(now)); }}>Today</button>
        <button onClick={() => navigate(1)} aria-label="Next month">›</button>
      </div>
    </header>
    <div className="calendar-grid">
      {weekdays.map((day) => <span className="calendar-weekday" key={day}>{day}</span>)}
      {Array.from({ length: cellCount }, (_, index) => {
        const day = index - offset + 1;
        if (day < 1 || day > days) return <div className="calendar-blank" key={index} aria-hidden="true" />;
        const date = localDateKey(new Date(month.getFullYear(), month.getMonth(), day));
        const items = byDate.get(date) ?? [];
        return <button key={index} className={`calendar-day ${date === today ? 'calendar-today' : ''}`}
          aria-current={date === today ? 'date' : undefined} aria-pressed={date === selected}
          aria-label={`${month.toLocaleDateString(undefined, { month: 'long' })} ${day}, ${month.getFullYear()}, ${items.length} quests`}
          onClick={() => setSelected(date)}>
          <span className="calendar-date">{day}</span>
          {items.slice(0, 2).map((quest) => <span key={quest.id} title={quest.title} className={`calendar-label ${quest.completed ? 'calendar-label-completed' : ''}`}>{quest.completed ? '✓ ' : ''}{quest.title}</span>)}
          {items.length > 2 && <span className="calendar-more">+{items.length - 2} more</span>}
        </button>;
      })}
    </div>
    <section className="calendar-detail" aria-labelledby="calendar-detail-title">
      <h3 id="calendar-detail-title">{new Date(`${selected}T12:00:00`).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}</h3>
      {(byDate.get(selected)?.length ?? 0) === 0 ? <p>No quests scheduled for this day.</p> : <QuestList quests={byDate.get(selected) ?? []} showScheduleTimes {...completion} />}
    </section>
  </section>;
}
