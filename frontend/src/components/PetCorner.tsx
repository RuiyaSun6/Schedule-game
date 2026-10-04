import SpriteAnimation from './SpriteAnimation';
import { usePlayer } from '../services/PlayerContext';
import catIdle from '../assets/characters/cat-idle.png';
import petBed from '../assets/characters/pet-bed.png';
import petTree from '../assets/characters/pet-tree.png';
import petScratcher from '../assets/characters/pet-scratcher.png';
import petBowl from '../assets/characters/pet-bowl.png';
import './PetCorner.css';

// Shop items that upgrade the pet corner. Image sizes are the cropped sprite sizes, shown at 1x.
export const PET_ITEM_ART: Record<string, { src: string; width: number; height: number }> = {
  'pet-bowl': { src: petBowl, width: 43, height: 37 },
  'pet-scratcher': { src: petScratcher, width: 55, height: 77 },
  'pet-bed': { src: petBed, width: 110, height: 82 },
  'pet-tree': { src: petTree, width: 64, height: 110 },
};
export const isPetItem = (itemId: string) => itemId in PET_ITEM_ART;

const HOME_NAMES = { box: 'in a cardboard box', bed: 'in a cozy cat bed', tree: 'on top of a cat tree' } as const;

function PetImage({ id, className }: { id: keyof typeof PET_ITEM_ART; className: string }) {
  const art = PET_ITEM_ART[id];
  return <img className={`pet-sprite ${className}`} src={art.src} width={art.width} height={art.height} alt="" draggable={false} />;
}

// Fixed bottom-left corner of the bedroom. Shows only the best home the player owns
// (cat tree > cat bed > free cardboard box) plus the optional bowl and scratching post.
// Purely decorative: pointer-events are off so it never blocks room objects.
export default function PetCorner() {
  const owned = usePlayer().ownedItems ?? [];
  const home = owned.includes('pet-tree') ? 'tree' : owned.includes('pet-bed') ? 'bed' : 'box';
  const hasBowl = owned.includes('pet-bowl');
  const hasScratcher = owned.includes('pet-scratcher');
  const label = `Your cat companion ${HOME_NAMES[home]}${hasBowl ? ', with a food bowl' : ''}${hasScratcher ? ', next to a scratching post' : ''}`;

  return <div className={`pet-corner pet-corner-${home}`} role="img" aria-label={label}>
    {hasScratcher && <PetImage id="pet-scratcher" className="pet-scratcher" />}
    <div className="pet-home">
      {home === 'box' && <span className="pet-box-back" />}
      {home === 'bed' && <PetImage id="pet-bed" className="pet-home-art" />}
      {home === 'tree' && <PetImage id="pet-tree" className="pet-home-art" />}
      <SpriteAnimation className="pet-cat" src={catIdle} frameWidth={32} frameHeight={32} frameCount={10} scale={2} frameDurationMs={120} />
      {/* TODO: replace the CSS box with a pet-box sprite. The current pet-box.png is an unfolded
          template on a white background, and the cat needs an open box to peek out of. */}
      {home === 'box' && <span className="pet-box-front" />}
    </div>
    {hasBowl && <PetImage id="pet-bowl" className="pet-bowl" />}
  </div>;
}
