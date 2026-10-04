import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { tutorialSteps } from '../services/tutorial';
import './TutorialOverlay.css';

interface Spotlight { left: number; top: number; right: number; bottom: number }

export default function TutorialOverlay({ index, onBack, onNext, onSkip }: {
  index: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const step = tutorialSteps[index];
  const location = useLocation();
  const cardRef = useRef<HTMLElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [spotlight, setSpotlight] = useState<Spotlight | null>(null);
  const [cardPosition, setCardPosition] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const measure = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useLayoutEffect(() => {
    setSpotlight(null);
    if (!step.target || location.pathname !== step.route) return;
    const target = document.querySelector<HTMLElement>(`[data-tutorial="${step.target}"]`);
    if (!target) return;
    if (step.target !== 'world-viewport' && step.target !== 'home') target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    const measure = () => {
      const bounds = target.getBoundingClientRect();
      if (bounds.width === 0 || bounds.height === 0) { setSpotlight(null); return; }
      let left = bounds.left;
      let top = bounds.top;
      let right = bounds.right;
      let bottom = bounds.bottom;
      for (let parent = target.parentElement; parent; parent = parent.parentElement) {
        const style = window.getComputedStyle(parent);
        if (!/(auto|scroll|hidden|clip)/.test(`${style.overflow} ${style.overflowX} ${style.overflowY}`)) continue;
        const clip = parent.getBoundingClientRect();
        left = Math.max(left, clip.left);
        top = Math.max(top, clip.top);
        right = Math.min(right, clip.right);
        bottom = Math.min(bottom, clip.bottom);
      }
      if (right <= left || bottom <= top) { setSpotlight(null); return; }
      const gap = 6;
      setSpotlight({
        left: Math.max(0, left - gap),
        top: Math.max(0, top - gap),
        right: Math.min(window.innerWidth, right + gap),
        bottom: Math.min(window.innerHeight, bottom + gap),
      });
    };
    measure();
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [index, location.pathname, step.route, step.target]);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const margin = 12;
    if (!spotlight) {
      setCardPosition({ left: Math.max(margin, (viewport.width - width) / 2), top: Math.max(margin, (viewport.height - height) / 2) });
      return;
    }
    if (step.target === 'world-viewport') {
      setCardPosition({ left: Math.max(margin, viewport.width - width - 20), top: Math.max(margin, viewport.height - height - 20) });
      return;
    }
    const clampX = (value: number) => Math.max(margin, Math.min(value, viewport.width - width - margin));
    const clampY = (value: number) => Math.max(margin, Math.min(value, viewport.height - height - margin));
    const candidates = [
      { space: viewport.height - spotlight.bottom, left: clampX(spotlight.left), top: clampY(spotlight.bottom + margin), need: height + margin },
      { space: spotlight.top, left: clampX(spotlight.left), top: clampY(spotlight.top - height - margin), need: height + margin },
      { space: viewport.width - spotlight.right, left: clampX(spotlight.right + margin), top: clampY(spotlight.top), need: width + margin },
      { space: spotlight.left, left: clampX(spotlight.left - width - margin), top: clampY(spotlight.top), need: width + margin },
    ];
    const position = candidates.find((candidate) => candidate.space >= candidate.need) ??
      candidates.reduce((best, candidate) => candidate.space > best.space ? candidate : best);
    setCardPosition({ left: position.left, top: position.top });
  }, [spotlight, index, step.target, viewport]);

  useEffect(() => { nextRef.current?.focus(); }, [index]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onSkip(); }
      if (event.key !== 'Tab' || !cardRef.current) return;
      const controls = [...cardRef.current.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onSkip]);

  useLayoutEffect(() => {
    const blockGameplayClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element) || cardRef.current?.contains(target)) return;
      const onEmptyWorld = step.target === 'world-viewport' &&
        target.closest('.world-canvas') &&
        !target.closest('a, button, input, select, textarea, .world-building, .placement-catcher');
      const onReturnHome = step.target === 'return-home' && target.closest('[data-tutorial="return-home"]');
      if (onEmptyWorld || onReturnHome) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('pointerdown', blockGameplayClick, true);
    document.addEventListener('click', blockGameplayClick, true);
    return () => {
      document.removeEventListener('pointerdown', blockGameplayClick, true);
      document.removeEventListener('click', blockGameplayClick, true);
    };
  }, [step.target]);

  const viewportWidth = viewport.width;
  const viewportHeight = viewport.height;
  const allowTargetInteraction = step.target === 'world-viewport' || step.target === 'return-home';
  return <div className="tutorial-overlay" aria-label="LifeQuest tutorial">
    {spotlight ? <>
      <div className="tutorial-shade" style={{ left: 0, top: 0, width: viewportWidth, height: spotlight.top }} />
      <div className="tutorial-shade" style={{ left: 0, top: spotlight.bottom, width: viewportWidth, height: viewportHeight - spotlight.bottom }} />
      <div className="tutorial-shade" style={{ left: 0, top: spotlight.top, width: spotlight.left, height: spotlight.bottom - spotlight.top }} />
      <div className="tutorial-shade" style={{ left: spotlight.right, top: spotlight.top, width: viewportWidth - spotlight.right, height: spotlight.bottom - spotlight.top }} />
      {!allowTargetInteraction && <div className="tutorial-target-shield" style={{ left: spotlight.left, top: spotlight.top, width: spotlight.right - spotlight.left, height: spotlight.bottom - spotlight.top }} />}
      <div className="tutorial-spotlight-border" style={{ left: spotlight.left, top: spotlight.top, width: spotlight.right - spotlight.left, height: spotlight.bottom - spotlight.top }} />
    </> : <div className="tutorial-shade tutorial-shade-full" />}
    <section ref={cardRef} className="tutorial-card pixel-panel" role="dialog" aria-modal="true" aria-labelledby="tutorial-title"
      style={cardPosition ?? undefined}>
      <div className="tutorial-card-heading"><span>✦ PLAYER GUIDE</span><span>{index + 1} / {tutorialSteps.length}</span></div>
      <h2 id="tutorial-title">{step.title}</h2>
      <p>{step.text}</p>
      {step.detail && <p className="tutorial-card-detail">{step.detail}</p>}
      <div className="tutorial-card-actions">
        <button type="button" className="tutorial-text-button" onClick={onSkip}>Skip Tutorial</button>
        <button type="button" className="tutorial-text-button" onClick={onBack} disabled={index === 0}>Back</button>
        <button ref={nextRef} type="button" className="tutorial-next-button" onClick={onNext}>
          {index === 0 ? "Let's Go!" : index === tutorialSteps.length - 1 ? 'Start Playing' : 'Next →'}
        </button>
      </div>
    </section>
  </div>;
}
