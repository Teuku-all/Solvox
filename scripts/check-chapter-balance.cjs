const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const fs = require('node:fs');
const vm = require('node:vm');

const algebraModule = { exports: {} };
new Function('module', 'exports', esbuild.transformSync(fs.readFileSync('frontend/src/data/algebraSimulation.js', 'utf8'), { format: 'cjs' }).code)(algebraModule, algebraModule.exports);
const { SIMULATIONS } = algebraModule.exports;

const code = esbuild.buildSync({
  entryPoints: ['frontend/src/components/battle/MathSimulation.jsx'],
  bundle: true, format: 'cjs', platform: 'node', external: ['react', 'react-dom'], write: false,
}).outputFiles[0].text;

function mount(questionId, lang = 'id') {
  const slots = [], dependencies = [], listeners = {}, timers = new Map();
  let cursor = 0, dirty = false, tree, effects = [], progress, solved, target = 'left', nextTimerId = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } }),
    Fragment: 'fragment',
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (update) => {
        const value = typeof update === 'function' ? update(slots[index]) : update;
        if (!Object.is(value, slots[index])) { slots[index] = value; dirty = true; }
      }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ||= { current: initial };
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (!dependencies[index] || deps.some((value, i) => !Object.is(value, dependencies[index][i]))) effects.push(callback);
      dependencies[index] = deps;
    },
  };
  const mod = { exports: {} };
  vm.runInNewContext(code, {
    module: mod, exports: mod.exports,
    require: (name) => name === 'react' ? react : { createPortal: (node) => node },
    window: {
      setTimeout: (callback, delay) => { const id = ++nextTimerId; timers.set(id, { callback, delay }); return id; },
      clearTimeout: (id) => timers.delete(id),
      requestAnimationFrame: () => 1, cancelAnimationFrame() {},
      addEventListener: (name, fn) => { listeners[name] = fn; },
      removeEventListener: (name) => { delete listeners[name]; },
    },
    document: {
      querySelector: () => null,
      body: {},
      elementsFromPoint: () => [
        { closest: () => null }, // A visual overlay may be above the pan.
        { closest: () => ({ dataset: { balanceSide: target } }) },
      ],
      elementFromPoint: () => ({ closest: () => ({ classList: { contains: (name) => name === `is-${target}` } }) }),
    },
  });
  const props = { questionId, lang, busy: false, onProgress: (value) => { progress = value; }, onBalanceSolved: (value) => { solved = value; } };
  function render() {
    let passes = 0;
    do {
      assert.ok(++passes < 15, 'Render should settle');
      dirty = false; cursor = 0; effects = [];
      tree = mod.exports.default(props);
      effects.forEach((callback) => callback());
    } while (dirty);
    return tree;
  }
  function find(predicate, node) {
    if (arguments.length === 1) node = tree;
    if (!node || typeof node !== 'object') return [];
    return [...(predicate(node) ? [node] : []), ...(node.props?.children || []).flatMap((child) => find(predicate, child))];
  }
  const has = (name) => (node) => (node.props.className || '').split(' ').includes(name);
  const text = (node) => typeof node === 'string' || typeof node === 'number' ? String(node) : (node?.props?.children || []).map(text).join('');
  function click(node) {
    assert.ok(node, 'Control should exist');
    assert.ok(!node.props.disabled, `Control should be enabled: ${text(node)}`);
    node.props.onClick({ detail: 0 }); render();
  }
  function operation(symbol) {
    const panel = find(has('math-sim-operation-options'))[0];
    click(panel.props.children.find((node) => text(node) === symbol));
  }
  function apply(side) {
    const panel = find(has('math-sim-operation-sides'))[0];
    click(panel.props.children[side]);
  }
  function dragTile(label, side = 'left') {
    const tile = find(has('math-sim-picker-tile')).find((node) => node.props['aria-label'] === label);
    assert.ok(tile && !tile.props.disabled, `Tile ${label} should be available`);
    target = side;
    tile.props.onPointerDown({ button: 0, pointerId: 1, clientX: 10, clientY: 10, preventDefault() {} });
    listeners.pointermove({ pointerId: 1, clientX: 40, clientY: 40 });
    listeners.pointerup({ pointerId: 1, clientX: 40, clientY: 40 });
    render();
  }
  function finishZeroPairs() {
    for (const [id, timer] of timers) {
      if (timer.delay !== 420) continue;
      timers.delete(id);
      timer.callback();
      render();
    }
  }
  function finishAutoSimplify() {
    for (const [id, timer] of timers) {
      if (timer.delay !== 900) continue;
      timers.delete(id);
      timer.callback();
      render();
    }
  }
  function finishTimedStep(delay) {
    const timer = [...timers].find(([, value]) => value.delay === delay);
    assert.ok(timer, `Expected a ${delay} ms transition timer`);
    timers.delete(timer[0]);
    timer[1].callback();
    render();
  }
  function finishSolved() {
    const timer = [...timers].find(([, value]) => value.delay === 4650 || value.delay === 2000);
    assert.ok(timer, 'A completed balance must schedule the next question');
    timers.delete(timer[0]);
    timer[1].callback();
    render();
  }
  const scale = () => find((node) => node.type?.name === 'BalanceScale')[0].props;
  render();
  return { render, find, has, click, text, operation, apply, dragTile, finishZeroPairs, finishAutoSimplify, finishTimedStep, finishSolved, scale, progress: () => progress, solved: () => solved };
}

