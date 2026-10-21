import React, { useEffect, useState } from 'react';
import { SIMULATIONS, STORY_MODELS, STORY_MODELS_EN, operationLabel } from '../../data/algebraSimulation';

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
    chapter: 'Chapter', question: 'Soal',
    tilePicker: 'Pilih ubin', tileNumbers: 'Ubin bilangan', tileVariables: 'Ubin variabel',
    applyBoth: 'Terapkan ke kedua ruas', tileWrong: 'Pilih ubin yang menghilangkan suku pada langkah ini.',
    balanceGuide: 'Pilih ubin yang sesuai, lalu terapkan pada kedua sisi agar timbangan tetap seimbang.',
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
    chapter: 'Chapter', question: 'Question',
    tilePicker: 'Choose a tile', tileNumbers: 'Number tiles', tileVariables: 'Variable tiles',
    applyBoth: 'Apply to both sides', tileWrong: 'Choose a tile that removes a term in this step.',
    balanceGuide: 'Choose the matching tile, then apply it to both sides to keep the scale balanced.',
    hint: 'Hint for the next step',
    zero: '+1 and −1 form a zero pair.',
    result: 'Variable value',
  },
};

const splitEquation = (equation) => equation.split('=').map((side) => side.trim());
const localizeEquation = (equation, lang) => lang === 'en'
  ? equation.replace(/\b\d{1,3}(?:\.\d{3})+\b/g, (number) => number.replace(/\./g, ','))
    .replace(/(\d),(\d)(?!\d{2,})/g, '$1.$2')
  : equation;

