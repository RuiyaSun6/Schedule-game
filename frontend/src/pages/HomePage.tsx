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
  onCompleteTutorial: () => void;
}

const tutorialSteps = [
  { title: 'CREATE QUESTS', icon: '✎', text: "Tell LifeQuest what you need to do today. We'll turn your real-life tasks into quests." },
  { title: 'COMPLETE & EARN', icon: '✦', text: 'Complete quests to earn XP and coins.' },
  { title: 'GROW YOUR WORLD', icon: '⌂', text: 'Level up to make new places available to build. Use coins to build them and decorate your world.' },
];

export default function HomePage({ hasSeenTutorial, onCompleteTutorial, onAcceptQuest, acceptedCount }: HomePageProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="home-game" aria-label="Your bedroom">
      <HomeScene onOpenComputer={() => setOpen(true)} />
      <GameTopBar />
      <div className="room-caption"><span>HOME · YOUR FIRST LITTLE SPACE</span><p>A new beginning. Make yourself at home.</p><div className="room-inventory-links"><Link to="/shop">Shop</Link><Link to="/wardrobe">Wardrobe</Link></div></div>
      <PixelModal open={open} onClose={() => setOpen(false)} titleId="computer-screen-title">
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
          <DailyPlanner onAccept={onAcceptQuest} acceptedCount={acceptedCount} />
        )}
      </PixelModal>
    </section>
  );
}