for (const lang of ['id', 'en']) {
  const sim = mount(25, lang);
  assert.equal(sim.scale().left[0].expression, true);
  sim.operation('×'); sim.apply(0);
  assert.equal(sim.scale().left.some((tile) => tile.expression), false);
  assert.equal(sim.scale().right.reduce((sum, tile) => sum + tile.value, 0), 5, 'Right must remain unchanged');
  assert.match(sim.scale().equation, /x \+ 4 = 5/);
  assert.equal(sim.progress().stepsCompleted, 0);
  sim.apply(1);
  assert.match(sim.scale().equation, /x \+ 4 = 15/);
  assert.equal(sim.progress().stepsCompleted, 1, 'Second pan updates without waiting for a timer');
  sim.operation('−'); sim.apply(0);
  assert.equal(sim.scale().equation, 'x = 15');
  sim.apply(1);
  assert.equal(sim.scale().equation, 'x = 11');

  const divide = mount(22, lang);
  divide.operation('+'); divide.apply(0); divide.apply(1);
  divide.operation('÷'); divide.apply(0);
  assert.equal(divide.scale().equation, 'y = 21');
  divide.apply(1);
  assert.equal(divide.scale().equation, 'y = 7');

  for (const id of [1, 21, 25]) {
    const wrong = mount(id, lang);
    const before = wrong.scale().equation;
    wrong.dragTile('+1');
    assert.equal(wrong.progress().stepErrors, 1, `Question ${id}: first wrong drop is recorded immediately`);
    assert.equal(wrong.scale().equation, before, 'Wrong drop leaves equation unchanged');
  }
  const valid = mount(1, lang);
  for (let i = 0; i < 7; i++) valid.dragTile('−1');
  assert.equal(valid.progress().stepErrors, 0, 'Correct one-side intermediate changes are allowed');
  valid.dragTile('−1');
  assert.equal(valid.progress().stepErrors, 1, 'An extra tile beyond the inverse value is rejected');

  const fraction = mount(28, lang);
  assert.equal(fraction.scale().left.length, 2, 'Question 8 must show two separate tiles');
  assert.equal(fraction.scale().left[0].fractionNumerator, 2);
  assert.equal(fraction.scale().left[0].fractionDenominator, 5);
  assert.equal(fraction.scale().left[1].value, -3);
  assert.equal(fraction.scale().left[1].label, '−3');
  for (const side of ['left', 'right']) for (let i = 0; i < 3; i++) fraction.dragTile('+1', side);
  assert.equal(fraction.progress().stepErrors, 0);
  assert.equal(fraction.scale().equation, '2/5y = 10');
  fraction.operation('×'); fraction.apply(0);
  assert.equal(fraction.scale().equation, 'y = 10');
  fraction.apply(1);
  assert.equal(fraction.scale().equation, 'y = 25');

  const undo = mount(21, lang);
  undo.operation('−'); undo.apply(0);
  undo.click(undo.find(undo.has('math-sim-reset'))[0]);
  assert.equal(undo.scale().equation, '2x + 5 = 17', 'Undo restores both sides before a partial operation');
  const reversed = mount(25, lang);
  reversed.operation('×'); reversed.apply(1);
  assert.equal(reversed.scale().equation, '(x + 4) / 3 = 15');
  reversed.apply(0);
  assert.equal(reversed.scale().equation, 'x + 4 = 15');

  const last = mount(30, lang);
  const distribution = last.find((node) => node.type?.name === 'DistributiveModel')[0];
  distribution.props.onComplete(); last.render();
  while (last.progress().stepsCompleted < last.progress().stepsTotal) {
    const operationPanel = last.find(last.has('math-sim-operation-options'))[0];
    assert.deepEqual(operationPanel.props.children.map(last.text), ['+', '−', '×', '÷']);
    const expected = ['−', '+', '÷'][last.progress().stepsCompleted - 1];
    last.operation(expected); last.apply(0); last.apply(1);
  }
  assert.equal(last.scale().equation, 'x = 1');

  const chapter4 = mount(31, lang);
  const variableTab = chapter4.find((node) => node.props.role === 'tab' && node.props['aria-selected'] === false)[0];
  chapter4.click(variableTab);
  const negativeX = String.fromCharCode(8722) + 'x';
  chapter4.dragTile(negativeX, 'left');
  assert.equal(chapter4.progress().stepErrors, 0, 'Correct Chapter 4 tile must not count as an error');
  assert.ok(chapter4.scale().left.some((tile) => tile.isCanceling), 'Opposite tiles should visibly form a zero pair');
  chapter4.finishZeroPairs();
  assert.equal(chapter4.scale().left.filter((tile) => tile.type === 'variable').length, 4, 'One x disappears as soon as the zero-pair animation completes');
  chapter4.dragTile(negativeX, 'left'); chapter4.finishZeroPairs();
  for (let i = 0; i < 2; i++) { chapter4.dragTile(negativeX, 'right'); chapter4.finishZeroPairs(); }
  assert.equal(chapter4.scale().equation.replace(/\u2212/g, '-'), '3x - 3 = 9');
  assert.equal(chapter4.progress().stepsCompleted, 1);
  chapter4.click(chapter4.find((node) => node.props.role === 'tab' && node.props['aria-selected'] === false)[0]);
  for (const side of ['left', 'right']) for (let i = 0; i < 3; i++) {
    chapter4.dragTile('+1', side);
    chapter4.finishZeroPairs();
  }
  assert.equal(chapter4.scale().equation, '3x = 12');
  assert.equal(chapter4.progress().stepsCompleted, 2);
  assert.equal(chapter4.progress().stepErrors, 0);
  chapter4.operation(String.fromCharCode(247)); chapter4.apply(0); chapter4.apply(1);
  assert.equal(chapter4.scale().equation, 'x = 4');

  const storyArithmetic = mount(45, lang);
  storyArithmetic.find((node) => node.type?.name === 'Chapter5ModelBuilder')[0].props.onComplete();
  storyArithmetic.render();
  assert.equal(storyArithmetic.find(storyArithmetic.has('math-sim-operation-options')).length, 0, 'Chapter 5 must not show a manual simplify button');
  storyArithmetic.finishAutoSimplify();
  assert.equal(storyArithmetic.scale().equation, lang === 'en' ? '5x = 35,000' : '5x = 35.000');
  assert.equal(storyArithmetic.progress().stepsCompleted, 1);

  const storyLikeTerms = mount(49, lang);
  storyLikeTerms.find((node) => node.type?.name === 'Chapter5ModelBuilder')[0].props.onComplete();
  storyLikeTerms.render();
  storyLikeTerms.operation(String.fromCharCode(215)); storyLikeTerms.apply(0); storyLikeTerms.apply(1);
  assert.equal(storyLikeTerms.find(storyLikeTerms.has('math-sim-operation-options')).length, 0, 'Like terms after multiplying are also automatic');
  storyLikeTerms.finishAutoSimplify();
  assert.equal(storyLikeTerms.scale().equation, '5x = 100');
  console.log(`PASS (${lang}): independent pan updates, wrong-drop errors, fraction tiles, Chapter 4 tile interaction, and arithmetic-only question 10`);
}

