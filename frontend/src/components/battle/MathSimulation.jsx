import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SIMULATIONS, STORY_MODELS, STORY_MODELS_EN, operationLabel } from '../../data/algebraSimulation';
import PixelIcon from '../shared/PixelIcon';

const copy = {
  id: {
    modes: { balance: 'Timbangan aljabar', groups: 'Kelompok setara', symbolic: 'Operasi simbolik' },
    sides: ['Ruas kiri', 'Ruas kanan'], model: 'Rakit model cerita',
    prompts: { variable: 'Apa arti x dalam cerita?', relation: 'Relasi mana yang sesuai?', equation: 'Persamaan mana yang sesuai dengan cerita?' },
    before: 'Sebelum', after: 'Sesudah', step: 'Langkah', undo: 'Urungkan',
    choose: 'pilih langkah',
    oneSide: 'Ubah ruas kiri saja', sign: 'Ubah tanda tanpa operasi',
    firstTerm: 'Ubah suku pertama saja',
    equal: 'Kesetaraan harus dipertahankan. Terapkan operasi yang sama pada kedua ruas.',
    term: 'Operasi ini harus diterapkan pada semua suku yang berkaitan.',
    signError: 'Tanda tidak berubah sendiri. Pilih operasi yang sah untuk mengubah persamaan.',
    modelErrors: {
      variable: 'Perhatikan besaran yang ditanyakan. x harus mewakili besaran itu sebelum relasi disusun.',
      relation: 'Periksa kata pembanding, jumlah barang, atau perpindahan dalam cerita.',
      equation: 'Cocokkan kedua ruas dengan total atau jumlah yang benar-benar disebutkan dalam cerita.',
    },
    modelDone: 'Model sudah sesuai. Sekarang selesaikan persamaannya.',
    stepDone: 'Langkah sah. Persamaan tetap setara.',
    ready: 'Persamaan selesai. Konfirmasi nilai variabel di kolom jawaban untuk menyerang.',
    balancePrompt: 'Selesaikan persamaan berikut dengan menggunakan timbangan.',
    groupPrompt: 'Bagi kedua ruas menjadi kelompok yang sama banyak untuk menemukan nilai setiap kelompok.',
    chapter: 'Chapter', question: 'Soal',
    tilePicker: 'Seret ubin', tileNumbers: 'Ubin bilangan', tileVariables: 'Ubin variabel',
    applyBoth: 'Terapkan ke kedua ruas', tileWrong: 'Pilih operasi yang membantu menyederhanakan persamaan saat ini.',
    balanceGuide: 'Seret ubin ke alas. Ubin bernilai lawan pada alas yang sama akan saling menghilang.',
    addUnit: 'Kotak +1', balanceHint: 'Coba lakukan hal yang sama pada ruas satunya agar timbangan kembali seimbang.',
    balanceStates: { left: 'Ruas kiri lebih berat', center: 'Timbangan seimbang', right: 'Ruas kanan lebih berat' },
    solvedLabel: 'Timbangan seimbang!',
    applyOperation: 'Pilih operasi, lalu terapkan pada kedua ruas.', applyOtherSide: 'Sekarang terapkan operasi yang sama pada ruas lainnya.', applyLeft: 'Terapkan di ruas kiri', applyRight: 'Sekarang terapkan juga di ruas kanan',
    operationMismatch: 'Operasi yang sama harus diterapkan pada kedua ruas. Coba pilih operasi yang menyederhanakan persamaan.',
    hint: 'Petunjuk langkah berikutnya',
    zero: '+1 dan −1 membentuk pasangan nol.',
    result: 'Nilai variabel',
  },
  en: {
    modes: { balance: 'Algebra balance', groups: 'Equal groups', symbolic: 'Symbolic operations' },
    sides: ['Left side', 'Right side'], model: 'Build the story model',
    prompts: { variable: 'What does x represent?', relation: 'Which relationship matches the story?', equation: 'Which equation matches the story?' },
    before: 'Before', after: 'After', step: 'Step', undo: 'Undo',
    choose: 'choose a step',
    oneSide: 'Change the left side only', sign: 'Change a sign without an operation',
    firstTerm: 'Change the first term only',
    equal: 'Keep the equality balanced. Apply the same operation to both sides.',
    term: 'Apply this operation to every relevant term.',
    signError: 'A sign cannot change by itself. Choose a valid operation.',
    modelErrors: {
      variable: 'Check which quantity the question asks for. Let x represent that quantity.',
      relation: 'Check the comparison, item count, or transfer described in the story.',
      equation: 'Match both sides to the total or quantity actually given in the story.',
    },
    modelDone: 'The model matches the story. Now solve the equation.',
    stepDone: 'Valid step. The equation remains equal.',
    ready: 'Equation solved. Confirm the variable value in the answer field to attack.',
    balancePrompt: 'Solve the equation below using the balance scale.',
    groupPrompt: 'Split both sides into the same number of equal groups to find the value in each group.',
    chapter: 'Chapter', question: 'Question',
    tilePicker: 'Drag a tile', tileNumbers: 'Number tiles', tileVariables: 'Variable tiles',
    applyBoth: 'Apply to both sides', tileWrong: 'Choose an operation that simplifies the current equation.',
    balanceGuide: 'Drag a tile to a pan. Opposite values on the same pan cancel each other.',
    addUnit: '+1 tile', balanceHint: 'Try doing the same on the other side to balance the scale again.',
    balanceStates: { left: 'Left side is heavier', center: 'Scale balanced', right: 'Right side is heavier' },
    solvedLabel: 'Balance restored!',
    applyOperation: 'Choose an operation, then apply it to both sides.', applyOtherSide: 'Now apply the same operation to the other side.', applyLeft: 'Apply to left side', applyRight: 'Now apply it to the right side too',
    operationMismatch: 'Apply the same operation to both sides. Choose the operation that simplifies the equation.',
    hint: 'Hint for the next step',
    zero: '+1 and −1 form a zero pair.',
    result: 'Variable value',
  },
};

const splitEquation = (equation) => equation.split('=').map((side) => side.trim());
function showOperationOnBothSides(equation, operation, lang) {
  const [left, right] = splitEquation(equation);
  const [, rawSymbol, rawValue] = operation.match(/^([+\-*/])\s*(.+)$/) || [];
  if (!rawSymbol || !rawValue) return equation;
  const symbols = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  const value = rawValue.replace(/-/g, '−');
  const operand = /^[−+]/.test(value) || /[\/.,]/.test(value) ? `(${value})` : value;
  return `(${left}) ${symbols[rawSymbol]} ${operand} = (${right}) ${symbols[rawSymbol]} ${operand}`;
}
const localizeEquation = (equation, lang) => lang === 'en'
  ? equation.replace(/\b\d{1,3}(?:\.\d{3})+\b/g, (number) => number.replace(/\./g, ','))
    .replace(/(\d),(\d)(?!\d{2,})/g, '$1.$2')
  : equation;

function balanceTiles(term) {
  const token = term.replace(/\s+/g, '');
  const number = Number(token.replace(',', '.'));
  const kind = /[a-z]/i.test(token) ? 'is-variable' : number < 0 ? 'is-negative' : Number.isFinite(number) && Math.abs(number) > 9 ? 'is-total' : 'is-unit';
  return <span className={kind}>{token.replace(/-/g, '−')}</span>;
}

function Side({ text, mode, groups = 0 }) {
  const terms = mode === 'balance' ? text.match(/[+-]?\s*(?:\d+(?:[.,]\d+)?\s*[a-z]|[a-z]|\d+(?:[.,]\d+)?)/gi) : null;
  const group = mode === 'groups' && text.match(/^(-?)(\d+)([a-z])$/i);
  const expressionGroup = mode === 'groups' && text.match(/^(\d+)(\([^)]*\))$/);
  const groupTotal = Number(text.replace(/[.,]/g, ''));
  return <div className={`math-sim-side math-sim-side-${mode}`}>
    {groups > 1 && groups <= 8 && Number.isInteger(groupTotal) && groupTotal % groups === 0 ? (
      <div className="math-sim-tiles" aria-label={text}>
        {Array.from({ length: groups }, (_, index) => <span className="is-unit" key={index}>{groupTotal / groups}</span>)}
      </div>
    ) : expressionGroup && Number(expressionGroup[1]) <= 8 ? (
      <div className="math-sim-tiles" aria-label={text}>
        {Array.from({ length: Number(expressionGroup[1]) }, (_, index) => <span className="is-variable" key={index}>{expressionGroup[2]}</span>)}
      </div>
    ) : group && Number(group[2]) <= 8 ? (
      <div className="math-sim-tiles" aria-label={text}>
        {Array.from({ length: Number(group[2]) }, (_, index) => <span className="is-variable" key={index}>{group[1]}{group[3]}</span>)}
      </div>
    ) : terms && terms.length <= 4 ? (
      <div className="math-sim-tiles" aria-label={text}>
        {terms.map((term, index) => <React.Fragment key={`${term}-${index}`}>{balanceTiles(term)}</React.Fragment>)}
      </div>
    ) : <strong>{text}</strong>}
  </div>;
}

