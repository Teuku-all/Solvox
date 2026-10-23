import React from 'react';
import DeferredBackdrop from '../shared/DeferredBackdrop';
import SolvoxBackButton from '../shared/SolvoxBackButton';
import { responsiveAsset } from '../../services/optimizedAssets';

const DEVS = [
  { name: 'Teuku Al Jumanatul Ali', roleKey: 'developerRoleEngineering', copyKey: 'developerTeuku' },
  { name: 'Ahmad Daniel Chalid', roleKey: 'developerRoleDesign', copyKey: 'developerAhmad' },
  { name: 'Yanni Zuhilda', roleKey: 'developerRoleContent', copyKey: 'developerYanni' },
];

export default function AboutDevelopers({ t, lang, onBack }) {
  return (
    <main className="about-page" data-lang={lang}>
      <div className="about-bg" aria-hidden="true">
        <DeferredBackdrop src="/assets/home/home-background-v83.mp4" poster="/assets/home/home-background-v83-poster.jpg" />
        <div className="about-bg-shade" />
      </div>

      <SolvoxBackButton className="about-back" onClick={onBack} label={t('back')} />

      <section className="about-shell" aria-labelledby="about-title">
        <div className="about-team-brand" aria-label="Zero to One Game Development Team">
          <img {...responsiveAsset('/assets/ui/brand/zero-to-one-team.png', '(max-width: 760px) 290px, 360px')} alt="Zero to One Game Development Team" className="about-team-brand-img" draggable="false" fetchPriority="high" />
        </div>
        <div className="about-kicker">{t('aboutUs')}</div>
        <h1 id="about-title">{t('aboutUsTitle')}</h1>
        <p className="about-intro">{t('aboutUsIntro')}</p>
        <div className="about-divider" />
        <div className="about-grid">
          {DEVS.map((dev, index) => (
            <article className="about-card" key={dev.name}>
              <div className="about-index">0{index + 1}</div>
              <div>
                <h2>{dev.name}</h2>
                <span>{t(dev.roleKey)}</span>
                <p>{t(dev.copyKey)}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="about-footer">{t('aboutUsFooter')}</p>
      </section>
    </main>
  );
}
