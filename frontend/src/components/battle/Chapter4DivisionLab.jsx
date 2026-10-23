import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const emptyGroups = (count) => ({ left: Array(count).fill(null), right: Array(count).fill(null) });

export default function Chapter4DivisionLab({ divisor, equation, lang, onReady }) {
  const count = Math.abs(Number(divisor));
  const partLabel = `${Number(divisor) < 0 ? '−' : ''}1/${count}`;
  const [groups, setGroups] = useState(() => emptyGroups(count));
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [message, setMessage] = useState('');
  const dragCleanup = useRef(null);
  const [left, right] = equation.split('=').map((side) => side.trim());
  const filled = groups.left.filter(Boolean).length + groups.right.filter(Boolean).length;
  const complete = filled === count * 2;

  useEffect(() => {
    if (!complete) { onReady(false); return undefined; }
    const timer = window.setTimeout(() => onReady(true), 700);
    return () => window.clearTimeout(timer);
  }, [complete]);
  useEffect(() => () => dragCleanup.current?.(), []);

  const place = (piece, targetSide, index) => {
    if (!piece || piece.side !== targetSide || groups[targetSide][index] !== null || groups[piece.side].includes(piece.id)) {
      setMessage(lang === 'en' ? 'Put one piece from the matching side into each group.' : 'Letakkan satu kepingan dari ruas yang sesuai pada tiap kelompok.');
      return;
    }
    setHistory((items) => [...items, groups]);
    setGroups((current) => ({ ...current, [targetSide]: current[targetSide].map((value, position) => position === index ? piece.id : value) }));
    setSelected(null);
    setMessage('');
  };
  const startDrag = (event, piece) => {
    if (event.button !== 0) return;
    event.preventDefault();
    dragCleanup.current?.();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    setGhost({ piece, x: startX, y: startY });
    const move = (next) => {
      if (next.pointerId !== pointerId) return;
      if (Math.abs(next.clientX - startX) + Math.abs(next.clientY - startY) > 7) moved = true;
      setGhost({ piece, x: next.clientX, y: next.clientY });
    };
    const finish = (next) => {
      if (next.pointerId !== pointerId) return;
      const target = document.elementFromPoint(next.clientX, next.clientY)?.closest('[data-division-side]');
      dragCleanup.current?.();
      setGhost(null);
      if (moved && target) place(piece, target.dataset.divisionSide, Number(target.dataset.divisionGroup));
      else if (!moved) setSelected(piece);
    };
    const cancel = () => { dragCleanup.current?.(); setGhost(null); };
    dragCleanup.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
      dragCleanup.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
  };
  const undo = () => {
    if (!history.length) return;
    setGroups(history[history.length - 1]);
    setHistory((items) => items.slice(0, -1));
    setSelected(null);
    setMessage('');
  };

  return <section className={`math-sim-division-lab ${complete ? 'is-complete' : ''}`} aria-label={lang === 'en' ? 'Equal group division' : 'Pembagian kelompok setara'}>
    <header><div><small>{lang === 'en' ? 'DIVISION WORKSHOP' : 'BENGKEL PEMBAGIAN'}</small><strong>{lang === 'en' ? `Split both sides into ${count} equal groups` : `Bagi kedua ruas menjadi ${count} kelompok sama besar`}</strong></div><span>{filled}/{count * 2}</span></header>
    <p>{lang === 'en' ? 'Drag each fraction piece into a matching side of a group. Tap a piece and a group to play without dragging.' : 'Seret tiap kepingan pecahan ke ruas yang sesuai dalam kelompok. Bisa juga ketuk kepingan lalu ketuk kelompok.'}{Number(divisor) < 0 && <strong> {lang === 'en' ? 'A negative divisor also reverses the sign.' : 'Pembagi negatif juga membalik tanda.'}</strong>}</p>
    <div className="math-sim-division-sources">
      {(['left', 'right']).map((side) => <div className={`math-sim-division-source is-${side}`} key={side}><b>{side === 'left' ? left : right}</b><div>{Array.from({ length: count }, (_, index) => {
        const piece = { side, id: `${side}-${index}` };
        return <button type="button" key={piece.id} disabled={groups[side].includes(piece.id)} className={selected?.id === piece.id ? 'is-selected' : ''} onPointerDown={(event) => startDrag(event, piece)} onClick={(event) => { if (event.detail === 0) setSelected(piece); }} aria-label={`${side === 'left' ? (lang === 'en' ? 'Left' : 'Kiri') : (lang === 'en' ? 'Right' : 'Kanan')} ${index + 1}, ${partLabel}`}><span>{partLabel}</span></button>;
      })}</div></div>)}
    </div>
    <div className="math-sim-division-groups">{Array.from({ length: count }, (_, index) => <div className="math-sim-division-group" key={index}><small>{lang === 'en' ? 'GROUP' : 'KELOMPOK'} {index + 1}</small><div>{(['left', 'right']).map((side) => <button type="button" key={side} data-division-side={side} data-division-group={index} className={groups[side][index] ? 'is-filled' : ''} onClick={() => selected && place(selected, side, index)} aria-label={`${lang === 'en' ? 'Group' : 'Kelompok'} ${index + 1}, ${side === 'left' ? (lang === 'en' ? 'left' : 'kiri') : (lang === 'en' ? 'right' : 'kanan')}`}><span>{groups[side][index] ? partLabel : side === 'left' ? (lang === 'en' ? 'L' : 'K') : 'R'}</span></button>)}</div></div>)}</div>
    <footer><span role="status">{message || (complete ? (lang === 'en' ? 'Both sides have equal groups. Apply division to each pan.' : 'Kedua ruas telah terbagi sama. Terapkan pembagian ke tiap piring.') : (lang === 'en' ? 'Each group needs one piece from each side.' : 'Setiap kelompok membutuhkan satu kepingan dari tiap ruas.'))}</span><button type="button" disabled={!history.length} onClick={undo}>{lang === 'en' ? 'Undo piece' : 'Urungkan kepingan'}</button></footer>
    {ghost && createPortal(<span className="math-sim-division-ghost" style={{ left: ghost.x, top: ghost.y }}>{partLabel}</span>, document.body)}
  </section>;
}
