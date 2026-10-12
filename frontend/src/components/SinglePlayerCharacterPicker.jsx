import React from 'react';
import { getPlayerAsset } from '../data/playerAssets';

const SINGLE_PLAYER_CHARACTERS = Object.freeze([
  { id: 'traveler' },
  { id: 'asuka' },
]);

export default function SinglePlayerCharacterPicker({ value = 'traveler', onChange, t }) {
  const selectedIndex = Math.max(0, SINGLE_PLAYER_CHARACTERS.findIndex((item) => item.id === value));
  const previous = SINGLE_PLAYER_CHARACTERS[(selectedIndex - 1 + SINGLE_PLAYER_CHARACTERS.length) % SINGLE_PLAYER_CHARACTERS.length];
  const next = SINGLE_PLAYER_CHARACTERS[(selectedIndex + 1) % SINGLE_PLAYER_CHARACTERS.length];
  const selectedAsset = getPlayerAsset(selected.id);
  const previousAsset = getPlayerAsset(previous.id);
  const nextAsset = getPlayerAsset(next.id);

  const move = (direction) => {
    const nextIndex = (selectedIndex + direction + SINGLE_PLAYER_CHARACTERS.length) % SINGLE_PLAYER_CHARACTERS.length;
    onChange?.(SINGLE_PLAYER_CHARACTERS[nextIndex].id);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
  };

  return (
    <section
      className="character-carousel"
      role="group"
      aria-label={t('characterSelect')}
      onKeyDown={handleKeyDown}
    >
      <button
        className="character-side-preview is-left"
        type="button"
        onClick={() => onChange?.(previous.id)}
        aria-label={`${t('selectCharacter')} ${t(previousAsset.nameId)}`}
        title={t(previousAsset.nameId)}
      >
        <img src={previousAsset.portrait} alt="" draggable="false" />
      </button>

      <button
        className="character-carousel-arrow is-left"
        type="button"
        onClick={() => move(-1)}
        aria-label={t('previousCharacter')}
      >
        <span aria-hidden="true">◀</span>
      </button>

      <div className="character-hero-card" aria-live="polite" aria-atomic="true">
        <div className="character-hero-inner" />
        <div className="character-hero-content">
          <strong className="character-hero-name">{t(selectedAsset.nameId).toUpperCase()}</strong>
          <img
            key={selected.id}
            className={`character-hero-sprite character-hero-sprite-${selected.id}`}
            src={selectedAsset.portrait}
            alt={t(selectedAsset.nameId)}
            draggable="false"
          />
          <span className="character-hero-role">{t(selectedAsset.roleId)}</span>
        </div>
      </div>

      <button
        className="character-carousel-arrow is-right"
        type="button"
        onClick={() => move(1)}
        aria-label={t('nextCharacter')}
      >
        <span aria-hidden="true">▶</span>
      </button>

      {next.id !== previous.id && (
        <button
          className="character-side-preview is-right"
          type="button"
          onClick={() => onChange?.(next.id)}
          aria-label={`${t('selectCharacter')} ${t(nextAsset.nameId)}`}
          title={t(nextAsset.nameId)}
        >
          <img src={nextAsset.portrait} alt="" draggable="false" />
        </button>
      )}
    </section>
  );
}
