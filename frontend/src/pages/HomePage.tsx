import { Link } from 'react-router-dom';
import { useState } from 'react';
import GameTopBar from '../components/GameTopBar';
import PixelButton from '../components/PixelButton';
import PixelModal from '../components/PixelModal';
import DailyPlanner from '../components/DailyPlanner';
import Backpack from '../components/Backpack';
import { useDemoShop } from '../services/DemoShopContext';
import { getFurnitureVariant, withShopAsset } from '../data/shopAssets';
import { useCatalog } from '../services/useCatalog';
import { usePlayer } from '../services/PlayerContext';
import { useRoomPlacement } from '../services/RoomPlacementContext';
import { getCatalogItem, mockItems } from '../services/shop';
import type { Quest, Item } from '../types';
import MonthlyCalendar from '../components/MonthlyCalendar';
import TodaysTasksPanel from '../components/TodaysTasksPanel';
import QuestList, { type QuestCompletionProps } from '../components/QuestList';
import HomeScene from '../scenes/HomeScene';

interface HomePageProps extends QuestCompletionProps {
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

export default function HomePage({ hasSeenTutorial, onCompleteTutorial, onAcceptQuest, acceptedCount, quests, onComplete, completingId, errors, notice }: HomePageProps) {
  const catalog = useCatalog();
  const demo = useDemoShop();
  const player = usePlayer();
  const room = useRoomPlacement();
  const [backpackOpen, setBackpackOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const roomItems: Item[] = [...new Set([...(player.ownedItems ?? []), ...Object.keys(demo.quantities)])].map((id) => getFurnitureVariant(id) ?? catalog.items.find((item) => item.id === id) ?? getCatalogItem(id) ?? mockItems.find((item) => item.id === id) ?? { id, name: id, type: 'furniture' as const, price: 0, asset: '' }).map(withShopAsset);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'plan' | 'quests' | 'calendar'>('plan');
  const completion = { onComplete, completingId, errors, notice };

  return (
    <section className="home-game" aria-label="Your bedroom">
      <HomeScene onOpenComputer={() => setOpen(true)} items={roomItems} editing={editing} onEditingChange={setEditing} />
      <div className="home-player-tasks-hud">
        <GameTopBar />
        <TodaysTasksPanel quests={quests} {...completion} />
      </div>
      <Link className="home-shop-shortcut pixel-panel" to="/shop" aria-label="Open Shop" title="Shop">
        <svg viewBox="40 28 16 16" width="32" height="32" aria-hidden="true" className="asset-sprite">
          <image href={`${import.meta.env.BASE_URL}assets/interior%20full/furniture/boxes.png`} width="448" height="112" />
        </svg>
      </Link>
      <button type="button" className="home-backpack-shortcut pixel-panel" onClick={() => setBackpackOpen(true)} aria-label="Open Backpack" title="Backpack">
        <svg width="30" height="32" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
          <path fill="#75624c" d="M5 1h6v3h2v2h1v9H2V6h1V4h2z" />
          <path fill="#fff8e5" d="M6 2h4v2H6z" />
          <path fill="#9caf84" d="M4 5h8v8H4z" />
          <path fill="#637c4e" d="M5 9h6v4H5z" />
          <path fill="#edcd74" d="M7 8h2v2H7z" />
        </svg>
      </button>
      <PixelModal open={backpackOpen} onClose={() => setBackpackOpen(false)} titleId="backpack-title">
        <Backpack items={roomItems} loading={catalog.loading} error={catalog.error} onRetry={catalog.retry} onPlace={(id) => { room.placeItem(id); setBackpackOpen(false); setEditing(true); }} />
      </PixelModal>
      <div className="room-caption"><span>HOME · YOUR FIRST LITTLE SPACE</span><p>A new beginning. Make yourself at home.</p></div>
      <PixelModal open={open} onClose={() => setOpen(false)} titleId={hasSeenTutorial && activeTab !== 'plan' ? `${activeTab}-screen-title` : 'computer-screen-title'}>
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
            <div className="computer-tabs" role="tablist" aria-label="Computer sections">
              {(['plan', 'quests', 'calendar'] as const).map((tab) => <button key={tab} type="button" className="computer-tab"
                id={`tab-${tab}`} role="tab" aria-selected={activeTab === tab} aria-controls={`panel-${tab}`} tabIndex={activeTab === tab ? 0 : -1}
                onKeyDown={(event) => {
                  const tabs = ['plan', 'quests', 'calendar'] as const;
                  const index = tabs.indexOf(tab);
                  const next = event.key === 'ArrowRight' ? tabs[(index + 1) % 3] : event.key === 'ArrowLeft' ? tabs[(index + 2) % 3] : event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[2] : null;
                  if (next) { event.preventDefault(); setActiveTab(next); document.getElementById(`tab-${next}`)?.focus(); }
                }} onClick={() => setActiveTab(tab)}>{tab === 'plan' ? 'PLANNER' : tab.toUpperCase()}</button>)}
            </div>
            <div className="computer-tab-panel" id="panel-plan" role="tabpanel" aria-labelledby="tab-plan" hidden={activeTab !== 'plan'}>
              <DailyPlanner onAccept={onAcceptQuest} acceptedCount={acceptedCount} />
            </div>
            <div className="computer-tab-panel computer-view" id="panel-quests" role="tabpanel" aria-labelledby="tab-quests" hidden={activeTab !== 'quests'}>
              <h2 id="quests-screen-title">TODAY’S QUESTS</h2>
              <QuestList quests={quests} {...completion} />
            </div>
            <div className="computer-tab-panel computer-view" id="panel-calendar" role="tabpanel" aria-labelledby="tab-calendar" hidden={activeTab !== 'calendar'}>
              <h2 id="calendar-screen-title">CALENDAR</h2>
              <MonthlyCalendar quests={quests} {...completion} />
            </div>
          </>
        )}
      </PixelModal>
    </section>
  );
}