// Reproduce every Chapter 1 tile placement, including decimal and fraction units.
for (const lang of ['id', 'en']) {
  for (let id = 1; id <= 10; id++) {
    const sim = mount(id, lang);
    const step = SIMULATIONS[id].steps[0];
    const [, sign, amount] = step.operation.match(/^([+-])\s*(.+)$/) || [];
    assert.ok(sign, `Question ${id}: inverse tile operation is available`);
    const prefix = sign === '-' ? String.fromCharCode(8722) : '+';
    const labels = amount === '1/2' ? [`${prefix}1/2`]
      : Number.isInteger(Number(amount.replace(',', '.'))) ? Array(Number(amount.replace(',', '.'))).fill(`${prefix}1`)
        : [...Array(Math.floor(Number(amount.replace(',', '.')))).fill(`${prefix}1`), `${sign === '-' && id === 6 ? '-' : prefix}0,5`];
    for (const side of ['left', 'right']) for (const label of labels) sim.dragTile(label, side);
    assert.equal(sim.progress().stepsCompleted, 1, `Question ${id} (${lang}) did not complete with correct tiles`);
    assert.equal(sim.progress().stepErrors, 0, `Question ${id} (${lang}) counted correct tiles as errors`);
    sim.finishSolved();
    assert.equal(sim.progress().ready, true, `Question ${id} (${lang}) did not become ready`);
    assert.equal(sim.solved()?.questionId, id, `Question ${id} (${lang}) did not report completion`);
  }
  console.log(`PASS (${lang}): all Chapter 1 tile routes complete without false damage`);
}

