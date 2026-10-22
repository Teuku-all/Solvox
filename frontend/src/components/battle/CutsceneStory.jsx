import React, { useEffect, useState } from 'react';
import { CUTSCENE_ASSETS } from '../../data/story';
import '../../styles/cutscene-story.css';

export default function CutsceneStory({
  dialogues = [],
  chapterId,
  characterType = 'traveler',
  canSkip = false,
  lang = 'id',
  onComplete,
  onSkip,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAuto, setIsAuto] = useState(false);
  const currentBeat = dialogues[currentIndex] || {};
  const playerSpeaker = characterType === 'asuka' ? 'asuna' : 'kazura';
  const activeSpeakerId = Object.prototype.hasOwnProperty.call(CUTSCENE_ASSETS.speakers, currentBeat.speaker)
    ? currentBeat.speaker
    : 'narrator';
  const isPlayerSpeaking = activeSpeakerId === playerSpeaker;
  const speakerAsset = CUTSCENE_ASSETS.speakers[activeSpeakerId];
  const defaultOpponent = CUTSCENE_ASSETS.speakers[CUTSCENE_ASSETS.chapterOpponents[chapterId]];
  const isOpponentSpeaking = activeSpeakerId !== 'narrator' && !isPlayerSpeaking;
  const opponent = isOpponentSpeaking && speakerAsset?.splash ? speakerAsset : defaultOpponent;
  const english = lang === 'en';

  useEffect(() => {
    if (!isAuto || currentIndex >= dialogues.length - 1) {
      setIsAuto(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setCurrentIndex((index) => index + 1), 3500);
    return () => window.clearTimeout(timer);
  }, [isAuto, currentIndex, dialogues.length]);

  const handleNext = () => {
    if (currentIndex < dialogues.length - 1) {
      setCurrentIndex((index) => index + 1);
      return;
    }
    onComplete?.();
  };

  if (!dialogues.length) return null;

  const playerName = characterType === 'asuka' ? 'ASUNA' : 'KAZURA';
  const speakerName = speakerAsset?.[lang] || (english ? 'NARRATOR' : 'NARATOR');

  return (
    <div className="cutscene" role="dialog" aria-modal="true" aria-label={english ? 'Story scene' : 'Adegan cerita'}>
      <button className="cutscene__backdrop" type="button" aria-label={english ? 'Continue story' : 'Lanjutkan cerita'} onClick={handleNext} />

      <div className="cutscene__portraits" aria-hidden="true">
        <div className={`cutscene__portrait cutscene__portrait--player${isPlayerSpeaking ? ' is-speaking' : ''}`}>
          <img
            className="cutscene__splash"
            src={CUTSCENE_ASSETS.players[characterType] || CUTSCENE_ASSETS.players.traveler}
            alt=""
          />
          <span>{playerName}</span>
        </div>
        <div
          key={isOpponentSpeaking ? activeSpeakerId : CUTSCENE_ASSETS.chapterOpponents[chapterId]}
          className={`cutscene__portrait cutscene__portrait--npc${isOpponentSpeaking ? ' is-speaking' : ''}`}
        >
          {opponent?.splash && <img className="cutscene__splash" src={opponent.splash} alt="" />}
          <span>{isOpponentSpeaking ? speakerName : (english ? defaultOpponent?.en : defaultOpponent?.id)}</span>
        </div>
      </div>

      <section className="cutscene__panel" aria-live="polite">
        <div className="cutscene__speaker">{speakerName}</div>
        <button className="cutscene__text" type="button" onClick={handleNext}>
          {currentBeat[lang] || ''}
        </button>
        <div className="cutscene__controls">
          <span className="cutscene__counter">{currentIndex + 1} / {dialogues.length}</span>
          <div className="cutscene__actions">
            <button
              className={`cutscene__button${isAuto ? ' is-active' : ''}`}
              type="button"
              aria-pressed={isAuto}
              onClick={() => setIsAuto((value) => !value)}
            >
              {isAuto ? (english ? 'Auto: ON' : 'Otomatis: NYALA') : (english ? 'Auto' : 'Otomatis')}
            </button>
            <button className="cutscene__button cutscene__button--primary" type="button" onClick={handleNext}>
              {currentIndex < dialogues.length - 1
                ? (english ? 'Next' : 'Lanjut')
                : (english ? 'Finish' : 'Selesai')}
            </button>
            <button
              className="cutscene__button cutscene__button--skip"
              type="button"
              disabled={!canSkip}
              aria-label={english ? 'Skip cutscene' : 'Lewati cutscene'}
              onClick={onSkip || onComplete}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M3 5v14l8-7-8-7Zm8 0v14l8-7-8-7Zm10 0v14" />
              </svg>
              {english ? 'Skip' : 'Lewati'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