const numberTiles = [1, -1].map((value) => ({
  key: `number-${value}`, type: 'unit', value,
  label: `${value < 0 ? '−' : '+'}${Math.abs(value) === 0.5 ? '½' : Math.abs(value) === 0.25 ? '¼' : Math.abs(value)}`,
  shape: value < 0 ? 'triangle' : 'square',
}));
const halfNumberTiles = [0.5, -0.5].map((value) => ({
  key: `number-${value}`, type: 'unit', value, parts: 2,
  label: `${value < 0 ? '−' : '+'}1/2`, shape: 'triangle',
}));
const halfDecimalTiles = [0.5, -0.5].map((value) => ({
  key: `number-${value}`, type: 'unit', value, parts: 2,
  label: `${value < 0 ? '-' : '+'}0,5`, shape: 'triangle',
}));
const decimalNumberTiles = (config, lang) => {
  const source = [config?.equation, ...(config?.steps || []).map((step) => `${step.operation} ${step.after}`)].join(' ');
  const values = [...new Set((source.match(/\d+,\d+/g) || [])
    .map((number) => Number(number.replace(',', '.')))
    .filter((number) => Number.isFinite(number) && Math.abs(number) > 0))];
  return values.flatMap((number) => [1, -1].map((sign) => {
    const value = number * sign;
    const magnitude = Math.abs(value).toLocaleString(lang === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: 3, useGrouping: false });
    return { key: `decimal-${value}`, type: 'unit', value, label: `${value < 0 ? '−' : '+'}${magnitude}`, shape: 'crystal' };
  }));
};
const variableTiles = (symbol) => [1, -1].map((value) => ({
  key: `variable-${value}`, type: 'variable', value,
  label: `${value < 0 ? '−' : '+'}${Math.abs(value) === 1 ? '' : Math.abs(value)}${symbol}`,
  shape: 'diamond',
}));
const chapterScenes = [
  '/assets/backgrounds/chapter1-video-poster.jpg',
  '/assets/backgrounds/chapter2-video-poster.jpg',
  '/assets/backgrounds/level3/chapter3-video-poster-4x1.jpg',
  '/assets/backgrounds/level4/chapter4-video-poster.jpg',
  '/assets/backgrounds/level5/chapter5-video-poster.jpg',
];
const ghostTransform = (x, y) => `translate3d(${x}px, ${y - 18}px, 0) translate(-50%, -50%)`;
const BALANCE_RESULT_HOLD_MS = 4000;
const BALANCE_EXIT_MS = 650;
const normalizeOperation = (operation) => operation.replace(/\s+/g, '').replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');

function parseBalanceSide(expression, lang = 'id') {
  if (/[()]/.test(expression)) {
    return [{ id: 'expression-0', type: /[a-z]/i.test(expression) ? 'variable' : 'unit', variable: expression.match(/[a-z]/i)?.[0], value: 0, label: expression, shape: 'crystal', expression: true }];
  }
  const items = [];
  const terms = expression.match(/[+-]?\s*(?:(?:\d+\/\d+)\s*[a-z]|\d+\/\d+|\d+(?:[.,]\d+)?\s*[a-z](?:\s*\/\s*\d+(?:[.,]\d+)?)?|[a-z](?:\s*\/\s*\d+(?:[.,]\d+)?)?|\d+(?:[.,]\d+)?)/gi) || [];
  terms.forEach((term, index) => {
    const token = term.replace(/\s/g, '').replace(/−/g, '-');
    const variable = token.match(/^([+-]?)(\d+(?:[.,]\d+)?)?([a-z])(?:\/(\d+(?:[.,]\d+)?))?$/i);
    if (variable) {
      const numerator = Number((variable[2] || '1').replace(',', '.'));
      const denominator = Number((variable[4] || '1').replace(',', '.'));
      const coefficient = numerator / denominator * (variable[1] === '-' ? -1 : 1);
      if (variable[4]) {
        items.push({ id: `v-${index}`, type: 'variable', variable: variable[3], value: coefficient, label: `${variable[3]}/${variable[4]}`, parts: denominator, shape: 'diamond' });
      } else if (Number.isInteger(Math.abs(coefficient)) && Math.abs(coefficient) <= 12) {
        for (let count = 0; count < Math.abs(coefficient); count += 1) items.push({ id: `v-${index}-${count}`, type: 'variable', variable: variable[3], value: Math.sign(coefficient) || 1, label: coefficient < 0 ? `−${variable[3]}` : variable[3], shape: 'diamond' });
      } else items.push({ id: `v-${index}`, type: 'variable', variable: variable[3], value: coefficient, label: `${variable[1]}${variable[2]}${variable[3]}`, shape: 'diamond' });
      return;
    }
    const fraction = token.match(/^([+-]?)(\d+)\/(\d+)$/);
    if (fraction) {
      const denominator = Number(fraction[3]);
      const numerator = Number(fraction[2]);
      if (!denominator) return;
      const value = (fraction[1] === '-' ? -1 : 1) * numerator / denominator;
      const fractionLabel = `${fraction[1] === '-' ? '−' : ''}${numerator}/${denominator}`;
      items.push({ id: `n-${index}-fraction`, type: 'unit', value, label: fractionLabel, parts: denominator, shape: denominator === 2 ? 'triangle' : 'crystal' });
      return;
    }
    const groupedThousands = lang === 'en'
      ? /^[-+]?\d{1,3}(?:,\d{3})+$/.test(token)
      : /^[-+]?\d{1,3}(?:\.\d{3})+$/.test(token);
    const normalized = lang === 'en' ? token.replace(/,/g, '') : token.replace(/\./g, '').replace(',', '.');
    const value = Number(normalized);
    if (!Number.isFinite(value)) return;
    if (/[.,]/.test(token) && !groupedThousands) {
      const magnitude = token.replace(/^[+-]/, '');
      items.push({ id: `n-${index}-decimal`, type: 'unit', value, label: `${value < 0 ? '−' : '+'}${magnitude}`, shape: 'crystal' });
      return;
    }
    if (Math.abs(value) > 36) {
      const magnitude = Math.abs(value).toLocaleString(lang === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: 0, useGrouping: true });
      items.push({ id: `n-${index}-total`, type: 'unit', value, label: `${value < 0 ? '−' : '+'}${magnitude}`, shape: 'crystal' });
      return;
    }
    const count = Math.min(36, Math.floor(Math.abs(value)));
    for (let unit = 0; unit < count; unit += 1) items.push({ id: `n-${index}-${unit}`, type: 'unit', value: Math.sign(value) || 1, shape: 'square' });
    const remainder = Math.abs(value) - count;
    if (remainder > 0.001) items.push({ id: `n-${index}-fraction`, type: 'unit', value: Math.sign(value) * remainder, label: `${value < 0 ? '−' : '+'}${remainder}`, shape: remainder < 1 ? 'triangle' : 'crystal' });
  });
  return items;
}

function addAndCancelBalanceTiles(row, additions) {
  const next = [...row];
  additions.forEach((tile) => {
    const oppositeIndex = next.findIndex((item) =>
      !item.expression && item.type === tile.type
      && (tile.type !== 'variable' || item.variable === tile.variable)
      && Math.abs(item.value + tile.value) < 0.0001);
    if (oppositeIndex >= 0) next.splice(oppositeIndex, 1);
    else next.push(tile);
  });
  return next;
}

function formatBalanceSide(items, lang = 'id') {
  const formatNumber = (value) => Number(value.toFixed(3)).toLocaleString(lang === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: 3, useGrouping: true });
  const expressionItem = items.find((item) => item.expression);
  const regularItems = items.filter((item) => !item.expression);
  if (expressionItem && !regularItems.length) return expressionItem.label;
  if (expressionItem && regularItems.length) {
    const addition = formatBalanceSide(regularItems, lang);
    const delta = regularItems.reduce((sum, item) => sum + item.value, 0);
    return `${expressionItem.label} ${delta < 0 ? '−' : '+'} ${addition}`;
  }
  const coefficients = new Map();
  items.filter((item) => item.type === 'variable').forEach((item) => {
    const symbol = item.variable || item.label.match(/[a-z]/i)?.[0] || 'x';
    coefficients.set(symbol, (coefficients.get(symbol) || 0) + item.value);
  });
  const terms = [...coefficients].filter(([, value]) => Math.abs(value) > 0.001).map(([symbol, value]) => {
    const magnitude = Math.abs(value);
    const fraction = items.find((item) => item.variable === symbol && item.parts && Math.abs(magnitude - 1 / item.parts) < 0.001);
    const label = fraction ? `${symbol}/${fraction.parts}` : `${Math.abs(magnitude - 1) < 0.001 ? '' : formatNumber(magnitude)}${symbol}`;
    return { value, label };
  });
  const unitItems = items.filter((item) => item.type === 'unit');
  const constant = unitItems.reduce((sum, item) => sum + item.value, 0);
  if (Math.abs(constant) > 0.001) {
    const hasHalf = unitItems.some((item) => item.parts === 2);
    const label = hasHalf && Math.abs(constant - Math.round(constant)) > 0.001
      ? `${Math.round(Math.abs(constant) * 2)}/2`
      : formatNumber(Math.abs(constant));
    terms.push({ value: constant, label });
  }
  return terms.reduce((text, term) => text ? `${text} ${term.value < 0 ? '−' : '+'} ${term.label}` : `${term.value < 0 ? '−' : ''}${term.label}`, '') || '0';
}

