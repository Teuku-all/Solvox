import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import SolvoxUtilityArt from './SolvoxUtilityArt';
import PixelIcon from './PixelIcon';

const STEPS = [
  ['01','tutorialModeTitle','tutorialModeBody'],
  ['02','tutorialQuestionTitle','tutorialQuestionBody'],
  ['03','tutorialAttackTitle','tutorialAttackBody'],
  ['04','tutorialHintTitle','tutorialHintBody'],
  ['05','tutorialFeedbackTitle','tutorialFeedbackBody'],
  ['06','tutorialBossTitle','tutorialBossBody'],
];

export default function Tutorial({ t, onClose }) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  return createPortal(
    <div className="tutorial-backdrop" role="dialog" aria-modal="true" aria-labelledby="tutorial-title" onClick={onClose}>
      <section className="tutorial-card" onClick={(event) => event.stopPropagation()}>
        <header className="tutorial-head">
          <div className="tutorial-kicker">{t('tutorialKicker')}</div>
          <div className="tutorial-title-wrap">
            <div>
              <h2 id="tutorial-title">{t('tutorialTitle')}</h2>
              <p>{t('tutorialIntro')}</p>
            </div>
            <button className="tutorial-close" type="button" onClick={onClose} aria-label={t('close')} title={t('close')}>
              <SolvoxUtilityArt name="close" size={16} />
            </button>
          </div>
        </header>

        <div className="tutorial-grid">
          {STEPS.map(([num,titleKey,bodyKey]) => (
            <article className="tutorial-step" key={num}>
              <span className="tutorial-step-index">{num}</span>
              <div className="tutorial-step-copy">
                <h3>{t(titleKey)}</h3>
                <p>{t(bodyKey)}</p>
              </div>
            </article>
          ))}
        </div>

        <footer className="tutorial-footer">
          <div className="tutorial-footer-tip">
            <span className="tutorial-footer-icon" aria-hidden="true"><PixelIcon name="hint" size={18} /></span>
            <p>{t('tutorialTip')}</p>
          </div>
          <button className="primary-btn tutorial-action" type="button" onClick={onClose}>{t('tutorialGotIt')}</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