// Follow every later-chapter balance route through the controls a player sees.
for (const lang of ['id', 'en']) {
  for (let id = 21; id <= 50; id++) {
    const sim = mount(id, lang);
    const config = SIMULATIONS[id];
    if (id >= 41) {
      const builder = sim.find((node) => node.type?.name === 'Chapter5ModelBuilder')[0];
      assert.ok(builder, `Question ${id}: story model must be available`);
      builder.props.onComplete();
      sim.render();
    }
    const distributive = sim.find((node) => node.type?.name === 'DistributiveModel')[0];
    if (distributive) {
      distributive.props.onComplete();
      sim.render();
    }
    while (sim.progress().stepsCompleted < config.steps.length) {
      const index = sim.progress().stepsCompleted;
      const step = config.steps[index];
      const tileStep = id === 31 && index < 2 || id === 33 && index < 3;
      if (tileStep) {
        const [, sign, amount, variable] = step.operation.match(/^([+-])\s*(\d+)([a-z])?$/i) || [];
        assert.ok(amount, `Question ${id} step ${index + 1}: tile count is readable`);
        const label = `${sign === '-' ? String.fromCharCode(8722) : '+'}${variable || '1'}`;
        if (!sim.find(sim.has('math-sim-picker-tile')).some((node) => node.props['aria-label'] === label)) {
          sim.click(sim.find((node) => node.props.role === 'tab' && node.props['aria-selected'] === false)[0]);
        }
        for (const side of ['left', 'right']) for (let i = 0; i < Number(amount); i++) {
          sim.dragTile(label, side);
          sim.finishZeroPairs();
        }
      } else if (id >= 41 && step.operation === 'simplify') {
        sim.finishAutoSimplify();
      } else if (['expand', 'simplify'].includes(step.operation)) {
        const button = sim.find(sim.has('math-sim-operation-options'))[0]?.props.children[0];
        assert.ok(button, `Question ${id} step ${index + 1}: transformation button exists`);
        sim.click(button);
        sim.apply(0);
        sim.finishTimedStep(1050);
      } else {
        const [, operator, amount] = step.operation.match(/^([+\-*/])\s*(.+)$/) || [];
        assert.ok(operator, `Question ${id} step ${index + 1}: operation is available`);
        const choices = sim.find(sim.has('math-sim-operation-values'))[0];
        const valueButton = choices?.props.children.flat(Infinity).find((node) => sim.text(node) === amount);
        assert.ok(valueButton, `Question ${id} step ${index + 1}: value ${amount} is selectable`);
        sim.click(valueButton);
        sim.operation({ '+': '+', '-': String.fromCharCode(8722), '*': String.fromCharCode(215), '/': String.fromCharCode(247) }[operator]);
        sim.apply(0);
        sim.apply(1);
      }
      assert.equal(sim.progress().stepsCompleted, index + 1, `Question ${id} (${lang}) stalled at step ${index + 1}: ${step.operation}`);
      assert.equal(sim.progress().stepErrors, 0, `Question ${id} (${lang}) counted a correct step as an error`);
    }
    sim.finishSolved();
    assert.equal(sim.progress().ready, true, `Question ${id} (${lang}) did not become ready`);
    assert.equal(sim.solved()?.questionId, id, `Question ${id} (${lang}) did not report its completion`);
  }
  console.log(`PASS (${lang}): every Chapter 3-5 balance route completes through available controls`);
}
