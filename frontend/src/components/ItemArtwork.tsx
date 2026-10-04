import { useState } from 'react';
import type { Item } from '../types';

// Crops are only applied to the known pack sheets, never to standalone assets.
const sprites: Record<string, { file: string; width: number; height: number; crop: string }> = {
  plant: { file: 'decorations.png', width: 960, height: 624, crop: '0 32 16 32' },
  chair: { file: 'chairs.png', width: 768, height: 208, crop: '0 0 16 32' },
  sofa: { file: 'couches.png', width: 960, height: 496, crop: '0 112 32 32' },
  lamp: { file: 'decorations.png', width: 960, height: 624, crop: '304 112 16 32' },
};

export default function ItemArtwork({ item }: { item: Item }) {
  const [failed, setFailed] = useState(false);
  const sprite = sprites[item.id];
  if (!item.asset || failed) return <span className="item-art-placeholder" aria-label={`${item.name}: artwork coming soon`}>◇</span>;
  if (sprite && decodeURI(item.asset).endsWith(`/interior full/furniture/${sprite.file}`)) {
    return <svg className="item-art asset-sprite" viewBox={sprite.crop} role="img" aria-label={item.name}>
      <image href={item.asset} width={sprite.width} height={sprite.height} onError={() => setFailed(true)} />
    </svg>;
  }
  // An unknown sheet is not a single item image.
  if (decodeURI(item.asset).includes('/interior full/')) return <span className="item-art-placeholder" aria-label="Artwork coming soon">◇</span>;
  return <img className="item-art" src={item.asset} alt={item.name} onError={() => setFailed(true)} />;
}
