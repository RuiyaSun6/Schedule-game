import { useEffect, useRef, type ReactNode } from 'react';

interface PixelModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  titleId: string;
  inline?: boolean;
  className?: string;
}

export default function PixelModal({ open, onClose, children, titleId, inline = false, className = '' }: PixelModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || inline) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open, inline]);

  if (inline) return open ? <div className="pixel-modal tutorial-computer-shell" role="group" aria-label="Bedroom computer">
    <div className="computer-titlebar">LIFEQUEST · PERSONAL COMPUTER</div>
    <div className="computer-content">{children}</div>
  </div> : null;

  return (
    <dialog ref={ref} className={`pixel-modal ${className}`} aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="computer-titlebar">
        <span><span aria-hidden="true">▣</span> {titleId === 'reward-board-title' ? 'LIFEQUEST · REWARD BOARD' : titleId === 'level-up-title' ? 'LIFEQUEST · A NEW CHAPTER' : titleId === 'backpack-title' ? 'LIFEQUEST · BACKPACK' : titleId === 'building-shop-title' ? 'LIFEQUEST · BUILDING SHOP' : titleId === 'building-upgrade-title' ? 'LIFEQUEST · BUILDING UPGRADE' : titleId === 'furniture-shop-title' ? 'LIFEQUEST · FURNITURE SHOP' : 'LIFEQUEST · PERSONAL COMPUTER'}</span>
        <button className="close-button" onClick={onClose} aria-label={titleId === 'reward-board-title' ? 'Close Reward Board' : titleId === 'backpack-title' ? 'Close Backpack' : titleId === 'building-shop-title' ? 'Close Building Shop' : titleId === 'building-upgrade-title' ? 'Close building upgrade' : titleId === 'furniture-shop-title' ? 'Close Furniture Shop' : 'Close computer'}>×</button>
      </div>
      <div className="computer-content">{children}</div>
    </dialog>
  );
}
