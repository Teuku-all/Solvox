const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const esbuild = require('esbuild');

const code = esbuild.transformSync(fs.readFileSync('frontend/src/components/battle/Battle.jsx', 'utf8').replaceAll('import.meta.env.DEV', 'false'), { loader: 'jsx', format: 'cjs' }).code;

async function check(levelId) {
  const questionId = (levelId - 1) * 10 + 1;
  const slots = [], deps = [], timers = new Map();
  let cursor = 0, dirty = false, effects = [], tree, attacks = 0, sounds = 0, timerId = 0;
  function MathSimulation() {}
  function CombatStage() {}
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } }),
    useCallback: (fn) => fn,
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (update) => {
        const value = typeof update === 'function' ? update(slots[index]) : update;
        if (!Object.is(value, slots[index])) { slots[index] = value; dirty = true; }
      }];
    },
    useRef(initial) { const index = cursor++; return slots[index] ||= { current: initial }; },
    useEffect(callback, dependencies) {
      const index = cursor++;
      if (!deps[index] || dependencies.some((value, i) => !Object.is(value, deps[index][i]))) effects.push(callback);
      deps[index] = dependencies;
    },
  };
  const modules = {
    react,
    './MathSimulation': { default: MathSimulation, __esModule: true },
    './CombatStage': { default: CombatStage, __esModule: true },
    '../../data/playerAssets': { getPlayerAsset: () => ({ id: 'test', portrait: '' }) },
    '../../data/algebraSimulation': { SIMULATIONS: { [questionId]: {} }, getSimulationAnswer: () => '8' },
    '../../services/singlePlayerGame': { loadChapterQuestions: () => Promise.resolve([{ id: questionId, text: 'x + 7 = 15' }]) },
    '../../data/levels': { LEVELS: [{ id: levelId }] },
    '../../data/player': { PLAYER: { stats: { hp: 100 } } },
    '../../data/bosses': { getBoss: () => ({ hp: 100, damage: 10, spriteId: 'test' }) },
    '../../data/bossAssets': { getBossImpactMs: () => 120, getBossSequenceDurationMs: () => 500 },
    '../../services/sound': { playBossAttack: () => sounds++, playSound() {} },
  };
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports,
    require: (name) => modules[name] || { default: () => null, __esModule: true },
    window: { setTimeout: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; }, clearTimeout: (id) => timers.delete(id) },
  });
  const props = { levelId, lang: 'id', t: (key) => key };
  function render() {
    let passes = 0;
    do {
      assert.ok(++passes < 15);
      cursor = 0; dirty = false; effects = [];
      tree = mod.exports.default(props);
      effects.forEach((callback) => callback());
    } while (dirty);
  }
  function find(predicate, node) {
    if (arguments.length === 1) node = tree;
    if (!node || typeof node !== 'object') return [];
    return [...(predicate(node) ? [node] : []), ...(node.props?.children || []).flatMap((child) => find(predicate, child))];
  }
  render();
  // Let the real question-loading promise complete before interacting.
  for (let i = 0; i < 4; i++) await Promise.resolve();
  render();
  find((node) => node.type === CombatStage)[0].props.ref.current = { bossAttack: () => attacks++, playerHurt() {} };
  const progress = { questionId, ready: false, modelCorrect: true, modelErrors: 0, stepErrors: 1 };
  find((node) => node.type === MathSimulation)[0].props.onProgress(progress);
  assert.equal(attacks, 1, 'The first error starts the boss attack synchronously, without waiting for another side or timer');
  assert.equal(sounds, 1);
  render();
  const simulation = find((node) => node.type === MathSimulation)[0];
  assert.equal(simulation.props.busy, true);
  assert.equal(simulation.props.visible, false);
  simulation.props.onProgress(progress);
  assert.equal(attacks, 1, 'A repeated progress report does not trigger another attack');
  const impact = [...timers.values()].find((timer) => timer.delay === 120);
  assert.ok(impact, 'Damage is timed to the boss animation impact');
  impact.callback(); render();
  assert.ok(find((node) => node.props['aria-label'] === '90/100 HP').length);
  console.log(`PASS Chapter ${levelId}: first wrong simulation action immediately attacks once and deducts HP at impact`);
}

(async () => { await check(1); await check(3); await check(4); })().catch((error) => { console.error(error); process.exitCode = 1; });
