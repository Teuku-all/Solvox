import React, { useState } from 'react';
import { PLAYER_ASSETS } from '../data/playerAssets';
import SinglePlayerIdleSprite from './SinglePlayerIdleSprite';

const SINGLE_PLAYER_CHARACTERS = Object.freeze([PLAYER_ASSETS.traveler, PLAYER_ASSETS.asuka]);

export default function SinglePlayerCharacterPicker({ selectedId, onSelect, reducedMotion, t }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [focusedId, setFocusedId] = useState(null);
  const activeId = selectedId || focusedId || hoveredId;

  return (
    <div className="sp-cinema-cast" data-focused={activeId || undefined}>
      {SINGLE_PLAYER_CHARACTERS.map((character) => (
        <button
          key={character.id}
          className="sp-cinema-character"
          type="button"
          data-character={character.id}
          data-active={activeId === character.id}
          data-selected={selectedId === character.id}
          aria-label={t?.(character.nameId) || character.id}
          aria-disabled={Boolean(selectedId)}
          aria-pressed={selectedId === character.id}
          onPointerEnter={(event) => { if (event.pointerType !== 'touch') setHoveredId(character.id); }}
          onPointerLeave={() => setHoveredId(null)}
          onFocus={() => setFocusedId(character.id)}
          onBlur={() => setFocusedId(null)}
          onClick={() => { if (!selectedId) onSelect(character.id); }}
        >
          <span className="sp-cinema-contact" aria-hidden="true" />
          <span className="sp-cinema-figure">
            <SinglePlayerIdleSprite asset={character} reducedMotion={reducedMotion} />
          </span>
          <span className="sp-cinema-reticle" aria-hidden="true"><i /><b /></span>
        </button>
      ))}
    </div>
  );
}
