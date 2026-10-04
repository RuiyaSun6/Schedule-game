import { useEffect, useRef, type ReactNode } from 'react';

interface PixelModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  titleId: string;
  inline?: boolean;
}

export default function PixelModal({ open, onClose, children, titleId, inline = false }: PixelModalProps) {
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
    <dialog ref={ref} className="pixel-modal" aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <div className="computer-titlebar">
        <span><span aria-hidden="true">▣</span> {titleId === 'level-up-title' ? 'LIFEQUEST · A NEW CHAPTER' : titleId === 'backpack-title' ? 'LIFEQUEST · BACKPACK' : titleId === 'building-shop-title' ? 'LIFEQUEST · BUILDING SHOP' : 'LIFEQUEST · PERSONAL COMPUTER'}</span>
        <button className="close-button" onClick={onClose} aria-label={titleId === 'backpack-title' ? 'Close Backpack' : titleId === 'building-shop-title' ? 'Close Building Shop' : 'Close computer'}>×</button>
      </div>
      <div className="computer-content">{children}</div>
    </dialog>
  );
}
