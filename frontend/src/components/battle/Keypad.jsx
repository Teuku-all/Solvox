import React from 'react';

const KEYS = [
  ['7', '8', '9', 'x', '+'],
  ['4', '5', '6', 'y', '−'],
  ['1', '2', '3', '/', '='],
  ['0', '(', ')', '^', '²'],
  ['a', 'b', 'c', 'z', '·'],
];

const LABEL_KEYS = {
  x: 'variableX', y: 'variableY', a: 'variableA', b: 'variableB', c: 'variableC', z: 'variableZ',
  '/': 'fraction', '−': 'minus', '^': 'power', '²': 'square', '·': 'multiplication',
};

export default function Keypad({ value, onChange, onEnter, disabled = false, t, visible = true }) {
  if (!visible) return null;

  const push = (key) => {
    if (disabled) return;
    if (key === 'backspace') return onChange(value.slice(0, -1));
    if (key === 'clear') return onChange('');
    if (key === 'enter') return onEnter();
    onChange(value + key);
  };
  const label = (key) => key === 'backspace' ? '⌫' : key === 'clear' ? t('clearInput') : key === 'enter' ? '↵' : key;

  return <div className="keypad-panel--legacy keypad-panel" aria-label={t('keyboardLabel')}>
    <div className="keypad-grid">
      {KEYS.flat().map((key) => <button
        key={key}
        type="button"
        disabled={disabled}
        onClick={() => push(key)}
        className={`keypad-key--legacy keypad-key ${/^\d$/.test(key) ? 'is-number' : ''} ${['+', '−', '/', '·'].includes(key) ? 'is-operator' : ''} ${['x', 'y', 'a', 'b', 'c', 'z'].includes(key) ? 'is-variable' : ''} ${['^', '²'].includes(key) ? 'is-power' : ''} ${key === '/' ? 'is-fraction' : ''} ${key === '−' ? 'is-minus' : ''}`}
        aria-label={LABEL_KEYS[key] ? t(LABEL_KEYS[key]) : label(key)}
        title={LABEL_KEYS[key] ? t(LABEL_KEYS[key]) : label(key)}
      ><span>{label(key)}</span></button>)}
    </div>
    <div className="keypad-footer">
      <button type="button" disabled={disabled} onClick={() => push('backspace')} className="keypad-key--legacy is-backspace" aria-label={t('backspace')} title={t('backspace')}>⌫</button>
      <button type="button" disabled={disabled} onClick={() => push('clear')} className="keypad-key--legacy is-clear">{t('clearInput')}</button>
      <button type="button" disabled={disabled} onClick={() => push('enter')} className="keypad-key--legacy is-enter">↵</button>
    </div>
  </div>;
}
