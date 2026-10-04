import { useEffect, useRef } from 'react';
import SpriteAnimation from './SpriteAnimation';
import catIdle from '../assets/characters/cat-idle.png';

const AUTO_CLOSE_MS = 3000;

// Companion cheer shown after a quest is completed. Closes on any click/tap, Escape, or after 3 seconds.
export default function CompletionPopup({ line, onClose }: { line: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = line !== null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timeout = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(timeout);
  }, [open, line, onClose]);

  // Clicks on the backdrop also land on the <dialog>, so this covers "click anywhere".
  return (
    <dialog ref={ref} className="pixel-modal completion-popup" aria-labelledby="completion-popup-line"
      onClick={onClose} onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="computer-titlebar">
        <span><span aria-hidden="true">▣</span> LIFEQUEST · QUEST COMPLETE</span>
        <button className="close-button" onClick={onClose} aria-label="Close">×</button>
      </div>
      <div className="computer-content completion-popup-body">
        <SpriteAnimation src={catIdle} frameWidth={32} frameHeight={32} frameCount={10} scale={3} frameDurationMs={110}
          className="completion-popup-cat" label="Your cat companion" />
        <p id="completion-popup-line" className="completion-popup-bubble" role="status">{line}</p>
      </div>
    </dialog>
  );
}