function BalanceTile({ item, side, onMoveTile, draggingSource, interactive = true }) {
  const label = item.label || (item.value < 0 ? '−1' : '+1');
  const tileClass = `math-sim-balance-item ${item.expression ? 'is-expression' : ''} ${item.type === 'variable' ? 'is-variable' : item.value < 0 ? 'is-negative' : 'is-positive'} shape-${item.shape || 'square'} ${item.parts ? 'is-divided' : ''} ${item.id.startsWith('added-') ? 'is-new' : ''} ${draggingSource === `pan-${side}-${item.id}` ? 'is-lifting' : ''}`;
  if (!interactive) return <span className={tileClass}><span>{label}</span></span>;
  return <button type="button" draggable="false" className={tileClass} aria-label={`${label}, ${side === 'left' ? 'ruas kiri' : 'ruas kanan'}; seret ke ruas lainnya`} onPointerDown={(event) => onMoveTile(event, side, item)}><span>{label}</span></button>;
}

function BalanceOperationVisual({ items, operation, value, result, lang }) {
  if (operation === 'expand' || operation === 'simplify') {
    const action = operation === 'expand'
      ? (lang === 'en' ? 'Expand brackets' : 'Buka kurung')
      : (lang === 'en' ? 'Combine like terms' : 'Gabungkan suku');
    return <div className="math-sim-operation-visual" aria-live="polite"><small>{operation === 'expand' ? '↗' : '≋'}</small><div className="math-sim-operation-groups"><div className="math-sim-operation-group"><i>{action}</i><span>{items.length ? items.map((item, index) => <b key={`${item.id}-${index}`} className={item.type === 'variable' ? 'is-variable' : item.value < 0 ? 'is-negative' : ''}>{item.label || (item.value < 0 ? '−1' : '1')}</b>) : <b>0</b>}</span></div></div>{result && <strong className="math-sim-operation-result">→ {result}</strong>}</div>;
  }
  const divide = operation.startsWith('/');
  const arithmetic = operation.startsWith('+') || operation.startsWith('-');
  if (arithmetic) {
    const symbol = operation.startsWith('+') ? '+' : '−';
    return <div className="math-sim-operation-visual" aria-live="polite">
      <small>{symbol} {value}</small>
      <div className="math-sim-operation-groups is-compact"><div className="math-sim-operation-group">
        <i>{lang === 'en' ? 'Both sides' : 'Kedua ruas'}</i>
        <span>{items.length ? items.map((item, index) => <b key={`${item.id}-${index}`} className={item.type === 'variable' ? 'is-variable' : item.value < 0 ? 'is-negative' : ''}>{item.label || (item.value < 0 ? '−1' : '1')}</b>) : <b>0</b>}</span>
      </div></div>
      {result && <strong className="math-sim-operation-result">→ {result}</strong>}
    </div>;
  }
  const rawAmount = String(value || '2');
  const fractionAmount = rawAmount.match(/^([+-]?\d+)\/(\d+)$/);
  const numericAmount = fractionAmount ? Number(fractionAmount[1]) / Number(fractionAmount[2]) : Number(rawAmount.replace(',', '.'));
  const groupCount = fractionAmount ? Math.abs(Number(fractionAmount[1])) : Math.round(Math.abs(numericAmount));
  const amount = Math.max(2, groupCount || 2);
  if (amount > 8) {
    const perGroup = formatBalanceSide(items.map((item) => ({ ...item, value: item.value / amount })), lang);
    return <div className="math-sim-operation-visual" aria-live="polite">
      <small>{divide ? `÷ ${rawAmount}` : `× ${rawAmount}`}</small>
      <div className="math-sim-operation-groups is-compact"><div className="math-sim-operation-group">
        <i>{lang === 'en' ? `${amount} equal groups` : `${amount} kelompok sama`}</i>
        <span><b>{formatBalanceSide(items, lang)}</b><b>{lang === 'en' ? `Each group: ${perGroup}` : `Tiap kelompok: ${perGroup}`}</b></span>
      </div></div>
      {result && <strong className="math-sim-operation-result">→ {result}</strong>}
    </div>;
  }
  const expandedItems = items.flatMap((item) => item.type === 'unit' && Number.isInteger(Math.abs(item.value)) && Math.abs(item.value) > 1 && Math.abs(item.value) <= 120
    ? Array.from({ length: Math.abs(item.value) }, (_, index) => ({ ...item, id: `${item.id}-unit-${index}`, value: Math.sign(item.value), label: item.value < 0 ? '−1' : '1' }))
    : [item]);
  const groups = divide
    ? Array.from({ length: amount }, (_, index) => expandedItems.flatMap((item, itemIndex) => {
      if (item.type === 'unit' && Math.abs(item.value) > 120) {
        const eachGroup = item.value / amount;
        return [{ ...item, id: `${item.id}-group-${index}`, value: eachGroup, label: `${eachGroup} × 1` }];
      }
      return itemIndex % amount === index ? [item] : [];
    }))
    : Array.from({ length: amount }, () => items);
  return <div className="math-sim-operation-visual" aria-live="polite">
    <small>{divide ? `÷ ${rawAmount}` : `× ${rawAmount}`}</small>
    <div className="math-sim-operation-groups">{groups.map((group, index) => <div className="math-sim-operation-group" key={index}>
      <i>{divide ? `G${index + 1}` : `×${index + 1}`}</i>
      <span>{group.length ? group.map((item, itemIndex) => <b key={`${item.id}-${itemIndex}`} className={item.type === 'variable' ? 'is-variable' : item.value < 0 ? 'is-negative' : ''}>{item.label || (item.value < 0 ? '−1' : '1')}</b>) : <b>0</b>}</span>
    </div>)}</div>
    {result && <strong className="math-sim-operation-result">→ {result}</strong>}
  </div>;
}

function BalanceScale({ left, right, equation, sides, selectedTile, overPans, tilt, indicator, statusText, balanceDelta, operationAnimation, onMoveTile, draggingSource, interactiveTiles = true, chapter2DropTargets = false, chapter2HoverSide = '', chapter2OperationSides = [], chapter2OperationText = '', lang }) {
  const swing = balanceDelta ? Math.min(8, 4.5 + Math.abs(balanceDelta) * 1.1) : 0;
  const drop = balanceDelta ? Math.min(18, 8 + Math.abs(balanceDelta) * 2) : 0;
  const direction = Math.sign(balanceDelta);
  return <div
    className={`math-sim-balance-scale ${selectedTile ? 'has-pending-tile' : ''} ${tilt} ${operationAnimation ? 'is-operation-active' : ''}`}
    aria-label={equation}
    style={{
      '--scale-angle': `${-direction * swing}deg`,
      '--left-drop': `${direction * drop}px`,
      '--right-drop': `${-direction * drop}px`,
      '--left-pan-angle': `${-direction * 3}deg`,
      '--right-pan-angle': `${direction * 3}deg`,
    }}
  >
    <div className={`math-sim-balance-readout is-${indicator}`} role="status" aria-live="polite"><span aria-hidden="true" />{statusText}</div>
    <div className="math-sim-scale-beam" aria-hidden="true"><span /></div>
    <div className="math-sim-scale-crystal" aria-hidden="true">◆</div>
    <div className="math-sim-scale-post" aria-hidden="true" />
    <div className={`math-sim-scale-pans ${overPans ? 'is-drop-target' : ''}`}>
      <div className={`math-sim-scale-pan is-left ${overPans === 'left' ? 'is-drop-target' : ''} ${chapter2HoverSide === 'left' ? 'is-ch2-hovered' : ''}`} data-ch2-side={chapter2DropTargets ? 'left' : undefined}>
        <small>{sides[0]}</small>
        {chapter2OperationSides.includes(0) && <b className="math-sim-ch2-pan-operation">{chapter2OperationText}</b>}
        <div className="math-sim-balance-pan-content"><div className="math-sim-balance-tiles">{left.map((item) => <BalanceTile key={item.id} item={item} side="left" onMoveTile={onMoveTile} draggingSource={draggingSource} interactive={interactiveTiles} />)}</div><strong className="math-sim-balance-expression">{formatBalanceSide(left, lang)}</strong>{operationAnimation && <BalanceOperationVisual items={left} {...operationAnimation} result={operationAnimation.results?.[0]} lang={lang} />}</div>
      </div>
      <span className="math-sim-scale-equals" aria-hidden="true">=</span>
      <div className={`math-sim-scale-pan is-right ${overPans === 'right' ? 'is-drop-target' : ''} ${chapter2HoverSide === 'right' ? 'is-ch2-hovered' : ''}`} data-ch2-side={chapter2DropTargets ? 'right' : undefined}>
        <small>{sides[1]}</small>
        {chapter2OperationSides.includes(1) && <b className="math-sim-ch2-pan-operation">{chapter2OperationText}</b>}
        <div className="math-sim-balance-pan-content"><div className="math-sim-balance-tiles">{right.map((item) => <BalanceTile key={item.id} item={item} side="right" onMoveTile={onMoveTile} draggingSource={draggingSource} interactive={interactiveTiles} />)}</div><strong className="math-sim-balance-expression">{formatBalanceSide(right, lang)}</strong>{operationAnimation && <BalanceOperationVisual items={right} {...operationAnimation} result={operationAnimation.results?.[1]} lang={lang} />}</div>
      </div>
    </div>
    <div className="math-sim-scale-base" aria-hidden="true" />
    <div className="math-sim-balance-indicator" aria-label={statusText}><span className={`is-${indicator}`} /></div>
  </div>;
}

