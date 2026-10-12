import React from 'react';
import { BOSSES } from '../data/bosses';
import { getBossPreviewSrc } from '../data/bossAssets';
import { PLAYER_ASSETS } from '../data/playerAssets';
import PixelIcon from './PixelIcon';

export const MULTIPLAYER_CHARACTERS = Object.freeze([
  { id: 'traveler', nameId: 'characterTraveler', roleId: 'characterTravelerRole', portrait: PLAYER_ASSETS.traveler.portrait, accent: '#efbd52', kind: 'player' },
  { id: 'asuka', nameId: 'characterAsuka', roleId: 'characterAsukaRole', portrait: PLAYER_ASSETS.asuka.portrait, accent: '#f17a83', kind: 'player' },
  ...Object.values(BOSSES).map((boss) => ({
    id: boss.spriteId,
    nameId: `character_${boss.spriteId}`,
    roleId: `character_${boss.spriteId}_role`,
    portrait: getBossPreviewSrc(boss.spriteId),
    accent: boss.accent,
    kind: 'boss',
  })),
]);

export function findCharacter(characterId) {
  return MULTIPLAYER_CHARACTERS.find((character) => character.id === characterId)
    || MULTIPLAYER_CHARACTERS[0];
}

export default function CharacterPicker({ value = 'traveler', onChange, compact = false, t }) {
  const selectedId = findCharacter(value).id;

  return (
    <div className={`character-picker ${compact ? 'compact' : ''}`} role="group" aria-label={t('characterSelect')}>
      {MULTIPLAYER_CHARACTERS.map((character) => {
        const selected = selectedId === character.id;
        const name = t(character.nameId);
        return (
          <button
            key={character.id}
            type="button"
            className={`character-choice ${selected ? 'selected' : ''}`}
            style={{ '--character-accent': character.accent }}
            onClick={() => onChange?.(character.id)}
            aria-pressed={selected}
            aria-label={`${name}, ${t(character.roleId)}`}
            title={`${name} · ${t(character.roleId)}`}
          >
            <span className={`character-choice-icon ${character.kind === 'boss' ? 'is-boss' : ''}`}>
              <img src={character.portrait} alt="" draggable="false" loading="lazy" />
            </span>
            <span className="character-choice-copy">
              <strong>{name}</strong>
              <small>{t(character.roleId)}</small>
            </span>
            {selected && <span className="character-check"><PixelIcon name="check" size={10}/></span>}
          </button>
        );
      })}
    </div>
  );
}
