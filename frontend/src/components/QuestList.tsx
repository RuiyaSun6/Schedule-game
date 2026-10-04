import type { ReactNode } from 'react';
import type { Quest } from '../types';
import QuestCard from './QuestCard';

export interface QuestCompletionProps {
  onComplete: (quest: Quest) => void;
  completingId: string | null;
  errors: Record<string, string>;
  notice: string;
}
export default function QuestList({ quests, onComplete, completingId, errors, notice, showScheduleTimes = false, badgeFor, emptyText = 'No quests yet. Accept a quest in the Planner to start.' }: QuestCompletionProps & {
  quests: Quest[];
  showScheduleTimes?: boolean;
  /** Optional small label per quest (the quest board uses it for category tags). */
  badgeFor?: (quest: Quest) => ReactNode;
  emptyText?: string;
}) {
  return <>
    <p role="status" className="planner-notice">{notice}</p>
    {quests.length === 0 ? <p>{emptyText}</p> :
      <div className="quest-previews">{quests.map((quest) => <div key={quest.id}>
        {showScheduleTimes && (quest.startTime || quest.endTime) && <p className="calendar-quest-time">
          {quest.startTime && quest.endTime ? `${quest.startTime} - ${quest.endTime}` : quest.startTime ? `Starts ${quest.startTime}` : `Ends ${quest.endTime}`}
        </p>}
        <QuestCard quest={quest}
        busy={completingId !== null} completing={completingId === quest.id} error={errors[quest.id]}
        onComplete={() => onComplete(quest)} badge={badgeFor?.(quest)} /></div>)}</div>}
  </>;
}
