import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const format = (value, lang) => String(Number(value.toFixed(6))).replace('.', lang === 'en' ? '.' : ',');

function readModel(config) {
  const equation = config.equation.replace(/\s/g, '').replace(/,/g, '.');
  const result = Number(config.steps.at(-1)?.after.split('=')[1]?.trim().replace(',', '.'));
  const quotient = equation.match(/^([a-z])\/([\d.]+)=([+-]?[\d.]+)$/i);
  if (quotient && Number(quotient[2]) > 0 && Number(quotient[2]) < 1) {
    const parts = Math.round(1 / Number(quotient[2]));
    const pieces = Number(quotient[3]);
    if (Number.isInteger(parts) && pieces > 0 && Number.isInteger(pieces / parts) && result === pieces / parts) {
      return { kind: 'measure', variable: quotient[1], parts, pieces, result };
    }
  }
  const fraction = equation.match(/^([+-]?)\(?([1-9]\d*)\/([2-9]\d*)\)?([a-z])=([+-]?[\d.]+)$/i);
  const unit = equation.match(/^([+-]?)([a-z])\/([2-9]\d*)=([+-]?[\d.]+)$/i);
  const decimal = equation.match(/^([+-]?)(0\.\d+)([a-z])=([+-]?[\d.]+)$/i);
  let model;
  if (fraction) model = { parts: Number(fraction[3]), filled: Number(fraction[2]), variable: fraction[4], total: Number(fraction[5]), negative: fraction[1] === '-', decimal: false };
  else if (unit) model = { parts: Number(unit[3]), filled: 1, variable: unit[2], total: Number(unit[4]), negative: unit[1] === '-', decimal: false };
  else if (decimal) model = { parts: 10 ** decimal[2].split('.')[1].length, filled: Number(decimal[2]) * 10 ** decimal[2].split('.')[1].length, variable: decimal[3], total: Number(decimal[4]), negative: decimal[1] === '-', decimal: true };
  if (!model || !Number.isFinite(result) || model.filled > model.parts || model.filled < 1 || model.parts > 20) return null;
  const signedResult = (model.negative ? -1 : 1) * model.total * model.parts / model.filled;
  if (Math.abs(signedResult - result) > 1e-8) return null;
  return { kind: 'fraction', ...model, result, partValue: model.total / model.filled };
}

export const supportsChapter2FractionLab = (config) => Boolean(config && readModel(config));

const initialProgress = () => ({ cutLeft: false, cutRight: false, pairs: [], whole: [], signs: [], measure: {}, complete: false });

function NumberBar({ value, lang }) {
  const absolute = Math.abs(value);
  const units = Math.floor(absolute + 1e-8);
  const fraction = Math.round((absolute - units) * 10);
  return <span className={`c2f-number-bar ${value < 0 ? 'is-negative' : ''}`} aria-label={format(value, lang)}>
    {units > 0 && <span className="c2f-number-whole">{Array.from({ length: units }, (_, index) => <i key={index} />)}</span>}
    {fraction > 0 && <span className="c2f-ten-bar" aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <i key={index} className={index < fraction ? 'is-filled' : ''} />)}</span>}
    {!units && !fraction && <span className="c2f-number-whole">0</span>}
    <b>{format(value, lang)}</b>
  </span>;
}

