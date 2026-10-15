import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTER_SELECT_BACKGROUND } from '../../config/backgrounds';
import { SELECTION_ART, SELECTION_CHARACTERS } from '../../data/characterSelection';
import CinematicCharacterChoice from './CinematicCharacterChoice';
import SinglePlayerCharacterDetail from './SinglePlayerCharacterDetail';
import '../../styles/character-selection.css';

export default function SinglePlayerCharacterSelect({ levelId, onStart, onBack, lang = 'id' }) {
  const [phase, setPhase] = useState('choice');
  const [previewId, setPreviewId] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const lockedRef = useRef(false);
  const aliveRef = useRef(true);
  const timerRef = useRef(null);
  const choiceRefs = useRef({});
  const headingRef = useRef(null);
  const detailLayerRef = useRef(null);
  const choiceLayerRef = useRef(null);
  const character = SELECTION_CHARACTERS.find((item) => item.id === previewId);
  const detailVisible = phase === 'detail' || phase === 'return';
  const moving = phase === 'opening' || phase === 'return';
  const spriteFailed = useCallback(() => {
    lockedRef.current = false;
    setPhase('choice');
    setPreviewId(null);
    setError(lang === 'en' ? 'Character could not load. Select again to retry.' : 'Karakter gagal dimuat. Pilih kembali untuk mencoba lagi.');
  }, [lang]);
  const markReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    aliveRef.current = true;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => { aliveRef.current = false; clearTimeout(timerRef.current); media.removeEventListener('change', update); };
  }, []);

  // Keep the next scene mounted under the splash while its first idle frame loads.
  // Inert prevents keyboard / screen-reader access to the hidden layer.
  useEffect(() => {
    if (detailLayerRef.current) detailLayerRef.current.inert = phase !== 'detail';
    if (choiceLayerRef.current) choiceLayerRef.current.inert = phase !== 'choice';
    if (phase === 'detail') {
      const detail = detailLayerRef.current?.querySelector('.spx-detail');
      if (detail) detail.scrollTop = 0;
      headingRef.current?.focus({ preventScroll: true });
    }
    if (phase === 'choice' && previewId) choiceRefs.current[previewId]?.focus({ preventScroll: true });
  }, [phase, previewId]);

  useEffect(() => {
    if (phase !== 'opening' || !ready) return;
    timerRef.current = setTimeout(() => {
      setPhase('detail');
      lockedRef.current = false;
    }, reducedMotion ? 0 : 1150);
    return () => clearTimeout(timerRef.current);
  }, [phase, ready, reducedMotion]);

  const openDetail = (id) => {
    if (lockedRef.current || !SELECTION_CHARACTERS.some((item) => item.id === id)) return;
    lockedRef.current = true;
    setReady(false);
    setPreviewId(id);
    setActiveId(id);
    setError('');
    setPhase('opening');
  };
  const back = () => {
    if (busy || moving || lockedRef.current) return;
    if (phase === 'choice') { onBack?.(); return; }
    lockedRef.current = true;
    setPhase('return');
    setError('');
    timerRef.current = setTimeout(() => { setPhase('choice'); lockedRef.current = false; }, reducedMotion ? 0 : 350);
  };
  const start = async () => {
    const chapterId = Number(levelId);
    if (lockedRef.current || phase !== 'detail' || !character) return;
    if (chapterId !== 1 || typeof onStart !== 'function') {
      setError(lang === 'en' ? 'Return to chapters and reopen this adventure.' : 'Kembali ke chapter dan buka ulang petualangan ini.');
      return;
    }
    lockedRef.current = true;
    setBusy(true);
    setError('');
    try {
      // Preview never calls this handler. App remains the owner of campaign saves.
      const result = await onStart(chapterId, character.id);
      if (result === false || result?.ok === false) throw new Error('START_FAILED');
    } catch {
      if (aliveRef.current) setError(lang === 'en' ? 'Could not save your choice. Please try again.' : 'Pilihan belum berhasil disimpan. Silakan coba lagi.');
    } finally {
      if (aliveRef.current) { setBusy(false); lockedRef.current = false; }
    }
  };

  return (
    <main className="spx" data-phase={phase} data-preview={previewId || undefined} data-ready={ready} aria-busy={busy || moving}>
      <div className="spx-environment" aria-hidden="true"><picture>
        <source media="(max-width: 1050px) and (orientation: portrait)" srcSet={CHARACTER_SELECT_BACKGROUND.mobile} />
        <img src={CHARACTER_SELECT_BACKGROUND.desktop} alt="" fetchPriority="high" />
      </picture></div>
      <div className="spx-world-light" aria-hidden="true" />
      <div ref={detailLayerRef} className="spx-detail-layer" aria-hidden={!detailVisible}>
        {character && phase !== 'choice' && <SinglePlayerCharacterDetail key={character.id} character={character} reducedMotion={reducedMotion} lang={lang}
          busy={busy} error={error} onStart={start} onReady={markReady} onLoadError={spriteFailed} headingRef={headingRef} />}
      </div>
      <div ref={choiceLayerRef} className="spx-choice-layer" aria-hidden={detailVisible}>
        <h1><span>CHOOSE YOUR CHARACTER</span></h1>
        {phase === 'choice' && error && <p className="spx-choice-error spx-error" role="alert">{error}</p>}
        <CinematicCharacterChoice activeId={activeId} selectedId={moving ? previewId : null} disabled={phase !== 'choice'} onFocusCharacter={setActiveId}
          onOpen={openDetail} lang={lang} choiceRefs={choiceRefs} />
      </div>
      <button className="spx-back" type="button" disabled={moving || busy} onClick={back}
        aria-label={lang === 'en' ? (phase === 'choice' ? 'Back to chapters' : 'Back to characters') : (phase === 'choice' ? 'Kembali ke chapter' : 'Kembali ke karakter')}>
        <img src={SELECTION_ART.back} alt="" /><span>{lang === 'en' ? 'BACK' : 'KEMBALI'}</span>
      </button>
    </main>
  );
}
