import React, { useState } from 'react';
import SolvoxBrandLogo from './SolvoxBrandLogo';

const NAV_ITEMS = [
  { id: 'play', labelKey: 'homeMain' },
  { id: 'tutorial', labelKey: 'homeTutorial' },
  { id: 'dashboard', labelKey: 'homeDashboard' },
  { id: 'settings', labelKey: 'homeSettings' },
  { id: 'feedback', labelKey: 'homeFeedback' },
];

export default function HomeMenu({ onMain, onTutorial, onSettings, onFeedback, onDashboard, onProfile, profileName, t }) {
  const [activeNav, setActiveNav] = useState('play');
  const activate = (id) => {
    setActiveNav(id);
    if (id === 'play') return onMain?.();
    if (id === 'tutorial') return onTutorial?.();
    if (id === 'dashboard') return onDashboard?.();
    if (id === 'settings') return onSettings?.();
    if (id === 'feedback') return onFeedback?.();
  };

  return (
    <div className="home-menu" data-ui="solvox-home">
      <div className="home-menu-backdrop" aria-hidden="true">
        <video
          className="home-menu-backdrop-video"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/assets/home/home-background-v83-poster.jpg"
        >
          <source src="/assets/home/home-background-v83.mp4" type="video/mp4" />
        </video>
        <div className="home-menu-shade" />
      </div>

      <button className="home-profile-trigger" type="button" onClick={onProfile} aria-label={t('profileTitle')} title={t('profileTitle')}>
        <span className="home-profile-avatar">{String(profileName||'P').trim().slice(0,1).toUpperCase()}</span>
        <span className="home-profile-trigger-copy"><small>{t('profileTitle')}</small><b>{profileName||'Player'}</b></span>
        <span className="home-profile-trigger-arrow" aria-hidden="true">⌄</span>
      </button>

      <aside className="home-menu-nav" aria-label={t('menu')}>
        <div className="home-menu-brand" aria-label="Solvox">
          <SolvoxBrandLogo />
        </div>

        <nav className="home-menu-menu">
          {NAV_ITEMS.map((item) => {
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={`home-menu-item${active ? ' is-active' : ''}`}
                onClick={() => activate(item.id)}
                aria-current={active ? 'page' : undefined}
              >
                <span className="home-menu-marker" aria-hidden="true" />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="home-menu-content" aria-hidden="true" />
    </div>
  );
}
