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
  return <span className={/[a-z]/i.test(token) ? 'is-variable' : number < 0 ? 'is-negative' : 'is-unit'}>{token}</span>;
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

export default function MathSimulation({ questionId, lang, hintsUsed, busy, onProgress }) {
  const config = SIMULATIONS[Number(questionId)];
  const model = (lang === 'en' ? STORY_MODELS_EN : STORY_MODELS)[Number(questionId)] || [];
  const c = copy[lang === 'en' ? 'en' : 'id'];
  const [modelIndex, setModelIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [modelErrors, setModelErrors] = useState(0);
  const [stepErrors, setStepErrors] = useState(0);
  const [message, setMessage] = useState('');

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
