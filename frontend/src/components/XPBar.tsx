import { xpAtLevel, xpRequiredForLevel } from '../services/levelProgression';

interface XPBarProps {
  xp: number;
  level: number;
}

export default function XPBar({ xp, level }: XPBarProps) {
  const start = xpAtLevel(level);
  const earned = Math.max(0, xp - start);
  const needed = xpRequiredForLevel(level);
  const progress = Math.min(100, (earned / needed) * 100);

  return (
    <div className="xp-block">
      <div className="xp-label">
        <span>Experience</span>
        <span key={xp} className="stat-update">{`${earned} / ${needed} XP`}</span>
      </div>
      <div className="xp-track" role="progressbar" aria-label="Level experience"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}
        aria-valuetext={`${earned} of ${needed} XP toward level ${level + 1}`}>
        <div className="xp-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
