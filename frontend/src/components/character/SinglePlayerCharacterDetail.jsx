import React from 'react';
import SinglePlayerIdleSprite from './SinglePlayerIdleSprite';
import { CharacterEmblem } from './CinematicCharacterChoice';
import { SELECTION_ABILITIES } from '../../data/characterSelection';

export default function SinglePlayerCharacterDetail({ character, levelId, reducedMotion, lang, busy, error, onStart, onReady, onLoadError, headingRef }) {
  const locale = lang === 'en' ? 'en' : 'id';
  const abilities = Number(levelId) === 1 ? [
    { name: { id: 'Serangan', en: 'Attack' }, description: { id: 'Simulasi yang selesai memicu serangan otomatis.', en: 'Completing the simulation triggers an automatic attack.' } },
    { name: { id: 'Simulasi', en: 'Simulation' }, description: { id: 'Seimbangkan kedua ruas untuk menemukan nilai variabel.', en: 'Balance both sides to find the variable value.' } },
  ] : SELECTION_ABILITIES;
  return (
    <section className="spx-detail" aria-labelledby="spx-detail-name" data-character={character.id}>
      <div className="spx-detail-figure" aria-hidden="true">
        <span className="spx-contact" />
        <SinglePlayerIdleSprite asset={character.asset} reducedMotion={reducedMotion} onReady={onReady} onLoadError={onLoadError} />
      </div>
      <div className="spx-info-shell">
        <div className="spx-info">
          <div className="spx-panel-ornament" aria-hidden="true" />
          <h2 id="spx-detail-name" ref={headingRef} tabIndex={-1}>{character.name}</h2>
          <p className="spx-eyebrow">{character.title}</p>
          <div className="spx-lore">
            <h3>{locale === 'en' ? 'CHARACTER STORY' : 'KISAH KARAKTER'}</h3>
            <p>{character.lore[locale]}</p>
          </div>
          <div className="spx-abilities" aria-label={locale === 'en' ? 'Role and abilities' : 'Peran dan kemampuan'}>
            <div className="spx-panel-row"><span aria-hidden="true">◇</span><p>{character.role[locale]}</p></div>
            {abilities.map((ability, index) => <div className="spx-panel-row" key={index}>
              <span aria-hidden="true">{index === 0 ? '◇' : '+'}</span>
              <div><strong>{ability.name[locale]}</strong><p className="spx-ability-description">{ability.description[locale]}</p></div>
            </div>)}
          </div>
          <dl className="spx-stats">
            <div><dt>HP</dt><dd>{character.stats.hp}</dd></div>
            <div><dt>{locale === 'en' ? 'Emblem' : 'Lambang'}</dt><dd><CharacterEmblem character={character} /></dd></div>
          </dl>
        </div>
        <p className="spx-stat-note">{locale === 'en' ? 'Your character stays with you throughout the campaign.' : 'Karakter pilihanmu akan menemanimu sepanjang petualangan.'}</p>
        <div className="spx-start-area">
          {error && <p className="spx-error" role="alert">{error}</p>}
          <button className="spx-start" type="button" onClick={onStart} disabled={busy} aria-busy={busy}>
            <span>{busy ? (locale === 'en' ? 'SAVING…' : 'MENYIMPAN…') : error ? (locale === 'en' ? 'RETRY START' : 'COBA LAGI') : (locale === 'en' ? 'START STAGE' : 'MULAI STAGE')}</span><span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
