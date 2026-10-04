import { useNavigate } from 'react-router-dom';
import PixelButton from '../components/PixelButton';

export default function WelcomePage() {
  const navigate = useNavigate();
  return (
    <section className="welcome-screen" aria-labelledby="welcome-title">
      <div className="welcome-sparkles" aria-hidden="true">✧ · ✦ · ✧</div>
      <span className="eyebrow">A LITTLE WORLD OF YOUR OWN</span>
      <h1 id="welcome-title">Life<span>Quest</span></h1>
      <p className="welcome-motto">Complete your real life.<br />Build your virtual life.</p>
      <div className="welcome-divider" aria-hidden="true">── ✿ ──</div>
      <p className="welcome-message">Welcome to your new little world.<br />It may look empty now, but every quest you complete<br className="desktop-break" /> will help it grow.</p>
      <PixelButton onClick={() => navigate('/home')}>START MY LIFE <span aria-hidden="true">→</span></PixelButton>
      <small className="welcome-footer">Small steps. New beginnings.</small>
    </section>
  );
}
