import { useState } from 'react';
import type { Quest } from '../types';
import QuestList, { type QuestCompletionProps } from './QuestList';
import { QUEST_GROUPS, questGroup, type QuestGroup } from '../services/questGroups';
import './QuestBoard.css';

const COMPLETED_PAGE = 10;
const GROUP_ICON: Record<QuestGroup, string> = { Study: '✎', Fitness: '♥', Chores: '⌂', Other: '✦' };

// The computer's Quests screen: status tabs (In progress / Completed) with counts, a category
// filter row, newest-first order, and only the latest completed quests until "Show more".
// The quests array arrives oldest-first (creation order), so reversing it gives newest-first.
export default function QuestBoard({ quests, ...completion }: QuestCompletionProps & { quests: Quest[] }) {
  const [status, setStatus] = useState<'active' | 'completed'>('active');
  const [group, setGroup] = useState<QuestGroup | 'All'>('All');
  const [completedShown, setCompletedShown] = useState(COMPLETED_PAGE);

  const newestFirst = [...quests].reverse();
  const active = newestFirst.filter((quest) => !quest.completed);
  const completed = newestFirst.filter((quest) => quest.completed);
  const inStatus = status === 'active' ? active : completed;
  const filtered = group === 'All' ? inStatus : inStatus.filter((quest) => questGroup(quest) === group);
  const visible = status === 'completed' ? filtered.slice(0, completedShown) : filtered;
  const hidden = filtered.length - visible.length;

  const badge = (quest: Quest) => {
    const g = questGroup(quest);
    return <span className={`quest-group-tag quest-group-${g.toLowerCase()}`}><span aria-hidden="true">{GROUP_ICON[g]}</span> {g}</span>;
  };

  return <div className="quest-board">
    <div className="quest-board-status" role="tablist" aria-label="Quest status">
      {([['active', 'IN PROGRESS', active.length], ['completed', 'COMPLETED', completed.length]] as const).map(([id, label, count]) =>
        <button key={id} type="button" role="tab" aria-selected={status === id} className="quest-board-tab"
          onClick={() => { setStatus(id); setCompletedShown(COMPLETED_PAGE); }}>{label} ({count})</button>)}
    </div>
    <div className="quest-board-filters" aria-label="Filter by category">
      {(['All', ...QUEST_GROUPS] as const).map((name) => {
        const count = name === 'All' ? inStatus.length : inStatus.filter((quest) => questGroup(quest) === name).length;
        return <button key={name} type="button" aria-pressed={group === name} className="quest-board-filter"
          onClick={() => { setGroup(name); setCompletedShown(COMPLETED_PAGE); }}>{name} <small>{count}</small></button>;
      })}
    </div>
    <div className="quest-board-list" tabIndex={0} aria-label={`${status === 'active' ? 'In-progress' : 'Completed'} quests`}>
      <QuestList quests={visible} {...completion} badgeFor={badge}
        emptyText={status === 'active' ? (group === 'All' ? 'No quests in progress. Plan your day in AI PLAN.' : `No ${group} quests in progress.`)
          : (group === 'All' ? 'No completed quests yet.' : `No completed ${group} quests yet.`)} />
      {hidden > 0 && <button type="button" className="quest-board-more" onClick={() => setCompletedShown((n) => n + COMPLETED_PAGE)}>
        SHOW MORE ({hidden} older)
      </button>}
    </div>
  </div>;
}
