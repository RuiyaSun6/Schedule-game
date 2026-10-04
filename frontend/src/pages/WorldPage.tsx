import { useState } from 'react';
import { useAreas } from '../services/AreaContext';
import GameTopBar from '../components/GameTopBar';
import { Link } from 'react-router-dom';
import { usePlayer } from '../services/PlayerContext';
import { worldAreas } from '../services/worldAreas';
import { getAreaStatus } from '../types/world';

export default function WorldPage() {
  const player = usePlayer();
  const areas = useAreas();
  const [buildError, setBuildError] = useState('');
  function buildGarden() {
    try { areas.buildGarden(); setBuildError(''); }
    catch (error) { setBuildError(error instanceof Error ? error.message : 'Couldn’t build Garden.'); }
  }
  return (
    <section className="home-game outdoor-game" aria-label="Outside world with Home and empty expansion plots">
      <div className="outdoor-path" aria-hidden="true" />
      <Link className="outdoor-home" to="/home" aria-label="Enter Home">
        <img className="outdoor-home-image" src="/assets/exterior/home.png" alt="" width={96} height={128} />
        <span className="home-entry" aria-hidden="true">
          <span className="door-prompt">ENTER HOME</span>
        </span>
      </Link>
      {worldAreas.filter((area) => area.id !== 'home').map((area) => {
        const status = getAreaStatus(area, player.level, areas.builtAreas);
        return <div key={area.id} className={`expansion-plot plot-${area.id} ${status}`} aria-label={`${area.name} plot, ${status}`}>
          <div className="plot-sign">
            <h2>{area.name}</h2>
            {status === 'locked' ? <><p>Unlocks at Lv. {area.requiredLevel}</p><span>🔒 LOCKED</span></> :
              status === 'available' ? <><p>{area.buildCost === null ? 'Price to be decided' : `${area.buildCost} coins`}</p>{area.id === 'garden' && areas.demo ? <button onClick={buildGarden} disabled={player.coins < (area.buildCost ?? 0)}>BUILD GARDEN (DEMO)</button> : <button disabled title="Backend area purchasing is not connected">BUILD · SOON</button>}</> :
              area.id === 'garden' ? <Link className="plot-entry" to="/garden">ENTER GARDEN →</Link> : <span>OWNED · Scene coming later</span>}
          </div>
        </div>;
      })}
      <GameTopBar />
      <div className="room-caption"><span>OUTSIDE · ROOM TO GROW</span><p>{areas.demo ? 'Area building is demo-only for this session.' : 'Levels open possibilities. Coins bring them to life.'}</p>{buildError && <p role="alert">{buildError}</p>}</div>
    </section>
  );
}