function balanceTiles(term) {
  const token = term.replace(/\s+/g, '');
  const variable = token.match(/^([+-]?)(\d+)([a-z])$/i);
  if (variable && Number(variable[2]) <= 6) return Array.from({ length: Number(variable[2]) }, (_, index) => <span className="is-variable" key={index}>{variable[1]}{variable[3]}</span>);
  const number = Number(token.replace(',', '.'));
  if (Number.isInteger(number) && Math.abs(number) > 0 && Math.abs(number) <= 9) return Array.from({ length: Math.abs(number) }, (_, index) => <span className={number < 0 ? 'is-negative' : 'is-unit'} key={index}>{number < 0 ? '−1' : '+1'}</span>);
  return <span className={/[a-z]/i.test(token) ? 'is-variable' : number < 0 ? 'is-negative' : Number.isFinite(number) && Math.abs(number) > 9 ? 'is-total' : 'is-unit'}>{token}</span>;
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

const numberTiles = ['+1', '+2', '+3', '+5', '−1', '−2', '−3', '−5', '+7', '−7', '+10', '−10', '×2', '÷2', '×3', '÷3', '+½', '−½', '+¼', '−¼'];
const variableTiles = ['+x', '−x', '+2x', '−2x'];
const normalizeOperation = (operation) => operation.replace(/\s+/g, '').replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
function tileForOperation(operation) {
  const match = operation?.match(/^([+\-*/])\s*(.+)$/);
  if (!match) return '';
  const [, operator, value] = match;
  const symbol = operator === '*' ? '×' : operator === '/' ? '÷' : operator === '-' ? '−' : '+';
  return `${symbol}${value.replace(/\s+/g, '')}`;
}

function BalanceScale({ left, right, equation, sides }) {
  return <div className="math-sim-balance-scale" aria-label={equation}>
    <div className="math-sim-scale-beam" aria-hidden="true"><span /></div>
    <div className="math-sim-scale-crystal" aria-hidden="true">◆</div>
    <div className="math-sim-scale-post" aria-hidden="true" />
    <div className="math-sim-scale-pans">
      <div className="math-sim-scale-pan">
        <small>{sides[0]}</small>
        <Side text={left} mode="balance" />
      </div>
      <span className="math-sim-scale-equals" aria-hidden="true">=</span>
      <div className="math-sim-scale-pan">
        <small>{sides[1]}</small>
        <Side text={right} mode="balance" />
      </div>
    </div>
    <div className="math-sim-scale-base" aria-hidden="true" />
  </div>;
}

export default function MathSimulation({ questionId, questionText, lang, hintsUsed, busy, onProgress }) {
  const config = SIMULATIONS[Number(questionId)];
  const model = (lang === 'en' ? STORY_MODELS_EN : STORY_MODELS)[Number(questionId)] || [];
  const c = copy[lang === 'en' ? 'en' : 'id'];
  const [modelIndex, setModelIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [modelErrors, setModelErrors] = useState(0);
  const [stepErrors, setStepErrors] = useState(0);
  const [message, setMessage] = useState('');
  const [tileTab, setTileTab] = useState('number');
  const [selectedTile, setSelectedTile] = useState('');

  const modelReady = modelIndex >= model.length;
  const ready = Boolean(config && modelReady && stepIndex >= config.steps.length);

  useEffect(() => {
    onProgress({ questionId: Number(questionId), ready, modelCorrect: modelReady, modelErrors, stepErrors, stepsCompleted: stepIndex, stepsTotal: config?.steps.length || 0 });
  }, [onProgress, questionId, ready, modelReady, modelErrors, stepErrors, stepIndex, config]);

  if (!config) return null;

  const equation = localizeEquation(stepIndex ? config.steps[stepIndex - 1].after : config.equation, lang);
  const previousEquation = stepIndex ? localizeEquation(stepIndex === 1 ? config.equation : config.steps[stepIndex - 2].after, lang) : null;
  const [left, right] = splitEquation(equation);
  const initialGroup = config.mode === 'groups' && !stepIndex ? Number(config.equation.match(/^(\d+)(?:[a-z]|\()/i)?.[1] || 0) : 0;
  const next = config.steps[stepIndex];
  useEffect(() => { setSelectedTile(''); }, [stepIndex, questionId]);
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
      setMessage(next.operation === 'expand' || next.operation === 'simplify' ? c.term : c.equal);
      return;
    }
    if (choice === 'sign') {
      setStepErrors((count) => count + 1);
      setMessage(c.signError);
      return;
    }
    setStepIndex((index) => index + 1);
    setMessage(stepIndex + 1 === config.steps.length ? c.ready : c.stepDone);
  };

  const applyBalanceTile = () => {
    if (busy || !next) return;
    if (!selectedTile || normalizeOperation(tileForOperation(next.operation)) !== normalizeOperation(selectedTile)) {
      setStepErrors((count) => count + 1);
      setMessage(selectedTile ? c.tileWrong : c.choose);
      return;
    }
    setStepIndex((index) => index + 1);
    setMessage(stepIndex + 1 === config.steps.length ? c.ready : c.stepDone);
  };

  const undo = () => {
    if (busy) return;
    if (stepIndex > 0) setStepIndex((index) => index - 1);
    else if (modelIndex > 0) setModelIndex((index) => index - 1);
    setMessage('');
  };

  const stepOptions = next ? [
    { key: 'correct', label: operationLabel(localizeEquation(next.operation, lang), lang) },
    { key: 'oneSide', label: next.operation === 'expand' || next.operation === 'simplify' ? c.firstTerm : c.oneSide },
    { key: 'sign', label: c.sign },
  ] : [];
  if ((Number(questionId) + stepIndex) % 2 === 0) stepOptions.reverse();
  const progress = Math.round(((modelIndex + stepIndex) / (model.length + config.steps.length)) * 100);

  if (config.mode === 'balance') {
    const chapterNumber = Math.ceil(Number(questionId) / 10);
    const chapterQuestion = ((Number(questionId) - 1) % 10) + 1;
    const requiredTile = next ? tileForOperation(next.operation) : '';
    const activeTiles = tileTab === 'number' ? [...numberTiles] : [...variableTiles];
    if (requiredTile && (tileTab === 'number') !== /[a-z]/i.test(requiredTile) && !activeTiles.includes(requiredTile)) activeTiles.unshift(requiredTile);
    const [balanceLeft, balanceRight] = splitEquation(equation);

    return <section className="math-sim math-sim-balance math-sim-balance-reference" aria-label={c.modes.balance}>
      <header className="math-sim-reference-question">
        <div className="math-sim-reference-heading"><span className="math-sim-chapter-gem" aria-hidden="true">✦</span><strong>{c.chapter} {chapterNumber}</strong><i>•</i><b>{c.question} {chapterQuestion}/10</b></div>
        <p>{questionText || c.balancePrompt}</p>
        <strong className="math-sim-reference-equation">{localizeEquation(config.equation, lang)}</strong>
        <div className="math-sim-reference-progress" aria-label={`${progress}%`}><span style={{ width: `${progress}%` }} /></div>
      </header>

      <div className="math-sim-balance-workspace">
        <div className="math-sim-balance-stage"><BalanceScale left={balanceLeft} right={balanceRight} equation={equation} sides={c.sides} /></div>
        <aside className="math-sim-tile-dock">
          <div className="math-sim-dock-heading"><h2>{c.tilePicker}</h2><span aria-hidden="true">i</span></div>
          <div className="math-sim-tile-tabs" role="tablist" aria-label={c.tilePicker}>
            <button type="button" role="tab" aria-selected={tileTab === 'number'} onClick={() => { setTileTab('number'); setSelectedTile(''); }}>{c.tileNumbers}</button>
            <button type="button" role="tab" aria-selected={tileTab === 'variable'} onClick={() => { setTileTab('variable'); setSelectedTile(''); }}>{c.tileVariables}</button>
          </div>
          <div className="math-sim-tile-grid">
            {activeTiles.map((tile) => <button
              type="button"
              key={tile}
              className={`${/[a-z]/i.test(tile) ? 'is-variable' : /^[−-]/.test(tile) ? 'is-negative' : 'is-positive'} ${selectedTile === tile ? 'is-selected' : ''}`}
              aria-pressed={selectedTile === tile}
              disabled={busy || ready}
              onClick={() => { setSelectedTile(tile); setMessage(''); }}
            >{tile}</button>)}
          </div>
          <div className="math-sim-dock-step"><span>{c.step} {Math.min(stepIndex + 1, config.steps.length)}/{config.steps.length}</span><div className="math-sim-progress"><span style={{ width: `${progress}%` }} /></div></div>
        </aside>
      </div>

      <footer className="math-sim-balance-footer">
        <div className="math-sim-balance-guide"><span className="math-sim-guide-mascot" aria-hidden="true">✦</span><p>{c.balanceGuide}</p></div>
        <div className="math-sim-balance-actions">
          <button type="button" className="math-sim-reset" onClick={undo} disabled={busy || (!stepIndex && !modelIndex)}>↶ <span>{c.undo}</span></button>
          {next ? <button type="button" className="math-sim-apply" onClick={applyBalanceTile} disabled={busy}><span>{c.applyBoth}</span></button> : <p className="math-sim-ready">{c.ready}</p>}
        </div>
      </footer>
      {config.mode === 'balance' && /-\s*\d/.test(equation) && <small className="math-sim-zero"><span>+1</span><span>−1</span><b>= 0</b> {c.zero}</small>}
      {message && !(ready && message === c.ready) && <p className="math-sim-message" role="status">{message}</p>}
    </section>;
  }

  return <section className={`math-sim math-sim-${config.mode}`} aria-label={c.modes[config.mode]}>
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

    {modelReady && <>
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
    {message && !(ready && message === c.ready) && <p className="math-sim-message" role="status">{message}</p>}
  </section>;
}
