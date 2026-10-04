import { Link } from 'react-router-dom';
import { useState } from 'react';
import GameTopBar from '../components/GameTopBar';
import PixelButton from '../components/PixelButton';
import PixelModal from '../components/PixelModal';
import DailyPlanner from '../components/DailyPlanner';
import type { Quest } from '../types';
import HomeScene from '../scenes/HomeScene';

interface HomePageProps {
  hasSeenTutorial: boolean;
  onAcceptQuest: (quest: Quest) => void;
  acceptedCount: number;
  quests: Quest[];
  onCompleteTutorial: () => void;
}

const tutorialSteps = [
  { title: 'CREATE QUESTS', icon: '✎', text: "Tell LifeQuest what you need to do today. We'll turn your real-life tasks into quests." },
  { title: 'COMPLETE & EARN', icon: '✦', text: 'Complete quests to earn XP and coins.' },
  { title: 'GROW YOUR WORLD', icon: '⌂', text: 'Level up to make new places available to build. Use coins to build them and decorate your world.' },
];

export default function HomePage({ hasSeenTutorial, onCompleteTutorial, onAcceptQuest, acceptedCount, quests }: HomePageProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'calendar'>('plan');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const moveDay = (days: number) => {
    setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth(), current.getDate() + days, 12));
  };
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  }).format(selectedDate).toUpperCase();
  const dateValue = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const dayQuests = quests.filter((quest) => quest.scheduledDate === dateValue).sort((a, b) => {
    if (!a.startTime) return b.startTime ? 1 : 0;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <section className="home-game" aria-label="Your bedroom">
      <HomeScene onOpenComputer={() => setOpen(true)} />
      <GameTopBar />
      <div className="room-caption"><span>HOME · YOUR FIRST LITTLE SPACE</span><p>A new beginning. Make yourself at home.</p><div className="room-inventory-links"><Link to="/shop">Shop</Link><Link to="/wardrobe">Wardrobe</Link></div></div>
      <PixelModal open={open} onClose={() => setOpen(false)} titleId={hasSeenTutorial && activeTab === 'calendar' ? 'calendar-screen-title' : 'computer-screen-title'}>
        {!hasSeenTutorial ? (
          <div className="computer-view tutorial-view" key="tutorial">
            <span className="eyebrow">WELCOME, PLAYER</span>
            <h2 id="computer-screen-title">HOW LIFEQUEST WORKS</h2>
            <ol className="tutorial-steps">
              {tutorialSteps.map((step, index) => <li key={step.title}>
                <span className="step-icon" aria-hidden="true">{step.icon}</span>
                <div><h3>{index + 1}. {step.title}</h3><p>{step.text}</p></div>
              </li>)}
            </ol>
            <p className="tutorial-motto">Complete your real life.<br />Build your virtual life.</p>
            <PixelButton onClick={onCompleteTutorial}>LET’S START <span aria-hidden="true">→</span></PixelButton>
          </div>
        ) : (
          <>
            <div className="computer-tabs" aria-label="Computer sections">
              <button type="button" className="computer-tab" aria-pressed={activeTab === 'plan'} onClick={() => setActiveTab('plan')}>AI PLAN</button>
              <button type="button" className="computer-tab" aria-pressed={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')}>CALENDAR</button>
            </div>
            <div className="computer-tab-panel" hidden={activeTab !== 'plan'}>
              <DailyPlanner onAccept={onAcceptQuest} acceptedCount={acceptedCount} />
            </div>
            {activeTab === 'calendar' && <div className="computer-view calendar-view">
              <h2 id="calendar-screen-title">CALENDAR</h2>
              <p className="calendar-date" aria-live="polite"><time dateTime={dateValue}>{dateLabel}</time></p>
              <div className="calendar-controls">
                <button type="button" onClick={() => moveDay(-1)}>Previous Day</button>
                <button type="button" onClick={() => setSelectedDate(new Date())}>Today</button>
                <button type="button" onClick={() => moveDay(1)}>Next Day</button>
              </div>
              {dayQuests.length === 0 ? <p className="calendar-empty">No tasks scheduled for this day.</p> :
                <ul className="calendar-quests">
                  {dayQuests.map((quest) => <li className="pixel-panel" key={quest.id}>
                    {(quest.startTime || quest.endTime) && <p className="calendar-quest-time">
                      {quest.startTime && quest.endTime ? `${quest.startTime} - ${quest.endTime}` : quest.startTime ? `Starts ${quest.startTime}` : `Ends ${quest.endTime}`}
                    </p>}
                    <h3>{quest.title}</h3>
                    <span className="calendar-quest-status">{quest.completed ? 'Completed' : 'Incomplete'}</span>
                  </li>)}
                </ul>}
            </div>}
          </>
        )}
      </PixelModal>
    </section>
  );
}
