import { useEffect, useRef, type ReactNode } from 'react';
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <header className="modal-head"><div><span className="eyebrow">系統面板</span><h2 id="modal-title">{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="關閉面板">✕</button></header>
    {children}
  </dialog>;
}
