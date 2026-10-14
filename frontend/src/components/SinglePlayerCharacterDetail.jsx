import React from 'react';
import SinglePlayerIdleSprite from './SinglePlayerIdleSprite';
import { CharacterEmblem } from './CinematicCharacterChoice';
import { SELECTION_ART, SELECTION_ABILITIES } from '../data/characterSelection';

export default function SinglePlayerCharacterDetail({ character, reducedMotion, lang, busy, error, onStart, onReady, onLoadError, headingRef }) {
  const locale = lang === 'en' ? 'en' : 'id';
  return (
    <section className="spx-detail" aria-labelledby="spx-detail-name" data-character={character.id}>
      <div className="spx-detail-figure" aria-hidden="true">
        <span className="spx-contact" />
        <SinglePlayerIdleSprite asset={character.asset} reducedMotion={reducedMotion} onReady={onReady} onLoadError={onLoadError} />
      </div>
      <div className="spx-info-shell">
        <div className="spx-info">
          <div className="spx-panel-ornament" aria-hidden="true"><img src={SELECTION_ART.panel} alt="" /></div>
          <h2 id="spx-detail-name" ref={headingRef} tabIndex={-1}>{character.name}</h2>
          <p className="spx-eyebrow">{character.title}</p>
          <div className="spx-lore">
            <h3>{locale === 'en' ? 'CHARACTER NOTES · DRAFT' : 'CATATAN KARAKTER · DRAF'}</h3>
            <p>{character.lore[locale]}</p>
          </div>
          <div className="spx-abilities" aria-label={locale === 'en' ? 'Role and abilities' : 'Peran dan kemampuan'}>
            <div className="spx-panel-row"><span aria-hidden="true">◇</span><p>{character.role[locale]}</p></div>
            {SELECTION_ABILITIES.map((ability, index) => <React.Fragment key={index}>
              <div className="spx-panel-row"><span aria-hidden="true">{index === 0 ? '◇' : '+'}</span><strong>{ability.name[locale]}</strong></div>
              <div className="spx-panel-row spx-ability-description"><span aria-hidden="true">·</span><small>{ability.description[locale]}</small></div>
            </React.Fragment>)}
          </div>
          <dl className="spx-stats">
            <div><dt>HP</dt><dd>{character.stats.hp}</dd></div>
            <div><dt>{locale === 'en' ? 'Base energy' : 'Energi dasar'}</dt><dd>{character.stats.energy}</dd></div>
            <div><dt>{locale === 'en' ? 'Emblem' : 'Lambang'}</dt><dd><CharacterEmblem character={character} /></dd></div>
          </dl>
        </div>
        <p className="spx-stat-note">{locale === 'en' ? 'Energy is not active in the current battle mode.' : 'Energi belum aktif dalam mode battle saat ini.'}</p>
        <div className="spx-start-area">
          {error && <p className="spx-error" role="alert">{error}</p>}
          <button className="spx-start" type="button" onClick={onStart} disabled={busy} aria-busy={busy}>
            <span>{busy ? (locale === 'en' ? 'SAVING…' : 'MENYIMPAN…') : error ? (locale === 'en' ? 'RETRY START' : 'COBA START LAGI') : 'START'}</span><span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
