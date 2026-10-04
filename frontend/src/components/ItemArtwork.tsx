import { useState } from 'react';
import type { Item } from '../types';

import { getShopArtwork } from '../data/shopAssets';

export default function ItemArtwork({ item }: { item: Item }) {
  const [failed, setFailed] = useState(false);
  const sprite = getShopArtwork(item);
  if (!item.asset || failed) return <span className="item-art-placeholder" aria-label={`${item.name}: artwork coming soon`}>◇</span>;
  if (sprite) {
    return <svg className="item-art asset-sprite" viewBox={sprite.crop} role="img" aria-label={item.name}>
      <image href={item.asset} width={sprite.width} height={sprite.height} onError={() => setFailed(true)} />
      {sprite.layers?.map((crop) => <svg key={crop} viewBox={crop} x={Number(sprite.crop.split(' ')[0])} y={Number(sprite.crop.split(' ')[1])} width={Number(sprite.crop.split(' ')[2])} height={Number(sprite.crop.split(' ')[3])}>
        <image href={item.asset} width={sprite.width} height={sprite.height} onError={() => setFailed(true)} />
      </svg>)}
    </svg>;
  }
  // An unknown sheet is not a single item image.
  if (decodeURI(item.asset).includes('/interior full/')) return <span className="item-art-placeholder" aria-label="Artwork coming soon">◇</span>;
  return <img className="item-art" src={item.asset} alt={item.name} onError={() => setFailed(true)} />;
}
