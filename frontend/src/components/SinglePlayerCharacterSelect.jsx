import React, { useEffect, useRef, useState } from 'react';
import { CHARACTER_SELECT_BACKGROUND } from '../config/backgrounds';
import SinglePlayerCharacterPicker from './SinglePlayerCharacterPicker';
import '../styles/single-player-cinematic.css';

const ENVIRONMENT = CHARACTER_SELECT_BACKGROUND;
const TRANSITION_MS = 1250;

export default function SinglePlayerCharacterSelect({ levelId, onStart, t }) {
  const sceneRef = useRef(null);
  const lockedRef = useRef(false);
  const timerRef = useRef(null);
  const startRef = useRef(onStart);
  const [selectedId, setSelectedId] = useState(null);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => { startRef.current = onStart; }, [onStart]);
  useEffect(() => () => clearTimeout(timerRef.current), []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (reducedMotion || selectedId) {
      scene.style.setProperty('--pointer-x', '0px');
      scene.style.setProperty('--pointer-y', '0px');
      return;
    }
    let raf = 0;
    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    const tick = () => {
      x += (targetX - x) * 0.08;
      y += (targetY - y) * 0.08;
      scene.style.setProperty('--pointer-x', `${x.toFixed(3)}px`);
      scene.style.setProperty('--pointer-y', `${y.toFixed(3)}px`);
      raf = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.01 ? requestAnimationFrame(tick) : 0;
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const move = (event) => {
      if (event.pointerType !== 'mouse' || lockedRef.current) return;
      const bounds = scene.getBoundingClientRect();
      targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 6;
      targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 4;
      schedule();
    };
    const reset = () => { targetX = 0; targetY = 0; schedule(); };
    scene.addEventListener('pointermove', move);
    scene.addEventListener('pointerleave', reset);
    return () => {
      cancelAnimationFrame(raf);
      scene.removeEventListener('pointermove', move);
      scene.removeEventListener('pointerleave', reset);
    };
  }, [reducedMotion, selectedId]);

  const selectCharacter = (characterId) => {
    // App owns campaign persistence and eligibility. Only commit once, at the cut.
    const chapterId = Number(levelId);
    if (lockedRef.current || chapterId !== 1 || !['traveler', 'asuka'].includes(characterId)) return;
    lockedRef.current = true;
    setSelectedId(characterId);
    timerRef.current = setTimeout(() => {
      startRef.current?.(chapterId, characterId);
    }, reducedMotion ? 0 : TRANSITION_MS);
  };

  return (
    <main ref={sceneRef} className="sp-cinema" data-selected={selectedId || undefined} aria-labelledby="sp-cinema-title" aria-busy={Boolean(selectedId)}>
      <div className="sp-cinema-camera">
        <div className="sp-cinema-environment" aria-hidden="true">
          <picture>
            <source media="(max-width: 1050px) and (orientation: portrait)" srcSet={ENVIRONMENT.mobile} />
            <img src={ENVIRONMENT.desktop} alt="" fetchPriority="high" />
          </picture>
        </div>
        <div className="sp-cinema-light" aria-hidden="true" />
        <SinglePlayerCharacterPicker selectedId={selectedId} onSelect={selectCharacter} reducedMotion={reducedMotion} t={t} />
        <div className="sp-cinema-foreground" aria-hidden="true" />
      </div>
      <h1 id="sp-cinema-title">CHOOSE YOUR CHARACTER</h1>
      <div className="sp-cinema-curtain" aria-hidden="true" />
    </main>
  );
}
