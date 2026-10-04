interface XPBarProps {
  xp: number;
  level: number;
}

const thresholds = [0, 100, 250, 500, 800];

export default function XPBar({ xp, level }: XPBarProps) {
  const index = Math.min(5, Math.max(1, Math.floor(level))) - 1;
  const start = thresholds[index];
  const next = thresholds[index + 1];
  const atMaxLevel = next === undefined;
  const earned = Math.max(0, xp - start);
  const needed = atMaxLevel ? 0 : next - start;
  const progress = atMaxLevel ? 100 : Math.min(100, (earned / needed) * 100);

  return (
    <div className="xp-block">
      <div className="xp-label">
        <span>Experience</span>
        <span key={xp} className="stat-update">{atMaxLevel ? `${xp} XP · Max level` : `${earned} / ${needed} XP`}</span>
      </div>
      <div className="xp-track" role="progressbar" aria-label="Level experience"
        aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}
        aria-valuetext={atMaxLevel ? 'Maximum level reached' : `${earned} of ${needed} XP toward level ${index + 2}`}>
        <div className="xp-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
