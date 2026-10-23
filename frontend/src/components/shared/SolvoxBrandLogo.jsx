import React from 'react';
import { responsiveAsset } from '../../services/optimizedAssets';

/** V89 — single-source Solvox image logo. */
export default function SolvoxBrandLogo({ compact = false, className = '' }) {
  return (
    <div
      className={`solvox-brand${compact ? ' is-compact' : ''}${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="Solvox"
    >
      <img
        {...responsiveAsset('/assets/ui/brand/solvox-logo-v89.png', '300px')}
        alt="Solvox"
        draggable="false"
      />
    </div>
  );
}