function Chapter2DragPuzzle({ choices, lang, busy, onDrop, onHoverSide, onSelect, selectedChoice }) {
  const [drag, setDrag] = useState(null);
  const [hoverSide, setHoverSide] = useState('');
  const cleanupRef = useRef(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  const startDrag = (event, choice) => {
    if (busy || event.button !== 0) return;
    event.preventDefault();
    cleanupRef.current?.();
    const pointerId = event.pointerId;
    const findSide = (x, y) => {
      const target = document.elementFromPoint(x, y)?.closest('[data-ch2-side]');
      return target?.closest('.math-sim-ch2-reference') ? target.dataset.ch2Side : '';
    };
    setDrag({ choice, x: event.clientX, y: event.clientY });
    const move = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const side = findSide(moveEvent.clientX, moveEvent.clientY);
      setDrag({ choice, x: moveEvent.clientX, y: moveEvent.clientY });
      setHoverSide(side);
      onHoverSide(side);
    };
    const finish = (upEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      const side = findSide(upEvent.clientX, upEvent.clientY);
      cleanupRef.current?.();
      setDrag(null);
      setHoverSide('');
      onHoverSide('');
      if (side) onDrop(choice, side);
    };
    const cancel = () => {
      cleanupRef.current?.();
      setDrag(null);
      setHoverSide('');
      onHoverSide('');
    };
    cleanupRef.current = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
      cleanupRef.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
  };

  return <div className="math-sim-ch2-drag-puzzle">
    <p className="math-sim-ch2-drag-guide" role="status">{hoverSide
      ? (lang === 'en' ? `Drop the operation on the ${hoverSide} pan.` : `Lepaskan ubin di ruas ${hoverSide === 'left' ? 'kiri' : 'kanan'}.`)
      : (lang === 'en' ? 'Drag an operation tile onto a balance pan.' : 'Seret ubin operasi ke salah satu piring timbangan.')}</p>
    <div className="math-sim-tile-grid math-sim-ch2-keys" aria-label={lang === 'en' ? 'Operation tiles' : 'Ubin operasi'}>
      {choices.map((choice) => <button key={choice.key} type="button" disabled={busy} className={`math-sim-picker-tile math-sim-ch2-operation-tile ${selectedChoice?.key === choice.key ? 'is-selected' : ''}`} aria-label={choice.label} aria-pressed={selectedChoice?.key === choice.key} onPointerDown={(event) => startDrag(event, choice)} onClick={() => onSelect(choice)}><span>{choice.tileText}</span><strong>{choice.label}</strong></button>)}
    </div>
    {drag && createPortal(<span className="math-sim-ch2-drag-ghost" style={{ left: drag.x, top: drag.y }}>{drag.choice.tileText}<small>{drag.choice.label}</small></span>, document.body)}
  </div>;
}
export default function MathSimulation({ questionId, lang, hintsUsed, busy, onProgress, onBalanceSolved }) {
  const config = SIMULATIONS[Number(questionId)];
  const questionNumber = Number(questionId);
  const chapter2Symbolic = questionNumber >= 11 && questionNumber <= 20;
  const model = (lang === 'en' ? STORY_MODELS_EN : STORY_MODELS)[Number(questionId)] || [];
  const c = copy[lang === 'en' ? 'en' : 'id'];
  const [modelIndex, setModelIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [modelErrors, setModelErrors] = useState(0);
  const [stepErrors, setStepErrors] = useState(0);
  const [message, setMessage] = useState('');
  const [tileTab, setTileTab] = useState('number');
  const [selectedTile, setSelectedTile] = useState('number-1');
  const [dragGhost, setDragGhost] = useState(null);
  const [draggingSource, setDraggingSource] = useState('');
  const [chapter2HoverSide, setChapter2HoverSide] = useState('');
  const [chapter2SelectedChoice, setChapter2SelectedChoice] = useState(null);
  const [chapter2AppliedChoice, setChapter2AppliedChoice] = useState(null);
  const [overPans, setOverPans] = useState('');
  const [balancePhase, setBalancePhase] = useState('active');
  const [balanceRows, setBalanceRows] = useState(() => config ? splitEquation(localizeEquation(config.equation, lang)).map((side) => parseBalanceSide(side, lang)) : [[], []]);
  const [balanceDelta, setBalanceDelta] = useState(0);
  const [balanceHistory, setBalanceHistory] = useState([]);
  const [balanceHintVisible, setBalanceHintVisible] = useState(false);
  const [balanceOperation, setBalanceOperation] = useState('');
  const [balanceOperationNumber, setBalanceOperationNumber] = useState('');
  const [operationSides, setOperationSides] = useState([]);
  const [operationAnimation, setOperationAnimation] = useState(null);
  const activeDrag = useRef(null);
  const dragGhostRef = useRef(null);
  const dragFrameRef = useRef(0);
  const dragPositionRef = useRef({ x: 0, y: 0 });
  const onBalanceSolvedRef = useRef(onBalanceSolved);
  const operationTimerRef = useRef(null);

  const moveDragGhost = (x, y) => {
    dragPositionRef.current = { x, y };
    if (dragFrameRef.current) return;
    dragFrameRef.current = window.requestAnimationFrame(() => {
      dragFrameRef.current = 0;
      if (dragGhostRef.current) {
        const position = dragPositionRef.current;
        dragGhostRef.current.style.transform = ghostTransform(position.x, position.y);
      }
    });
  };

  const modelReady = modelIndex >= model.length;
  const ready = Boolean(config && modelReady && stepIndex >= config.steps.length);
  const reportedReady = config ? ready && balancePhase === 'dismissed' : ready;

  useEffect(() => {
    onProgress({ questionId: Number(questionId), ready: reportedReady, modelCorrect: modelReady, modelErrors, stepErrors, stepsCompleted: stepIndex, stepsTotal: config?.steps.length || 0 });
  }, [onProgress, questionId, reportedReady, modelReady, modelErrors, stepErrors, stepIndex, config]);

  useEffect(() => { onBalanceSolvedRef.current = onBalanceSolved; }, [onBalanceSolved]);
  useEffect(() => {
    if (!config || !ready) return undefined;
    setBalancePhase('solved');
    const exitTimer = window.setTimeout(() => setBalancePhase('exiting'), BALANCE_RESULT_HOLD_MS);
    const dismissTimer = window.setTimeout(() => {
      setBalancePhase('dismissed');
      onBalanceSolvedRef.current?.({
        questionId: Number(questionId), ready: true, modelCorrect: modelReady,
        modelErrors, stepErrors, stepsCompleted: config.steps.length, stepsTotal: config.steps.length,
      });
    }, BALANCE_RESULT_HOLD_MS + BALANCE_EXIT_MS);
    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [config, ready, questionId, lang, modelReady, modelErrors, stepErrors]);

  useEffect(() => () => {
    activeDrag.current?.cleanup?.();
    if (dragFrameRef.current) window.cancelAnimationFrame(dragFrameRef.current);
    if (operationTimerRef.current) window.clearTimeout(operationTimerRef.current);
  }, []);
  useEffect(() => {
    if (!config) return;
    if (operationTimerRef.current) window.clearTimeout(operationTimerRef.current);
    operationTimerRef.current = null;
    setBalanceRows(splitEquation(localizeEquation(config.equation, lang)).map((side) => parseBalanceSide(side, lang)));
    setBalanceDelta(0);
    setBalanceHintVisible(false);
    setBalanceHistory([]);
    setBalanceOperation('');
    setOperationSides([]);
    setOperationAnimation(null);
    setBalancePhase('active');
  }, [questionId, config, lang]);
  useEffect(() => {
    if (!balanceDelta || ready || busy || !config) { setBalanceHintVisible(false); return undefined; }
    const timer = window.setTimeout(() => setBalanceHintVisible(true), 6500);
    return () => window.clearTimeout(timer);
  }, [balanceDelta, ready, busy, config]);

  if (!config) return null;
  const equation = localizeEquation(stepIndex ? config.steps[stepIndex - 1].after : config.equation, lang);
  const previousEquation = stepIndex ? localizeEquation(stepIndex === 1 ? config.equation : config.steps[stepIndex - 2].after, lang) : null;
  const [left, right] = splitEquation(equation);
  const variableSymbol = config.equation.match(/[a-z]/i)?.[0] || 'x';
  const balanceNumberTiles = [...numberTiles, ...(questionNumber === 6 ? halfDecimalTiles : questionNumber === 7 ? halfNumberTiles : []), ...(questionNumber === 6 ? [] : decimalNumberTiles(config, lang))];
  const balanceTileCatalog = [...balanceNumberTiles, ...(questionNumber === 6 ? [] : variableTiles(variableSymbol))];
  const selectedTileOption = balanceTileCatalog.find((tile) => tile.key === selectedTile) || numberTiles[0];
  const balanceEquation = `${formatBalanceSide(balanceRows[0], lang)} = ${formatBalanceSide(balanceRows[1], lang)}`;
  const initialGroup = config.mode === 'groups' && !stepIndex ? Number(config.equation.match(/^(\d+)(?:[a-z]|\()/i)?.[1] || 0) : 0;
  const next = config.steps[stepIndex];
  useEffect(() => { setSelectedTile('number-1'); setTileTab('number'); }, [questionId]);
  const currentModel = model[modelIndex];
  const choices = currentModel ? [currentModel.correct, currentModel.wrong] : [];
  if (currentModel && (Number(questionId) + modelIndex) % 2 === 0) choices.reverse();

  const selectModel = (choice) => {
    if (busy) return;
    if (choice !== currentModel.correct) {
      setModelErrors((count) => count + 1);
      setMessage(c.modelErrors[currentModel.kind]);
      return;
    }
    setModelIndex((index) => index + 1);
    setMessage(modelIndex + 1 === model.length ? c.modelDone : '');
  };

  const selectStep = (choice) => {
    if (busy) return;
    if (choice === 'oneSide') {
      setStepErrors((count) => count + 1);
      setOperationSides([]);
      setBalanceOperation('');
      setBalanceDelta(0);
      setChapter2AppliedChoice(null);
      setMessage(chapter2Symbolic ? (lang === 'en' ? 'That operation does not isolate the variable. Try its inverse.' : 'Operasi itu belum mengisolasi variabel. Coba operasi inversnya.') : next.operation === 'expand' || next.operation === 'simplify' ? c.term : c.equal);
      return;
    }
    if (choice === 'sign') {
      setStepErrors((count) => count + 1);
      setMessage(c.signError);
      return;
    }
    if (chapter2Symbolic && next?.after) setBalanceRows(splitEquation(localizeEquation(next.after, lang)).map((side) => parseBalanceSide(side, lang)));
    setOperationSides([]);
    setBalanceOperation('');
    setBalanceDelta(0);
    setChapter2AppliedChoice(null);
    setStepIndex((index) => index + 1);
    setMessage(stepIndex + 1 === config.steps.length ? c.ready : c.stepDone);
  };

  const normalizedSide = (side) => side.replace(/[−]/g, '-').replace(/\s+/g, '').toLowerCase();
  const equationsMatch = (actual, expected) => {
    const canonical = (value) => value.split('=').map(normalizedSide).sort().join('=');
    return canonical(actual) === canonical(localizeEquation(expected, lang));
  };
  const updateBalanceRows = (sideIndex, update) => {
    if (busy || !modelReady || ready || !next || operationAnimation) return;
    const updated = balanceRows.map((row, index) => index === sideIndex ? update(row) : row);
    const deltaChange = sideIndex === 0 ? update.delta : -update.delta;
    const nextDelta = balanceDelta + deltaChange;
    setBalanceHistory((history) => [...history, { rows: balanceRows, delta: balanceDelta, stepIndex, operation: balanceOperation, operationSides }]);
    setBalanceRows(updated);
    setBalanceOperation('');
    setOperationSides([]);
    setBalanceDelta(nextDelta);
    setBalanceHintVisible(false);
    setMessage('');
    const visibleEquation = `${formatBalanceSide(updated[0], lang)} = ${formatBalanceSide(updated[1], lang)}`;
    if (equationsMatch(visibleEquation, next.after)) {
      const done = stepIndex + 1 === config.steps.length;
      setBalanceRows(splitEquation(localizeEquation(next.after, lang)).map((side) => parseBalanceSide(side, lang)));
      setStepIndex((index) => index + 1);
      setBalanceDelta(0);
      setBalanceHistory((history) => [...history.slice(0, -1), { rows: balanceRows, delta: balanceDelta, stepIndex, operation: balanceOperation, operationSides }]);
      if (!done) setMessage(c.stepDone);
    }
  };
  const moveBalanceTile = (sourceSide, item, targetSide) => {
    if (busy || !modelReady || ready || !next || operationAnimation || sourceSide === targetSide) return;
    const sourceIndex = sourceSide === 'left' ? 0 : 1;
    const targetIndex = targetSide === 'left' ? 0 : 1;
    const sourceRows = balanceRows.map((row, index) => index === sourceIndex ? row.filter((entry) => entry.id !== item.id) : row);
    const movedItem = { ...item, id: `moved-${Date.now()}-${Math.random().toString(16).slice(2)}` };
    const updated = sourceRows.map((row, index) => index === targetIndex ? addAndCancelBalanceTiles(row, [movedItem]) : row);
    const deltaChange = (sourceSide === 'left' ? -item.value : item.value) + (targetSide === 'left' ? item.value : -item.value);
    const nextDelta = balanceDelta + deltaChange;
    setBalanceHistory((history) => [...history, { rows: balanceRows, delta: balanceDelta, stepIndex, operation: balanceOperation, operationSides }]);
    setBalanceRows(updated);
    setBalanceDelta(nextDelta);
    setOperationSides([]);
    setBalanceOperation('');
    setBalanceHintVisible(false);
    setMessage('');
    const visibleEquation = `${formatBalanceSide(updated[0], lang)} = ${formatBalanceSide(updated[1], lang)}`;
    if (equationsMatch(visibleEquation, next.after)) {
      const done = stepIndex + 1 === config.steps.length;
      setBalanceRows(splitEquation(localizeEquation(next.after, lang)).map((side) => parseBalanceSide(side, lang)));
      setStepIndex((index) => index + 1);
      setBalanceDelta(0);
      if (!done) setMessage(c.stepDone);
    }
  };
  const handleBalanceItemPointerDown = (event, side, item) => {
    if (busy || !modelReady || ready || !next || operationAnimation) { event.preventDefault(); return; }
    if (event.button !== 0) return;
    event.preventDefault();
    activeDrag.current?.cleanup?.();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    const drag = { cleanup: null };
    activeDrag.current = drag;
    setDraggingSource(`pan-${side}-${item.id}`);
    setDragGhost({ tile: item.label || (item.value < 0 ? '−1' : '+1'), type: item.type, value: item.value, shape: item.shape, x: startX, y: startY });
    const findSide = (x, y) => {
      const pan = document.elementFromPoint(x, y)?.closest('.math-sim-scale-pan');
      return pan?.classList.contains('is-left') ? 'left' : pan?.classList.contains('is-right') ? 'right' : '';
    };
    const move = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId || activeDrag.current !== drag) return;
      if (Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) > 7) moved = true;
      moveDragGhost(moveEvent.clientX, moveEvent.clientY);
      setOverPans(findSide(moveEvent.clientX, moveEvent.clientY));
    };
    const finish = (upEvent) => {
      if (upEvent.pointerId !== pointerId || activeDrag.current !== drag) return;
      const targetSide = findSide(upEvent.clientX, upEvent.clientY);
      drag.cleanup(); activeDrag.current = null; setDragGhost(null); setDraggingSource(''); setOverPans('');
      if (moved && targetSide && targetSide !== side) moveBalanceTile(side, item, targetSide);
    };
    const cancel = () => { drag.cleanup(); activeDrag.current = null; setDragGhost(null); setDraggingSource(''); setOverPans(''); };
    drag.cleanup = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', finish); window.removeEventListener('pointercancel', cancel); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
  };

  const addBalanceTile = (sideIndex, tile) => {
    if (busy || !modelReady || ready || !next || operationAnimation) return;
    const id = `added-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const additions = tile.type === 'variable'
      ? Array.from({ length: Math.abs(tile.value) }, (_, index) => ({ id: `${id}-${index}`, type: 'variable', variable: variableSymbol, value: Math.sign(tile.value), label: tile.value < 0 ? `−${variableSymbol}` : variableSymbol, shape: tile.shape }))
      : [{ id, type: 'unit', value: tile.value, label: tile.label, parts: tile.parts, shape: tile.shape }];
    updateBalanceRows(sideIndex, Object.assign((row) => addAndCancelBalanceTiles(row, additions), { delta: tile.value }));
  };
  const undoBalance = () => {
    if (busy || ready || !balanceHistory.length) return;
    const previous = balanceHistory[balanceHistory.length - 1];
    setBalanceRows(previous.rows);
    setBalanceDelta(previous.delta);
    setBalanceOperation(previous.operation || '');
    setOperationSides(previous.operationSides || []);
    setOperationAnimation(null);
    setBalanceHistory((history) => history.slice(0, -1));
    setStepIndex(previous.stepIndex);
    setBalancePhase('active');
    setMessage('');
  };
  const operationValueMatch = next?.operation?.match(/^([+\-*/])\s*(.+)$/);
  const variableCoefficients = [...equation.matchAll(/(?:^|[+\-])\s*(\d+(?:[.,]\d+)?)(?=\s*[a-z])/gi)].map((match) => match[1]);
  const variableDivisors = [...equation.matchAll(/[a-z]\s*\/\s*(\d+(?:[.,]\d+)?)/gi)].map((match) => match[1]);
  const operationValues = [...new Set([operationValueMatch?.[2], ...variableCoefficients, ...variableDivisors].filter((value) => value && (Number.isNaN(Number(value.replace(',', '.'))) || Number(value.replace(',', '.')) !== 0)))];
  const operationAmount = operationValues.includes(balanceOperationNumber) ? balanceOperationNumber : operationValueMatch?.[2] || operationValues[0] || '1';
  const operationOptions = next?.operation === 'expand' || next?.operation === 'simplify' ? [next.operation] : ['+', '-', '*', '/'];
  const selectBalanceOperationNumber = (value) => {
    setBalanceOperationNumber(value);
    if (/^[+\-*/]/.test(balanceOperation)) setBalanceOperation(`${balanceOperation[0]} ${value}`);
  };
  const chooseBalanceOperation = (operation) => {
    if (busy || !modelReady || !next || operationAnimation) return;
    setBalanceOperation(['expand', 'simplify'].includes(operation) ? operation : `${operation} ${operationAmount}`);
    setOperationSides([]);
    setBalanceDelta(0);
    setMessage('');
  };
  const applyOperationToSide = (sideIndex) => {
    if (busy || !modelReady || !next || !balanceOperation || operationAnimation || operationSides.includes(sideIndex)) return;
    if (balanceOperation === 'expand' || balanceOperation === 'simplify') {
      const done = stepIndex + 1 === config.steps.length;
      setBalanceHistory((history) => [...history, { rows: balanceRows, delta: balanceDelta, stepIndex, operation: balanceOperation, operationSides }]);
      setBalanceDelta(0);
      setOperationAnimation({ operation: balanceOperation, value: '', results: splitEquation(localizeEquation(next.after, lang)) });
      setMessage('');
      operationTimerRef.current = window.setTimeout(() => {
        operationTimerRef.current = null;
        setBalanceRows(splitEquation(localizeEquation(next.after, lang)).map((side) => parseBalanceSide(side, lang)));
        setStepIndex((index) => index + 1);
        setOperationSides([]);
        setBalanceOperation('');
        setOperationAnimation(null);
        if (!done) setMessage(c.stepDone);
      }, 1050);
      return;
    }
    const snapshot = { rows: balanceRows, delta: balanceDelta, stepIndex, operation: balanceOperation, operationSides };
    setBalanceHistory((history) => [...history, snapshot]);
    const sidesAfter = [...operationSides, sideIndex];
    setOperationSides(sidesAfter);
    if (sidesAfter.length < 2) {
      setBalanceDelta(sideIndex === 0 ? -1 : 1);
      setBalanceHintVisible(false);
      setMessage(c.applyOtherSide);
      return;
    }
    setBalanceDelta(0);
    if (normalizeOperation(balanceOperation) !== normalizeOperation(next.operation)) {
      setStepErrors((count) => count + 1);
      setMessage(c.operationMismatch);
      setOperationSides([]);
      setBalanceOperation('');
      setChapter2AppliedChoice(null);
      return;
    }
    const done = stepIndex + 1 === config.steps.length;
    setOperationAnimation({ operation: balanceOperation, value: balanceOperation.match(/^[+\-*/]\s*(.+)$/)?.[1] || '', results: splitEquation(localizeEquation(next.after, lang)) });
    setMessage('');
    operationTimerRef.current = window.setTimeout(() => {
      operationTimerRef.current = null;
      setBalanceRows(splitEquation(localizeEquation(next.after, lang)).map((side) => parseBalanceSide(side, lang)));
      setStepIndex((index) => index + 1);
      setBalanceDelta(0);
      setOperationSides([]);
      setBalanceOperation('');
      setChapter2AppliedChoice(null);
      setOperationAnimation(null);
      if (!done) setMessage(c.stepDone);
    }, 1050);
  };

  const handleBalanceTilePointerDown = (event, tile) => {
    if (busy || !modelReady || ready || operationAnimation) { event.preventDefault(); return; }
    event.preventDefault();
    activeDrag.current?.cleanup?.();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    const drag = { cleanup: null };
    activeDrag.current = drag;
    if (dragFrameRef.current) window.cancelAnimationFrame(dragFrameRef.current);
    dragFrameRef.current = 0;
    setDraggingSource(`dock-${tile.key}`);
    setDragGhost({ tile: tile.label, type: tile.type, value: tile.value, shape: tile.shape, x: startX, y: startY });
    const findSide = (x, y) => {
      const pan = document.elementFromPoint(x, y)?.closest('.math-sim-scale-pan');
      return pan?.classList.contains('is-left') ? 'left' : pan?.classList.contains('is-right') ? 'right' : '';
    };
    const move = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId || activeDrag.current !== drag) return;
      if (Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) > 7) moved = true;
      moveDragGhost(moveEvent.clientX, moveEvent.clientY);
      setOverPans(findSide(moveEvent.clientX, moveEvent.clientY));
    };
    const finish = (upEvent) => {
      if (upEvent.pointerId !== pointerId || activeDrag.current !== drag) return;
      const side = findSide(upEvent.clientX, upEvent.clientY);
      drag.cleanup(); activeDrag.current = null; setDragGhost(null); setDraggingSource(''); setOverPans('');
      if (side) addBalanceTile(side === 'left' ? 0 : 1, tile);
      else if (!moved) setSelectedTile(tile.key);
    };
    const cancel = () => { drag.cleanup(); activeDrag.current = null; setDragGhost(null); setDraggingSource(''); setOverPans(''); };
    drag.cleanup = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', finish); window.removeEventListener('pointercancel', cancel); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
  };

  const undo = () => {
    if (busy) return;
    if (stepIndex > 0) setStepIndex((index) => index - 1);
    else if (modelIndex > 0) setModelIndex((index) => index - 1);
    setMessage('');
  };

  const chapter2Choices = next ? [
    { key: 'correct', operation: next.operation, tileText: `${next.operation[0] === '/' ? '\u00f7' : '\u00d7'} ${next.operation.slice(2).trim()}`, label: operationLabel(localizeEquation(next.operation, lang), lang) },
    { key: 'oneSide', operation: `${next.operation[0] === '/' ? '*' : '/'} ${next.operation.slice(2).trim()}`, tileText: `${next.operation[0] === '/' ? '\u00d7' : '\u00f7'} ${next.operation.slice(2).trim()}`, label: operationLabel(localizeEquation(`${next.operation[0] === '/' ? '*' : '/'} ${next.operation.slice(2)}`, lang), lang) },
  ] : [];
  const handleChapter2OperationDrop = (choice, side) => {
    if (busy || ready || operationAnimation || !choice || !side) return;
    const sideIndex = side === 'left' ? 0 : 1;
    setChapter2SelectedChoice(choice);
    if (!operationSides.length) {
      setBalanceHistory((history) => [...history, { rows: balanceRows, delta: balanceDelta, stepIndex, operation: '', operationSides: [] }]);
      setBalanceOperation(choice.operation);
      setOperationSides([sideIndex]);
      setChapter2AppliedChoice(choice.key);
      setBalanceDelta(sideIndex === 0 ? -1 : 1);
      setBalanceHintVisible(false);
      setMessage(c.applyOtherSide);
      return;
    }
    if (operationSides.includes(sideIndex)) {
      setMessage(c.applyOtherSide);
      return;
    }
    if (chapter2AppliedChoice !== choice.key) {
      setStepErrors((count) => count + 1);
      setOperationSides([]);
      setBalanceOperation('');
      setBalanceDelta(0);
      setChapter2AppliedChoice(null);
      setMessage(c.operationMismatch);
      return;
    }
    applyOperationToSide(sideIndex);
  };
  const progress = Math.round(((modelIndex + stepIndex) / (model.length + config.steps.length)) * 100);

  if (config && !chapter2Symbolic) {
    if (balancePhase === 'dismissed') return null;
    const chapterNumber = Math.ceil(Number(questionId) / 10);
    const chapterQuestion = ((Number(questionId) - 1) % 10) + 1;
    const activeTiles = tileTab === 'number' ? balanceNumberTiles : variableTiles(variableSymbol);
    return <>
      <section className={`math-sim math-sim-balance math-sim-balance-reference chapter-${chapterNumber} ${balancePhase === 'active' ? '' : `is-${balancePhase}`}`} aria-label={c.modes[config.mode]}>
      <header className="math-sim-reference-question">
        <div className="math-sim-reference-heading"><span className="math-sim-chapter-gem" aria-hidden="true"><img src="/assets/ui/character-select/icons/crystal-star.webp" alt="" /></span><strong>{c.chapter} {chapterNumber}</strong><i>•</i><b>{c.question} {chapterQuestion}/10</b></div>
        <p>{config.mode === 'groups' ? c.groupPrompt : c.balancePrompt}</p>
        <strong className="math-sim-reference-equation">{localizeEquation(config.equation, lang)}</strong>
        <div className="math-sim-reference-progress" aria-label={`${progress}%`}><span style={{ width: `${progress}%` }} /></div>
      </header>

      {!modelReady && currentModel && <div className="math-sim-model math-sim-balance-model">
        <p>{c.prompts[currentModel.kind]}</p>
        <div className="math-sim-choices">
          {choices.map((choice) => <button key={choice} type="button" disabled={busy} onClick={() => selectModel(choice)}>{choice}</button>)}
        </div>
        {modelIndex > 0 && <small className="math-sim-model-progress">{model.slice(0, modelIndex).map((stage) => stage.correct).join(' â†’ ')}</small>}
      </div>}

      <div className="math-sim-balance-workspace">
        <div className={`math-sim-balance-stage ${overPans ? 'is-awaiting-drop' : ''} ${balanceDelta > 0 ? 'is-left-heavy' : balanceDelta < 0 ? 'is-right-heavy' : 'is-level'}`}>
          <img className="math-sim-chapter-scene" src={chapterScenes[chapterNumber - 1] || chapterScenes[0]} alt="" aria-hidden="true" draggable="false" decoding="async" fetchPriority="high" />
          <BalanceScale
            left={balanceRows[0]}
            right={balanceRows[1]}
            equation={balanceEquation}
            sides={c.sides}
            selectedTile={selectedTile}
            overPans={overPans}
            tilt={balanceDelta > 0 ? 'is-left-heavy' : balanceDelta < 0 ? 'is-right-heavy' : 'is-level'}
            indicator={balanceDelta > 0 ? 'left' : balanceDelta < 0 ? 'right' : 'center'}
            statusText={c.balanceStates[balanceDelta > 0 ? 'left' : balanceDelta < 0 ? 'right' : 'center']}
            balanceDelta={balanceDelta}
            operationAnimation={operationAnimation}
            onMoveTile={handleBalanceItemPointerDown}
            draggingSource={draggingSource}
            lang={lang}
          />
          <span className="math-sim-drop-hint" aria-live="polite">{balanceHintVisible ? c.balanceHint : (lang === 'en' ? 'Drag a tile between the two sides' : 'Seret ubin dari satu ruas ke ruas lainnya')}</span>
        </div>
        <aside className="math-sim-tile-dock">
          <div className="math-sim-dock-heading"><h2>{c.tilePicker}</h2><span aria-hidden="true"><PixelIcon name="hint" size={16} /></span></div>
          <div className="math-sim-tile-tabs" role="tablist" aria-label={c.tilePicker}>
            <button type="button" role="tab" aria-selected={tileTab === 'number'} disabled={busy || ready} onClick={() => { setTileTab('number'); setSelectedTile(numberTiles[0].key); }}>{c.tileNumbers}</button>
          {questionNumber !== 6 && <button type="button" role="tab" aria-selected={tileTab === 'variable'} disabled={busy || ready} onClick={() => { setTileTab('variable'); setSelectedTile(variableTiles(variableSymbol)[0].key); }}>{c.tileVariables}</button>}
          </div>
          <div className="math-sim-tile-grid" role="group" aria-label={tileTab === 'number' ? c.tileNumbers : c.tileVariables}>
            {activeTiles.map((tile) => <button type="button" key={tile.key}
              className={`math-sim-picker-tile ${tile.type === 'variable' ? 'is-variable' : tile.value < 0 ? 'is-negative' : 'is-positive'} shape-${tile.shape} ${selectedTile === tile.key ? 'is-selected' : ''} ${draggingSource === `dock-${tile.key}` ? 'is-lifting' : ''}`}
              aria-label={tile.label} aria-pressed={selectedTile === tile.key}
              disabled={busy || !modelReady || ready || Boolean(operationAnimation)}
              onPointerDown={(event) => handleBalanceTilePointerDown(event, tile)}
              onClick={(event) => { if (event.detail === 0) setSelectedTile(tile.key); }}
            ><span>{tile.label}</span></button>)}
          </div>
          <div className="math-sim-add-controls"><button type="button" disabled={busy || !modelReady || ready || Boolean(operationAnimation)} onClick={() => addBalanceTile(0, selectedTileOption)}>{lang === 'en' ? `Add ${selectedTileOption.label} left` : `Tambah ${selectedTileOption.label} kiri`}</button><button type="button" disabled={busy || !modelReady || ready || Boolean(operationAnimation)} onClick={() => addBalanceTile(1, selectedTileOption)}>{lang === 'en' ? `Add ${selectedTileOption.label} right` : `Tambah ${selectedTileOption.label} kanan`}</button></div>
          {questionNumber > 10 && <div className="math-sim-operation-panel">
            <strong>{lang === 'en' ? 'Operations on both sides' : 'Operasi pada kedua ruas'}</strong>
            <p>{operationAnimation ? (lang === 'en' ? 'Applying the operation to both sides…' : 'Menerapkan operasi pada kedua ruas…') : balanceOperation ? c.applyOperation : (lang === 'en' ? 'Choose an operation' : 'Pilih operasi')}</p>
            {!['expand', 'simplify'].includes(next?.operation) && <div className="math-sim-operation-values" aria-label={lang === 'en' ? 'Choose a number' : 'Pilih angka'}>{operationValues.map((value) => <button type="button" key={value} disabled={busy || !modelReady || ready || Boolean(operationAnimation)} className={operationAmount === value ? 'is-selected' : ''} onClick={() => selectBalanceOperationNumber(value)}>{value}</button>)}</div>}
            <div className="math-sim-operation-options">{operationOptions.map((operation) => <button type="button" key={operation} disabled={busy || !modelReady || ready || Boolean(operationAnimation)} className={balanceOperation === operation || balanceOperation === `${operation} ${operationAmount}` ? 'is-selected' : ''} aria-label={operationLabel(['expand', 'simplify'].includes(operation) ? operation : `${operation} ${operationAmount}`, lang)} onClick={() => chooseBalanceOperation(operation)}>{['expand', 'simplify'].includes(operation) ? operationLabel(operation, lang) : operation.replace('*', '×').replace('/', '÷').replace('-', '−')}</button>)}</div>
            {balanceOperation && <div className="math-sim-operation-sides"><button type="button" disabled={busy || operationSides.includes(0) || Boolean(operationAnimation)} onClick={() => applyOperationToSide(0)}>{operationSides.includes(0) ? '✓ ' : ''}{c.applyLeft}</button><button type="button" disabled={busy || operationSides.includes(1) || Boolean(operationAnimation)} onClick={() => applyOperationToSide(1)}>{operationSides.includes(1) ? '✓ ' : ''}{c.applyRight}</button></div>}
          </div>}
          <div className="math-sim-dock-step"><span>{c.step} {Math.min(stepIndex + 1, config.steps.length)}/{config.steps.length}</span><div className="math-sim-progress"><span style={{ width: `${progress}%` }} /></div></div>
        </aside>
      </div>

      {balancePhase !== 'active' ? <div className="math-sim-balance-complete" role="status">
        <span className="math-sim-complete-icon" aria-hidden="true"><PixelIcon name="check" size={20} /></span>
        <div><strong>{c.solvedLabel}</strong><small>{balanceEquation}</small></div>
        <span className="math-sim-complete-timer" aria-hidden="true"><span /></span>
      </div> : <footer className="math-sim-balance-footer">
        <div className="math-sim-balance-guide"><span className="math-sim-guide-mascot" aria-hidden="true"><PixelIcon name="spark" size={23} /></span><p>{c.balanceGuide}</p></div>
        <div className="math-sim-balance-actions">
          <button type="button" className="math-sim-reset" onClick={undoBalance} disabled={busy || !balanceHistory.length || Boolean(operationAnimation)}><PixelIcon name="reset" size={17} /><span>{c.undo}</span></button>
          <span className="math-sim-balance-step-label">{c.step} {Math.min(stepIndex + 1, config.steps.length)}/{config.steps.length}</span>
        </div>
      </footer>}
      {/-\s*\d/.test(equation) && <small className="math-sim-zero"><span>+1</span><span>−1</span><b>= 0</b> {c.zero}</small>}
      {message && !(ready && message === c.ready) && <p className="math-sim-message" role="status">{message}</p>}
      </section>
      {dragGhost && createPortal(<span ref={dragGhostRef} className={`math-sim-drag-ghost ${dragGhost.type === 'variable' ? 'is-variable' : dragGhost.value < 0 ? 'is-negative' : 'is-positive'} shape-${dragGhost.shape || 'square'}`} style={{ left: 0, top: 0, transform: ghostTransform(dragGhost.x, dragGhost.y) }}>{dragGhost.tile}</span>, document.body)}
    </>;
  }

  return <section className={`math-sim math-sim-${config.mode}${modelReady && chapter2Symbolic ? ' math-sim-ch2-host-hidden' : ''}`} aria-label={c.modes[config.mode]}>
    <div className="math-sim-head">
      <div><small>{modelReady ? c.modes[config.mode] : c.model}</small><b>{modelReady ? `${c.step} ${Math.min(stepIndex + 1, config.steps.length)}/${config.steps.length}` : `${modelIndex + 1}/${model.length}`}</b></div>
      <button type="button" onClick={undo} disabled={busy || (!stepIndex && !modelIndex)}>{c.undo}</button>
    </div>
    <div className="math-sim-progress" aria-label={`${progress}%`}><span style={{ width: `${progress}%` }} /></div>

    {!modelReady && <div className="math-sim-model">
      <p>{c.prompts[currentModel.kind]}</p>
      <div className="math-sim-choices">
        {choices.map((choice) => <button key={choice} type="button" disabled={busy} onClick={() => selectModel(choice)}>{choice}</button>)}
      </div>
      {modelIndex > 0 && <small className="math-sim-model-progress">{model.slice(0, modelIndex).map((stage) => stage.correct).join(' → ')}</small>}
    </div>}

    {modelReady && chapter2Symbolic ? createPortal(<section className="math-sim math-sim-balance math-sim-balance-reference chapter-2 math-sim-ch2-reference" aria-label={c.modes.balance}>
      <header className="math-sim-reference-question">
        <div className="math-sim-reference-heading"><span className="math-sim-chapter-gem" aria-hidden="true"><img src="/assets/ui/character-select/icons/crystal-star.webp" alt="" /></span><strong>{c.chapter} 2</strong><i>&#8226;</i><b>{c.question} {((questionNumber - 1) % 10) + 1}/10</b></div>
        <p>{c.balancePrompt}</p>
        <strong className="math-sim-reference-equation">{equation}</strong>
        <div className="math-sim-reference-progress" aria-label={`${progress}%`}><span style={{ width: `${progress}%` }} /></div>
      </header>
      <div className="math-sim-balance-workspace math-sim-ch2-workspace">
        <div className={`math-sim-balance-stage ${operationSides.length === 1 ? (operationSides[0] === 0 ? 'is-left-heavy' : 'is-right-heavy') : 'is-level'}`}>
          <img className="math-sim-chapter-scene" src={chapterScenes[0]} alt="" aria-hidden="true" draggable="false" decoding="async" />
          <BalanceScale left={parseBalanceSide(left, lang)} right={parseBalanceSide(right, lang)} equation={equation} sides={c.sides} selectedTile="" overPans={chapter2HoverSide} tilt={operationSides.length === 1 ? (operationSides[0] === 0 ? 'is-left-heavy' : 'is-right-heavy') : 'is-level'} indicator={operationSides.length === 1 ? (operationSides[0] === 0 ? 'left' : 'right') : 'center'} statusText={operationSides.length === 1 ? c.applyOtherSide : c.balanceStates.center} balanceDelta={operationSides.length === 1 ? (operationSides[0] === 0 ? -1 : 1) : 0} operationAnimation={operationAnimation} interactiveTiles={false} chapter2DropTargets chapter2HoverSide={chapter2HoverSide} chapter2OperationSides={operationSides} chapter2OperationText={chapter2Choices.find((choice) => choice.key === chapter2AppliedChoice)?.tileText || ''} lang={lang} />
        </div>
        <aside className="math-sim-tile-dock">
          <div className="math-sim-dock-heading"><h2>{c.tilePicker}</h2><span aria-hidden="true"><PixelIcon name="hint" size={16} /></span></div>
          <div className="math-sim-tile-tabs" role="tablist" aria-label={c.tilePicker}>
            <button type="button" role="tab" aria-selected="true" disabled={busy || ready}>{lang === 'en' ? 'Operation tiles' : 'Ubin operasi'}</button>
          </div>
          <Chapter2DragPuzzle choices={chapter2Choices} lang={lang} busy={busy || ready || Boolean(operationAnimation)} onDrop={handleChapter2OperationDrop} onHoverSide={setChapter2HoverSide} onSelect={setChapter2SelectedChoice} selectedChoice={chapter2SelectedChoice} />
          <div className="math-sim-add-controls">
            <button type="button" disabled={busy || ready || Boolean(operationAnimation) || !chapter2SelectedChoice} onClick={() => chapter2SelectedChoice && handleChapter2OperationDrop(chapter2SelectedChoice, 'left')}>{lang === 'en' ? `Drop ${chapter2SelectedChoice?.tileText || 'operation'} on left` : `Letakkan ${chapter2SelectedChoice?.tileText || 'operasi'} di kiri`}</button>
            <button type="button" disabled={busy || ready || Boolean(operationAnimation) || !chapter2SelectedChoice} onClick={() => chapter2SelectedChoice && handleChapter2OperationDrop(chapter2SelectedChoice, 'right')}>{lang === 'en' ? `Drop ${chapter2SelectedChoice?.tileText || 'operation'} on right` : `Letakkan ${chapter2SelectedChoice?.tileText || 'operasi'} di kanan`}</button>
          </div>
          <div className="math-sim-dock-step"><span>{c.step} {Math.min(stepIndex + 1, config.steps.length)}/{config.steps.length}</span><div className="math-sim-progress"><span style={{ width: `${progress}%` }} /></div></div>
        </aside>
      </div>
      <footer className="math-sim-balance-footer">
        <div className="math-sim-balance-guide"><span className="math-sim-guide-mascot" aria-hidden="true"><PixelIcon name="spark" size={23} /></span><p>{lang === 'en' ? 'Apply an operation to one pan at a time. The balance tilts until you apply the same operation to the other pan.' : 'Terapkan operasi ke satu piring timbangan terlebih dahulu. Timbangan akan miring sampai operasi yang sama diterapkan ke piring sebelahnya.'}</p></div>
        <div className="math-sim-balance-actions"><span className="math-sim-balance-step-label">{c.step} {Math.min(stepIndex + 1, config.steps.length)}/{config.steps.length}</span></div>
      </footer>
    </section>, document.querySelector('.battle-reference-arena') || document.body) : modelReady && <>
      <div className="math-sim-equation" aria-label={equation}>
        <div><small>{c.sides[0]}</small><Side text={left} mode={config.mode} /></div>
        <span className="math-sim-equals">=</span>
        <div><small>{c.sides[1]}</small><Side text={right} mode={config.mode} groups={initialGroup} /></div>
      </div>
      {config.mode === 'balance' && /-\s*\d/.test(equation) && <small className="math-sim-zero"><span>+1</span><span>−1</span><b>= 0</b> {c.zero}</small>}
      <div className="math-sim-transition"><span>{c.before}: {previousEquation || equation}</span><span>{c.after}: {previousEquation ? equation : c.choose}</span></div>
      {next ? <>
        <div className="math-sim-choices">
          {stepOptions.map((choice) => <button key={choice.key} type="button" disabled={busy} onClick={() => selectStep(choice.key)}>{choice.label}</button>)}
        </div>
        {hintsUsed > 0 && <p className="math-sim-hint">{c.hint}: {operationLabel(localizeEquation(next.operation, lang), lang)}</p>}
      </> : <p className="math-sim-ready">{c.ready}</p>}
    </>}
    {!chapter2Symbolic && message && !(ready && message === c.ready) && <p className="math-sim-message" role="status">{message}</p>}
  </section>;
}
