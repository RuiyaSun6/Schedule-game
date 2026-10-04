import type { CSSProperties } from 'react';

interface SpriteAnimationProps {
  /** Horizontal sprite sheet: frames laid out left to right in one row. */
  src: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  /** Integer scale keeps pixels crisp (3 => a 32px frame shows at 96px). */
  scale?: number;
  frameDurationMs?: number;
  className?: string;
  label?: string;
}

// Plays a sprite sheet with CSS only: background-position steps through the frames.
// Under prefers-reduced-motion the animation is disabled in CSS and the first frame stays visible.
export default function SpriteAnimation({
  src, frameWidth, frameHeight, frameCount, scale = 3, frameDurationMs = 110, className = '', label,
}: SpriteAnimationProps) {
  const width = frameWidth * scale;
  const height = frameHeight * scale;
  const style = {
    width,
    height,
    backgroundImage: `url(${src})`,
    // The whole sheet scales with the frame, otherwise frames drift out of alignment.
    backgroundSize: `${width * frameCount}px ${height}px`,
    '--sprite-sheet-width': `${width * frameCount}px`,
    animation: `sprite-play ${frameDurationMs * frameCount}ms steps(${frameCount}) infinite`,
  } as CSSProperties;
  return <div className={`sprite-animation ${className}`.trim()} style={style}
    {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })} />;
}
