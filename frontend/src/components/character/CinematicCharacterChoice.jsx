import React from 'react';
import { SELECTION_ART, SELECTION_CHARACTERS } from '../../data/characterSelection';

export function CharacterEmblem({ character }) {
  return character.emblem === 'crystal'
    ? <img className="spx-emblem" src={SELECTION_ART.crystal} alt="" />
    : <svg className="spx-emblem spx-sword" viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M24 3 39 11v15L24 44 9 26V11Z" stroke="currentColor" strokeWidth="1"/><path d="m24 8 4 7-2 15h-4l-2-15Z M15 28l9 4 9-4 M24 32v7" stroke="currentColor" strokeWidth="2"/></svg>;
}

export default function CinematicCharacterChoice({ activeId, selectedId, disabled, onFocusCharacter, onOpen, lang, choiceRefs }) {
  const previewLabel = lang === 'en' ? 'Preview' : 'Lihat detail';
  return (
    <div className="spx-choices" data-focused={activeId || undefined}>
      {SELECTION_CHARACTERS.map((character, index) => (
        <div className="spx-choice" data-side={index === 0 ? 'left' : 'right'} data-character={character.id}
          data-active={activeId === character.id} data-selected={selectedId === character.id} key={character.id}
          onPointerEnter={(e) => { if (e.pointerType !== 'touch') onFocusCharacter(character.id); }}
          onPointerLeave={() => onFocusCharacter(document.activeElement?.closest('.spx-choice')?.dataset.character || null)}
          onFocus={() => onFocusCharacter(character.id)}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) onFocusCharacter(null); }}>
          <button ref={(node) => { choiceRefs.current[character.id] = node; }} type="button" className="spx-art-button"
            aria-label={`${previewLabel} ${character.name}`} disabled={disabled} onClick={() => onOpen(character.id)}>
            <span className="spx-region-light" />
            <img className="spx-splash" src={character.splash} alt="" draggable="false" fetchPriority="high" />
          </button>
          <div className="spx-nameplate">
            <img className="spx-nameplate-art" src={SELECTION_ART.banner} alt="" />
            <button className="spx-name-button" type="button" tabIndex={-1} disabled={disabled} onClick={() => onOpen(character.id)} aria-label={`${previewLabel} ${character.name}`}>
              <CharacterEmblem character={character} />
              <span><strong>{character.name}</strong><small>{character.title}</small></span>
            </button>
            <button className="spx-eye" type="button" disabled={disabled} aria-label={`${previewLabel} ${character.name} — preview`} onClick={() => onOpen(character.id)}>
              <img src={SELECTION_ART.eye} alt="" />
            </button>
          </div>
        </div>
      ))}
      <svg className="spx-diagonal" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <path className="spx-seam-halo" d="M580 -20 420 1020" />
        <path className="spx-seam-gold" d="M583 -20 423 1020" />
        <path className="spx-seam-line" d="M580 -20 420 1020" />
      </svg>
      <div className="spx-seam" aria-hidden="true">
        <img className="spx-seam-crystal" src={SELECTION_ART.divider} alt="" />
        <img className="spx-seam-glint" src={SELECTION_ART.divider} alt="" />
      </div>
    </div>
  );
}
