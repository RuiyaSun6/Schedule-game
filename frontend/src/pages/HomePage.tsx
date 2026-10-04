import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorldBuildings } from '../hooks/useWorldBuildings';
import GameTopBar from '../components/GameTopBar';
import GameHudActions from '../components/GameHudActions';
import PixelModal from '../components/PixelModal';
import DailyPlanner from '../components/DailyPlanner';
import Backpack from '../components/Backpack';
import { useCatalog } from '../services/useCatalog';
import { useRoomPlacement } from '../services/RoomPlacementContext';
import { defaultFurnitureSpot } from '../services/furnitureLocation';
import type { Item, Quest } from '../types';
import MonthlyCalendar from '../components/MonthlyCalendar';
import TodaysTasksPanel from '../components/TodaysTasksPanel';
import type { QuestCompletionProps } from '../components/QuestList';
import QuestBoard from '../components/QuestBoard';
import HomeScene from '../scenes/HomeScene';

interface HomePageProps extends QuestCompletionProps {
  tutorialTab?: 'plan' | 'quests' | 'calendar';
  onAcceptQuest: (quest: Quest) => void;
  acceptedCount: number;
  quests: Quest[];
}

export default function HomePage({ tutorialTab, onAcceptQuest, acceptedCount, quests, onComplete, completingId, errors, notice }: HomePageProps) {
  const catalog = useCatalog();
  const buildings = useWorldBuildings();
  const [backpackOpen, setBackpackOpen] = useState(false);
  const room = useRoomPlacement();
  const sceneRef = useRef<HTMLElement>(null);
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'quests' | 'calendar'>('plan');
  const shownTab = tutorialTab ?? activeTab;
  const completion = { onComplete, completingId, errors, notice };

  function placeFromBackpack(item: Item) {
    const scene = sceneRef.current;
    const spot = defaultFurnitureSpot({ width: scene?.clientWidth ?? 360, height: scene?.clientHeight ?? 600 }, room.placed.filter((p) => p.locationId === 'home').length);
    room.placeItem(item.id, 'home', spot.x, spot.y, { stackable: item.stackable });
    setBackpackOpen(false);
    setEditing(true);
  }

  const computerContent = <>
    <div className="computer-tabs" role="tablist" aria-label="Computer sections">
      {(['plan', 'quests', 'calendar'] as const).map((tab) => <button key={tab} type="button" className="computer-tab"
        data-tutorial={tab === 'quests' || tab === 'calendar' ? tab : undefined}
        id={`tab-${tab}`} role="tab" aria-selected={shownTab === tab} aria-controls={`panel-${tab}`} tabIndex={shownTab === tab ? 0 : -1}
        onKeyDown={(event) => {
          const tabs = ['plan', 'quests', 'calendar'] as const;
          const index = tabs.indexOf(tab);
          const next = event.key === 'ArrowRight' ? tabs[(index + 1) % 3] : event.key === 'ArrowLeft' ? tabs[(index + 2) % 3] : event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[2] : null;
          if (next) { event.preventDefault(); setActiveTab(next); document.getElementById(`tab-${next}`)?.focus(); }
        }} onClick={() => setActiveTab(tab)}>{tab === 'plan' ? 'PLANNER' : tab.toUpperCase()}</button>)}
    </div>
    <div className="computer-tab-panel" id="panel-plan" role="tabpanel" aria-labelledby="tab-plan" hidden={shownTab !== 'plan'}>
      <DailyPlanner onAccept={onAcceptQuest} acceptedCount={acceptedCount} />
    </div>
    <div className="computer-tab-panel computer-view" id="panel-quests" role="tabpanel" aria-labelledby="tab-quests" hidden={shownTab !== 'quests'}>
      <h2 id="quests-screen-title">TODAY'S QUESTS</h2>
      <QuestBoard quests={quests} {...completion} />
    </div>
    <div className="computer-tab-panel computer-view" id="panel-calendar" role="tabpanel" aria-labelledby="tab-calendar" hidden={shownTab !== 'calendar'}>
      <h2 id="calendar-screen-title">CALENDAR</h2>
      <MonthlyCalendar quests={quests} {...completion} />
    </div>
  </>;

  return <section ref={sceneRef} className="home-game" aria-label="Your bedroom">
    <HomeScene onOpenComputer={() => setOpen(true)} items={catalog.items} editing={editing} onEditingChange={setEditing} />
    <div className="home-player-tasks-hud">
      <GameTopBar />
      <TodaysTasksPanel quests={quests} {...completion} />
    </div>
    <GameHudActions onOpenBackpack={() => setBackpackOpen(true)} />
    {buildings.level('home') >= 2 && <Link className="home-upstairs-link pixel-panel" to="/home/upstairs">↑ UPSTAIRS</Link>}
    <PixelModal open={backpackOpen} onClose={() => setBackpackOpen(false)} titleId="backpack-title">
      <Backpack items={catalog.items} loading={catalog.loading} error={catalog.error} onRetry={catalog.retry} locationId="home" onPlace={placeFromBackpack} />
    </PixelModal>
    <div className="room-caption"><span>HOME · YOUR FIRST LITTLE SPACE</span><p>A new beginning. Make yourself at home.</p></div>
    {tutorialTab ? <PixelModal open onClose={() => {}} titleId="computer-screen-title" inline>{computerContent}</PixelModal>
      : <PixelModal open={open} onClose={() => setOpen(false)} titleId={shownTab !== 'plan' ? `${shownTab}-screen-title` : 'computer-screen-title'}>{computerContent}</PixelModal>}
  </section>;
}
