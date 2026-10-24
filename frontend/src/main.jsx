import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/shared/ErrorBoundary';
import './styles/base.css';
import './styles/ui-tokens.css';
import './styles/ui-accent-tokens.css';
import './styles/feedback-diagnostics.css';
import './styles/shared-surfaces.css';
import './styles/chapter-select.css';
import './styles/character-select.css';
import './styles/mode-select.css';
import './styles/battle.css';
import './styles/utility-art.css';
import './styles/brand-logo.css';
import './styles/home-menu.css';
import './styles/font-display.css';
import './styles/visual-cohesion.css';
import './styles/typography-modals.css';
import './styles/multiplayer-arena.css';
import './styles/tutorial.css';
import './styles/evaluation.css';
import './styles/responsive.css';
import './styles/multiplayer-characters.css';
import './styles/multiplayer-lobby.css';
import './styles/multiplayer-result.css';
import './styles/home-profile.css';
import './styles/profile-screen.css';
import './styles/math-simulation.css';
import './styles/leaderboard.css';
import './styles/ui-polish.css';
import './styles/game-design-system.css';
import './styles/feedback-contact.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary><App/></ErrorBoundary>
  </React.StrictMode>
);
