import PixelModal from './PixelModal';
import PixelButton from './PixelButton';
import { worldAreas } from '../services/worldAreas';

export interface LevelUpDetails { previousLevel: number; level: number; newlyUnlocked: string[]; }

export default function LevelUpModal({ details, onClose }: { details: LevelUpDetails | null; onClose: () => void }) {
  return <PixelModal open={details !== null} onClose={onClose} titleId="level-up-title">
    {details && <div className="level-up-content">
      <span className="eyebrow">ONE LITTLE STEP FORWARD</span>
      <h2 id="level-up-title">LEVEL UP!</h2>
      <p className="level-up-levels">Level {details.previousLevel} → Level {details.level}</p>
      {details.newlyUnlocked.length > 0 && <><p>New {details.newlyUnlocked.length === 1 ? 'opportunity' : 'opportunities'} unlocked:</p>
        <ul>{details.newlyUnlocked.map((id) => <li key={id}>{worldAreas.find((area) => area.id === id)?.name ?? id}</li>)}</ul>
        <p>These areas are now available to build with coins. Your plots are still waiting for you.</p></>}
      <PixelButton onClick={onClose}>KEEP GOING</PixelButton>
    </div>}
  </PixelModal>;
}
