import { Link } from 'react-router-dom';

export default function AreaAccessNotice({ name, requiredLevel, locked }: { name: string; requiredLevel: number; locked: boolean }) {
  return <section className="accepted-quests-page pixel-panel area-access-notice">
    <span className="eyebrow">ROOM TO GROW</span><h1>{name}</h1>
    <p>{locked ? `${name} is locked until Level ${requiredLevel}.` : `${name} is eligible to build, but hasn’t been built yet.`}</p>
    <p>Reaching a level opens the opportunity. Building the area is a separate purchase.</p>
    <Link className="accepted-quests-link" to="/world">← Return to Outside</Link>
  </section>;
}
