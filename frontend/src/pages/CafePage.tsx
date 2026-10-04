import { Link } from 'react-router-dom';
import { usePlayer } from '../services/PlayerContext';
import { useAreas } from '../services/AreaContext';
import { worldAreas } from '../services/worldAreas';
import { getAreaStatus } from '../types/world';
import AreaAccessNotice from '../components/AreaAccessNotice';

export default function CafePage() {
  const player = usePlayer();
  const { builtAreas } = useAreas();
  const cafe = worldAreas.find((area) => area.id === 'cafe')!;
  const status = getAreaStatus(cafe, player.level, builtAreas);
  if (status !== 'built') return <AreaAccessNotice name="Café" requiredLevel={3} locked={status === 'locked'} />;
  return <section className="accepted-quests-page"><h1>Café</h1><p>Café scene coming later.</p><Link to="/world">← Outside</Link></section>;
}
