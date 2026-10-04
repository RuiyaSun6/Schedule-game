import { useState } from 'react';
import { Link } from 'react-router-dom';
import GameTopBar from '../components/GameTopBar';
import ItemArtwork from '../components/ItemArtwork';
import PixelButton from '../components/PixelButton';
import { usePlayer, usePlayerActions } from '../services/PlayerContext';
import { useCatalog } from '../services/useCatalog';
import { equipOutfit } from '../services/shop';

export default function WardrobePage() {
  const player = usePlayer();
  const actions = usePlayerActions();
  const catalog = useCatalog();
  const outfits = catalog.items.filter((item) => item.type === 'clothing' && player.ownedItems?.includes(item.id));
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  async function equip() {
    if (!outfits.some((item) => item.id === selected)) return;
    if (!actions.beginMutation()) { setError('Another update is in progress. Please wait.'); return; }
    setBusy(true); setError(''); setNotice('');
    try { const result = await equipOutfit(player, selected); actions.updatePlayer(result.player); setNotice(result.demo ? 'Outfit equipped in demo mode for this session.' : 'Outfit equipped!'); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Couldn’t equip outfit.'); }
    finally { actions.endMutation(); setBusy(false); }
  }
  return <section className="inventory-page accepted-quests-page">
    <GameTopBar /><h1>WARDROBE</h1><p>Current outfit: {player.outfit ?? 'default'}</p>
    {catalog.loading && <p className="loading-feedback" role="status">Opening your wardrobe…</p>}
    {catalog.error && <div role="alert"><p>{catalog.error}</p><PixelButton onClick={catalog.retry}>RETRY</PixelButton></div>}
    {catalog.demo && <p className="planner-notice">Demo catalog · missing outfit art uses a placeholder.</p>}
    {!catalog.loading && !catalog.error && outfits.length === 0 && <p>No clothing owned yet. Pick something up at the shop.</p>}
    <div className="item-grid">{outfits.map((item) => <article className="item-card pixel-panel" key={item.id}><ItemArtwork item={item} /><h2>{item.name}</h2>
      <PixelButton aria-pressed={selected === item.id} disabled={busy} onClick={() => setSelected(item.id)}>{player.outfit === item.id ? 'EQUIPPED' : selected === item.id ? 'SELECTED' : 'SELECT'}</PixelButton>
    </article>)}</div>
    <PixelButton aria-busy={busy} disabled={busy || catalog.loading || !!catalog.error || !outfits.some((item) => item.id === selected) || player.outfit === selected} onClick={() => void equip()}>{busy ? 'EQUIPPING…' : 'EQUIP'}</PixelButton>
    {error && <p role="alert" className="planner-error">{error}</p>}<p role="status" className="planner-notice">{notice}</p>
    <div className="inventory-links"><Link to="/home">← Bedroom</Link><Link to="/shop">Shop →</Link></div>
  </section>;
}