export default function Chapter2FractionLab({ config, lang = 'id', busy, onSolved, onUndo, onMistake }) {
  const model = readModel(config);
  const [progress, setProgress] = useState(initialProgress);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [ghost, setGhost] = useState(null);
  const cleanupRef = useRef(null);
  const rootRef = useRef(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  useEffect(() => () => cleanupRef.current?.(), []);
  if (!model) return null;

  const english = lang === 'en';
  const t = english ? {
    cut: 'Drag the cutter onto both bars to show equal pieces.',
    measureCut: `Drag the cutter onto the unit tray to make ${model.pieces} movable pieces.`,
    pair: 'Drag each coloured variable piece onto one equal number piece.',
    build: 'Drag the matched pair repeatedly into the whole-variable strip.',
    measure: 'Drag two half-unit pieces into each whole-unit frame.',
    sign: 'Drag the sign-flip tile onto both sides.',
    cutter: 'CUT INTO EQUAL PARTS', pairLabel: 'MATCHED PAIR', signTool: 'FLIP SIGNS',
    left: 'VARIABLE BAR', right: 'NUMBER BAR', whole: 'ONE WHOLE VARIABLE',
    unit: 'ONE NUMBER UNIT', result: 'Whole variable', undo: 'Undo', reset: 'Restart',
    wrong: 'Drop this piece on the matching target.', full: 'That space is already filled.',
    done: 'Whole variable rebuilt!', step: 'Step',
  } : {
    cut: 'Seret alat pemotong ke kedua batang untuk menunjukkan bagian yang sama besar.',
    measureCut: `Seret alat pemotong ke baki satuan untuk membuat ${model.pieces} kepingan yang dapat dipindah.`,
    pair: 'Seret setiap kepingan variabel berwarna ke kepingan bilangan yang sama besar.',
    build: 'Seret pasangan yang sudah cocok berulang kali ke batang variabel utuh.',
    measure: 'Seret dua kepingan setengah satuan ke tiap bingkai satu satuan.',
    sign: 'Seret ubin pembalik tanda ke kedua ruas.',
    cutter: 'POTONG SAMA BESAR', pairLabel: 'PASANGAN SETARA', signTool: 'BALIK TANDA',
    left: 'BATANG VARIABEL', right: 'BATANG BILANGAN', whole: 'SATU VARIABEL UTUH',
    unit: 'SATU SATUAN BILANGAN', result: 'Variabel utuh', undo: 'Urungkan', reset: 'Ulangi',
    wrong: 'Letakkan kepingan pada tempat pasangannya.', full: 'Tempat itu sudah terisi.',
    done: 'Variabel utuh berhasil disusun!', step: 'Tahap',
  };
  const fraction = model.kind === 'fraction';
  const cutDone = fraction ? progress.cutLeft && progress.cutRight : progress.cutRight;
  const paired = fraction && progress.pairs.length === model.filled;
  const wholeDone = fraction && progress.whole.length === model.parts;
  const measureDone = !fraction && Object.values(progress.measure).reduce((sum, count) => sum + count, 0) === model.pieces;
  const phase = !cutDone ? 'cut' : fraction ? !paired ? 'pair' : !wholeDone ? 'build' : model.negative && progress.signs.length < 2 ? 'sign' : 'done' : !measureDone ? 'measure' : 'done';
  const phases = fraction ? ['cut', 'pair', 'build', ...(model.negative ? ['sign'] : [])] : ['cut', 'measure'];
  const instruction = phase === 'cut' ? fraction ? t.cut : t.measureCut : t[phase] || t.done;

  const commit = (next) => {
    setHistory((items) => [...items, progressRef.current]);
    progressRef.current = next;
    setProgress(next);
    setMessage('');
    if (next.complete) onSolved?.();
  };
  const reject = (feedback = t.wrong) => { setMessage(feedback); onMistake?.(); };
  const place = (piece, target) => {
    if (busy || progressRef.current.complete) return;
    const current = progressRef.current;
    if (phase === 'cut' && piece.kind === 'cutter') {
      if (target === 'cut-left' && fraction && !current.cutLeft) commit({ ...current, cutLeft: true });
      else if (target === 'cut-right' && !current.cutRight) commit({ ...current, cutRight: true });
      else reject();
      return;
    }
    if (phase === 'pair' && piece.kind === 'variable' && target.startsWith('pair-')) {
      const index = Number(target.slice(5));
      if (index >= model.filled || current.pairs.some((pair) => pair.source === piece.index || pair.target === index)) { reject(t.full); return; }
      commit({ ...current, pairs: [...current.pairs, { source: piece.index, target: index }] });
      return;
    }
    if (phase === 'build' && piece.kind === 'matched' && target.startsWith('whole-')) {
      const index = Number(target.slice(6));
      if (index >= model.parts || current.whole.includes(index)) { reject(t.full); return; }
      const whole = [...current.whole, index];
      commit({ ...current, whole, complete: whole.length === model.parts && !model.negative });
      return;
    }
    if (phase === 'sign' && piece.kind === 'sign' && target.startsWith('sign-')) {
      const side = target.slice(5);
      if (!['left', 'right'].includes(side) || current.signs.includes(side)) { reject(t.full); return; }
      const signs = [...current.signs, side];
      commit({ ...current, signs, complete: signs.length === 2 });
      return;
    }
    if (phase === 'measure' && piece.kind === 'half' && target.startsWith('measure-')) {
      const index = Number(target.slice(8));
      if (index >= model.result || current.measure[index] >= model.parts || Object.values(current.measure).reduce((sum, count) => sum + count, 0) >= model.pieces) { reject(t.full); return; }
      const measure = { ...current.measure, [index]: (current.measure[index] || 0) + 1 };
      commit({ ...current, measure, complete: Object.values(measure).reduce((sum, count) => sum + count, 0) === model.pieces });
      return;
    }
    reject();
  };
  const startDrag = (event, piece) => {
    if (busy || progress.complete || event.button !== 0) return;
    event.preventDefault();
    cleanupRef.current?.();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;
    setGhost({ label: piece.label, x: startX, y: startY });
    const move = (next) => {
      if (next.pointerId !== pointerId) return;
      moved ||= Math.abs(next.clientX - startX) + Math.abs(next.clientY - startY) > 8;
      setGhost({ label: piece.label, x: next.clientX, y: next.clientY });
    };
    const finish = (next) => {
      if (next.pointerId !== pointerId) return;
      const hit = document.elementFromPoint(next.clientX, next.clientY)?.closest('[data-fraction-drop]');
      const target = rootRef.current?.contains(hit) ? hit.dataset.fractionDrop : '';
      cleanupRef.current?.();
      setGhost(null);
      if (moved && target) place(piece, target);
      else if (!moved) setMessage(english ? 'Drag the piece to its target.' : 'Seret kepingan ke tempat tujuannya.');
    };
    const cancel = () => { cleanupRef.current?.(); setGhost(null); };
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
  const draggable = (piece, className, content, disabled = false) => <button type="button" className={className} disabled={busy || disabled} onPointerDown={(event) => startDrag(event, piece)} aria-label={piece.label}>{content}</button>;
  const undo = () => {
    if (busy || !history.length) return;
    const previous = history.at(-1);
    progressRef.current = previous;
    setProgress(previous);
    setHistory((items) => items.slice(0, -1));
    setMessage('');
    if (progress.complete) onUndo?.();
  };
  const reset = () => {
    if (busy) return;
    progressRef.current = initialProgress();
    setProgress(progressRef.current);
    setHistory([]);
    setMessage('');
    onUndo?.();
  };
  const partLabel = fraction ? `${model.negative ? '−' : ''}1/${model.parts}${model.variable}` : `1/${model.parts}`;
  const sourceLabel = fraction ? `${model.negative ? '−' : ''}${model.filled}/${model.parts}${model.variable}` : `${model.variable} ÷ 1/${model.parts}`;

  return <section ref={rootRef} className="c2f-lab" aria-label={english ? 'Fraction and decimal strip workshop' : 'Bengkel batang pecahan dan desimal'}>
    <p className="c2f-instruction">{instruction}</p>
    <ol className="c2f-steps" aria-label={t.step}>{phases.map((name, index) => <li key={name} className={name === phase ? 'is-active' : phases.indexOf(phase) > index || phase === 'done' ? 'is-complete' : ''}><b>{index + 1}</b><span>{name === 'cut' ? english ? 'Cut' : 'Potong' : name === 'pair' ? english ? 'Pair' : 'Pasangkan' : name === 'build' ? english ? 'Make a whole' : 'Susun utuh' : name === 'measure' ? english ? 'Join halves' : 'Gabung setengah' : english ? 'Flip signs' : 'Balik tanda'}</span></li>)}</ol>
    <div className="c2f-board">
      {fraction ? <>
        <div className="c2f-pan is-variable">
          <header><small>{t.left}</small><strong>{sourceLabel}</strong></header>
          <div className={`c2f-strip ${progress.cutLeft ? 'is-cut' : ''}`} data-fraction-drop={phase === 'cut' ? 'cut-left' : undefined} style={{ '--parts': model.parts }}>
            {Array.from({ length: model.parts }, (_, index) => <div key={index} className={`c2f-strip-part ${index < model.filled ? 'is-filled' : ''}`}>
              {index < model.filled && (phase === 'pair' && !progress.pairs.some((pair) => pair.source === index) ? draggable({ kind: 'variable', index, label: partLabel }, 'c2f-piece is-variable', <span>{partLabel}</span>) : <span>{progress.cutLeft ? partLabel : ''}</span>)}
            </div>)}
          </div>
          <small>{english ? `Shaded: ${model.filled} of ${model.parts} equal variable parts` : `Diarsir: ${model.filled} dari ${model.parts} bagian variabel`}</small>
        </div>
        <div className="c2f-pan is-number">
          <header><small>{t.right}</small><strong>{format(model.total, lang)}</strong></header>
          <div className="c2f-known" data-fraction-drop={phase === 'cut' ? 'cut-right' : undefined}>
            {!progress.cutRight ? <NumberBar value={model.total} lang={lang} /> : Array.from({ length: model.filled }, (_, index) => <div key={index} className={`c2f-known-part ${progress.pairs.some((pair) => pair.target === index) ? 'is-paired' : ''}`} data-fraction-drop={phase === 'pair' ? `pair-${index}` : undefined}><NumberBar value={model.partValue} lang={lang} /></div>)}
          </div>
          <small>{progress.cutRight ? `${format(model.total, lang)} ÷ ${model.filled} = ${format(model.partValue, lang)}` : t.unit}</small>
        </div>
        {paired && <div className="c2f-rebuild">
          <header><small>{t.whole}</small><strong>{model.negative && progress.signs.length < 2 ? '−' : ''}{model.variable} = {format(model.partValue * progress.whole.length, lang)}</strong></header>
          <div className="c2f-whole-strip" style={{ '--parts': Math.min(model.parts, 5) }}>
            {Array.from({ length: model.parts }, (_, index) => <div key={index} className={progress.whole.includes(index) ? 'is-filled' : ''} data-fraction-drop={phase === 'build' ? `whole-${index}` : undefined}><span>{progress.whole.includes(index) ? partLabel : `${index + 1}/${model.parts}`}</span></div>)}
          </div>
          <small>{format(model.partValue, lang)} × {progress.whole.length} = {format(model.partValue * progress.whole.length, lang)}</small>
          {phase === 'sign' && <div className="c2f-sign-targets"><div className={progress.signs.includes('left') ? 'is-filled' : ''} data-fraction-drop="sign-left">{progress.signs.includes('left') ? model.variable : `−${model.variable}`}</div><span>=</span><div className={progress.signs.includes('right') ? 'is-filled' : ''} data-fraction-drop="sign-right">{progress.signs.includes('right') ? format(model.result, lang) : format(-model.result, lang)}</div></div>}
        </div>}
      </> : <>
        <div className="c2f-pan is-number"><header><small>{t.unit}</small><strong>1 = {model.parts} × 1/{model.parts}</strong></header><div className="c2f-half-reference" style={{ '--parts': model.parts }}>{Array.from({ length: model.parts }, (_, index) => <span key={index}>1/{model.parts}</span>)}</div></div>
        <div className="c2f-pan is-number"><header><small>{english ? 'NUMBER OF PARTS' : 'JUMLAH BAGIAN'}</small><strong>{model.pieces} × 1/{model.parts}</strong></header><div className="c2f-half-tray" data-fraction-drop={phase === 'cut' ? 'cut-right' : undefined}>{progress.cutRight ? Array.from({ length: model.pieces }, (_, index) => draggable({ kind: 'half', index, label: `1/${model.parts}` }, 'c2f-piece is-half', `1/${model.parts}`, Object.values(progress.measure).reduce((sum, count) => sum + count, 0) > index)) : <NumberBar value={model.pieces / model.parts} lang={lang} />}</div></div>
        {progress.cutRight && <div className="c2f-rebuild"><header><small>{t.whole}</small><strong>{model.variable} = {Object.values(progress.measure).filter((count) => count === model.parts).length}</strong></header><div className="c2f-measure-grid">{Array.from({ length: model.result }, (_, index) => <div key={index} data-fraction-drop={phase === 'measure' ? `measure-${index}` : undefined} className="c2f-measure-slot"><small>{english ? 'WHOLE' : 'UTUH'} {index + 1}</small><span style={{ '--parts': model.parts }}>{Array.from({ length: model.parts }, (_, part) => <i key={part} className={part < (progress.measure[index] || 0) ? 'is-filled' : ''} />)}</span></div>)}</div></div>}
      </>}
    </div>
    <footer className="c2f-footer">
      <div className="c2f-toolbox">{phase === 'cut' && draggable({ kind: 'cutter', label: t.cutter }, 'c2f-tool is-cutter', <><span aria-hidden="true">✂</span>{t.cutter}</>)}
        {phase === 'build' && draggable({ kind: 'matched', label: `${partLabel} = ${format(model.partValue, lang)}` }, 'c2f-tool is-matched', <><span aria-hidden="true">⇔</span>{partLabel} = {format(model.partValue, lang)}</>)}
        {phase === 'sign' && draggable({ kind: 'sign', label: t.signTool }, 'c2f-tool is-sign', <><span aria-hidden="true">±</span>{t.signTool}</>)}
        {phase === 'done' && <strong className="c2f-result">{t.result}: {model.variable} = {format(model.result, lang)}</strong>}
        <p role="status" aria-live="polite">{message || instruction}</p></div>
      <div className="c2f-actions"><button type="button" onClick={undo} disabled={busy || !history.length}>{t.undo}</button><button type="button" onClick={reset} disabled={busy}>{t.reset}</button></div>
    </footer>
    {ghost && createPortal(<span className="c2f-ghost" style={{ left: ghost.x, top: ghost.y }}>{ghost.label}</span>, document.body)}
  </section>;
}
