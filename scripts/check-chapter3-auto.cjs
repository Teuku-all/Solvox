const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');

const frontend = path.join(__dirname, '../frontend');
const React = require(require.resolve('react', { paths: [frontend] }));
const { renderToStaticMarkup } = require(require.resolve('react-dom/server', { paths: [frontend] }));
const bundled = esbuild.buildSync({
  entryPoints: [path.join(frontend, 'src/components/battle/BattleQuestionPanel.jsx')],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  external: ['react'],
  write: false,
}).outputFiles[0].text;
const panelModule = { exports: {} };
new Function('require', 'module', 'exports', bundled)(
  (id) => require(require.resolve(id, { paths: [frontend] })),
  panelModule,
  panelModule.exports,
);

const BattleQuestionPanel = panelModule.exports.default;
const props = {
  q: { text: '2x + 5 = 17', context: 'Selesaikan persamaan.', concept: 'Persamaan dua langkah' },
  levelId: 3,
  meta: { title: 'Chapter 3' },
  lang: 'id',
  t: (key) => key,
  round: 1,
  totalRounds: 10,
  idx: 0,
  answer: '',
  setAnswer() {},
  busy: false,
  onOpenSimulation() {},
  submit() {},
  hintsUsed: 0,
  hintsLeft: 3,
  hintCost: 5,
  currentHp: 100,
  useHint() {},
  keypadVisible: true,
  onToggleKeypad() {},
  autoResolve: true,
};

for (const simulationReady of [false, true]) {
  const html = renderToStaticMarkup(React.createElement(BattleQuestionPanel, { ...props, simulationReady }));
  assert.match(html, /is-auto-resolve/);
  assert.doesNotMatch(html, /hint-rail|battle-keypad-side|battle-answer-input|battle-mistake-banner/);
  if (simulationReady) assert.match(html, /role="status"/);
  else assert.match(html, /<button[^>]*class="question-answer-auto"/);
}

const algebraSource = fs.readFileSync(path.join(frontend, 'src/data/algebraSimulation.js'), 'utf8');
const algebraCode = esbuild.transformSync(algebraSource, { format: 'cjs' }).code;
const algebraModule = { exports: {} };
new Function('module', 'exports', algebraCode)(algebraModule, algebraModule.exports);
for (const lang of ['id', 'en']) {
  const questions = require(path.join(__dirname, `../backend/solvoxQuestions${lang === 'en' ? '.en' : ''}.json`));
  for (let id = 21; id <= 30; id++) {
    const expected = algebraModule.exports.getSimulationAnswer(id);
    assert.equal(expected, questions.find((item) => item.id === id)?.answer, `Chapter 3 question ${id} (${lang})`);
  }
}

console.log('PASS Chapter 3 panel hides manual tools and every simulation answer matches the question bank');
