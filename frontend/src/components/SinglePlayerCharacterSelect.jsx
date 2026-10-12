import React, { useState } from 'react';
import { LEVELS } from '../data/levels';
import { getPlayerAsset } from '../data/playerAssets';
import PixelIcon from './PixelIcon';
import SinglePlayerCharacterPicker from './SinglePlayerCharacterPicker';

export default function SinglePlayerCharacterSelect({
  levelId,
  playerId = 'traveler',
  onPlayerChange,
  onBack,
  onStart,
  t,
  lang,
}) {
  const [launching, setLaunching] = useState(false);
  const level = LEVELS.find((item) => item.id === Number(levelId)) || LEVELS[0];
  const selectedCharacter = getPlayerAsset(playerId);

  const handleStart = () => {
    if (launching) return;
    const chapterId = Number(levelId);
    if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > LEVELS.length) return;
    setLaunching(true);
    onStart?.(chapterId, playerId);
  };

  const handleCancel = () => {
    if (launching) return;
    onBack?.();
  };

  return (
    <div className="character-select-screen">
      <div className="character-select-atmosphere" aria-hidden="true">
        <span className="pixel-star star-one" />
        <span className="pixel-star star-two" />
        <span className="pixel-star star-three" />
      </div>

      <header className="character-select-header">
        <button className="character-select-back" type="button" onClick={handleCancel} disabled={launching}>
          <PixelIcon name="left" size={16} />
          <span>{t('back')}</span>
        </button>
        <h1>{t('characterSelectTitle')}</h1>
        <div className="character-select-chapter" aria-label={`${t('chapter')} ${level.id}`}>
          <small>{t('chapter')} {level.id}</small>
          <strong>{lang === 'en' ? level.titleEn : level.title}</strong>
        </div>
      </header>

      <main className="character-select-main">
        <p className="character-select-hint">{t('chooseCharacterHint')}</p>
        <SinglePlayerCharacterPicker value={playerId} onChange={onPlayerChange} t={t} />

        <section className="character-start-panel" aria-label={t('gameStartPrompt')}>
          <h2>{t('gameStartPrompt')}</h2>
          <div className="character-start-options">
            <button
              className="character-start-option is-yes"
              type="button"
              disabled={launching}
              aria-busy={launching}
              onClick={handleStart}
            >
              <span className="character-start-cursor" aria-hidden="true">▶</span>
              <span>{launching ? t('loading') : t('yes')}</span>
            </button>
            <button className="character-start-option is-no" type="button" disabled={launching} onClick={handleCancel}>
              <span>{t('no')}</span>
            </button>
          </div>
          <p className="character-start-caption">
            {t('selectedCharacter')}: <strong>{t(selectedCharacter.nameId)}</strong>
          </p>
        </section>
      </main>
    </div>
  );
}
