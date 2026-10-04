import { Route, Routes } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import type { Player, Quest } from './types';
import { AreaProvider } from './services/AreaContext';
import { completeQuest, getPlayer, getQuests } from './services/api';
import { PlayerContext, PlayerActionsContext } from './services/PlayerContext';
import LevelUpModal, { type LevelUpDetails } from './components/LevelUpModal';
import WelcomePage from './pages/WelcomePage';
import WorldPage from './pages/WorldPage';
import HomePage from './pages/HomePage';
import PlannerPage from './pages/PlannerPage';
import QuestsPage from './pages/QuestsPage';
import ShopPage from './pages/ShopPage';
import WardrobePage from './pages/WardrobePage';
import GardenPage from './pages/GardenPage';
import CafePage from './pages/CafePage';

export default function App() {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [acceptedQuests, setAcceptedQuests] = useState<Quest[]>([]);
  const [questsLoaded, setQuestsLoaded] = useState(false);
  const [questsError, setQuestsError] = useState('');
  const [player, setPlayer] = useState<Player | null>(null);
  const [playerError, setPlayerError] = useState('');
  const [completingId, setCompletingId] = useState<string | null>(null);
  const pending = useRef(false);
  const [completionErrors, setCompletionErrors] = useState<Record<string, string>>({});
  const [completionNotice, setCompletionNotice] = useState('');
  const [levelUp, setLevelUp] = useState<LevelUpDetails | null>(null);
  const [reward, setReward] = useState<{ xp: number; coins: number } | null>(null);
  useEffect(() => {
    let active = true;
    getPlayer()
      .then((loaded) => { if (active) setPlayer(loaded); })
      .catch((error: unknown) => { if (active) setPlayerError(error instanceof Error ? error.message : 'Could not load player.'); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    getQuests()
      .then((loaded) => { if (active) { setAcceptedQuests(loaded); setQuestsLoaded(true); } })
      .catch((error: unknown) => { if (active) setQuestsError(error instanceof Error ? error.message : 'Could not load quests.'); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!reward) return;
    const timeout = setTimeout(() => setReward(null), 2800);
    return () => clearTimeout(timeout);
  }, [reward]);

  function updatePlayer(updated: Player) {
    setPlayer((current) => ({ ...current, ...updated, builtAreas: updated.builtAreas ?? current?.builtAreas }));
  }
  function beginMutation() {
    if (pending.current) return false;
    pending.current = true;
    return true;
  }
  function endMutation() { pending.current = false; }

  async function finishQuest(quest: Quest) {
    if (!player || quest.completed || !beginMutation()) return;
    setCompletingId(quest.id);
    setCompletionErrors({});
    setCompletionNotice('');
    try {
      const result = await completeQuest(quest.id);
      // Reward numbers are feedback only. Returned balances are authoritative.
      setReward({ xp: Math.max(0, result.player.xp - player.xp), coins: Math.max(0, result.player.coins - player.coins) });
      updatePlayer(result.player);
      setAcceptedQuests((current) => current.map((q) => q.id === result.quest.id ? result.quest : q));
      setCompletionNotice('Quest completed. Lovely work!');
      if (result.player.level > player.level) setLevelUp({
        previousLevel: player.level,
        level: result.player.level,
        newlyUnlocked: result.player.unlockedAreas.filter((area) => !player.unlockedAreas.includes(area)),
      });
    } catch (error) {
      setCompletionErrors({ [quest.id]: error instanceof Error ? error.message : 'Couldn’t complete this quest. Please retry.' });
    } finally {
      endMutation();
      setCompletingId(null);
    }
  }
  function acceptQuest(quest: Quest) {
    setAcceptedQuests((current) => current.some((q) => q.id === quest.id) ? current : [...current, quest]);
  }
  if (!player || !questsLoaded) {
    const error = playerError || questsError;
    return <main className="app"><p role={error ? 'alert' : 'status'}>{error || 'Loading player and quests...'}</p></main>;
  }
  return (
    <PlayerContext.Provider value={player}>
    <PlayerActionsContext.Provider value={{ updatePlayer, beginMutation, endMutation }}>
    <AreaProvider>
    <main className="app">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/world" element={<WorldPage />} />
          <Route path="/home" element={<HomePage onAcceptQuest={acceptQuest} acceptedCount={acceptedQuests.length} quests={acceptedQuests} hasSeenTutorial={hasSeenTutorial} onCompleteTutorial={() => setHasSeenTutorial(true)} />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/quests" element={<QuestsPage quests={acceptedQuests} onComplete={finishQuest} completingId={completingId} errors={completionErrors} notice={completionNotice} />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/wardrobe" element={<WardrobePage />} />
          <Route path="/garden" element={<GardenPage />} />
          <Route path="/cafe" element={<CafePage />} />
          <Route path="*" element={<h1>Page not found</h1>} />
        </Routes>
      {reward && (reward.xp > 0 || reward.coins > 0) && <div className="reward-feedback" role="status">+{reward.xp} XP · +{reward.coins} coins</div>}
      <LevelUpModal details={levelUp} onClose={() => setLevelUp(null)} />
    </main>
    </AreaProvider>
    </PlayerActionsContext.Provider>
    </PlayerContext.Provider>
  );
}
