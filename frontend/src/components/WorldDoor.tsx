import { Link } from 'react-router-dom';

interface WorldDoorProps {
  to: string;
  prompt: string;
  className?: string;
}

export default function WorldDoor({ to, prompt, className = '' }: WorldDoorProps) {
  return <Link className={`world-door ${className}`} to={to} aria-label={prompt}>
    <span className="door-prompt">{prompt}</span>
    <svg className="asset-sprite" viewBox="0 0 48 32" aria-hidden="true">
      <image href={`${import.meta.env.BASE_URL}assets/interior%20full/basics/doors.png`} width="1152" height="320" />
    </svg>
  </Link>;
}
