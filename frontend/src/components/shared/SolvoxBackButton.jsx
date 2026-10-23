import React from 'react';

const BACK_ART = '/assets/ui/character-select/buttons/back.webp';

export default function SolvoxBackButton({
  className = '',
  label,
  labelClassName = '',
  ariaLabel,
  title,
  onClick,
  disabled = false,
  type = 'button',
}) {
  return (
    <button
      className={`solvox-back-button ${className}`.trim()}
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      title={title}
    >
      <img src={BACK_ART} alt="" aria-hidden="true" draggable="false" />
      {label&&<span className={`solvox-back-button-label ${labelClassName}`.trim()}>{label}</span>}
    </button>
  );
}
