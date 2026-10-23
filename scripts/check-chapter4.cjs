const assert = require('node:assert/strict');
const esbuild = require('esbuild');
const { mount } = require('./check-chapter-balance.cjs');

const code = esbuild.buildSync({ entryPoints: ['frontend/src/data/algebraSimulation.js'], bundle: true, format: 'cjs', platform: 'node', write: false }).outputFiles[0].text;
const mod = { exports: {} };
new Function('module', 'exports', code)(mod, mod.exports);
const { SIMULATIONS, getChapter4OperationValues, equivalentBalanceOperations } = mod.exports;

// Independently check the displayed arithmetic, rather than only matching the
// simulation's answer strings. Input is restricted to arithmetic from fixtures.
function evaluate(expression, variable) {
  const arithmetic = expression.replace(/−/g, '-').replace(/,/g, '.')
    .replace(/[a-z]/gi, `(${variable})`).replace(/(\d|\))\s*(?=\()/g, '$1*');
  assert.match(arithmetic, /^[\d\s+\-*/().]+$/);
  return new Function(`return (${arithmetic});`)();
}
const near = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-8, `${message}: ${actual} != ${expected}`);
const values = (sim) => sim.find(sim.has('math-sim-operation-values'))[0].props.children.filter((node) => node?.type === 'button');
const selectValue = (sim, value) => sim.click(values(sim).find((node) => sim.text(node) === value));
const symbol = { '+': '+', '-': '−', '*': '×', '/': '÷' };
let completedCases = 0;

for (const lang of ['id', 'en']) {
  const questions = require(`../backend/solvoxQuestions${lang === 'en' ? '.en' : ''}.json`);
  for (let id = 31; id <= 40; id++) for (const firstSide of [0, 1]) {
    const sim = mount(id, lang);
    const config = SIMULATIONS[id];
    const distribution = sim.find((node) => node.type?.name === 'DistributiveModel')[0];
    if (distribution) {
      const model = distribution.props.model;
      for (const group of model.groups) for (const [term, product] of group.terms) for (const probe of [-5, 0, 3]) {
        near((group.negative ? -1 : 1) * Number(group.factor) * evaluate(term, probe), evaluate(product, probe), `Q${id}: distribution`);
      }
      distribution.props.onComplete(); sim.render();
    }
    assert.ok(sim.find(sim.has('math-sim-operation-panel')).length, `Q${id}: operation panel is available`);
    assert.equal(sim.find(sim.has('math-sim-tile-grid')).length, 0, 'Chapter 4 uses one consistent operation workflow');
    if (id === 39) assert.equal(sim.scale().equation, '9x − 2x − 5 = 3x + 11', 'Expanded like terms remain visible before simplification');
    while (sim.progress().stepsCompleted < config.steps.length) {
      const stage = sim.progress().stepsCompleted;
      const step = config.steps[stage];
      const before = sim.scale().equation;
      const beforeRows = [sim.scale().left, sim.scale().right];
      const expectedSides = step.sideResults || step.after.split('=').map((side) => side.trim());
      for (const side of [0, 1]) for (const probe of [-5, 0, 3]) {
        const previous = evaluate(before.split('=')[side], probe);
        let transformed = previous;
        const arithmetic = step.operation.match(/^([+\-*/])\s+(.+)$/);
        if (arithmetic) {
          const amount = evaluate(arithmetic[2], probe);
          transformed = { '+': () => previous + amount, '-': () => previous - amount, '*': () => previous * amount, '/': () => previous / amount }[arithmetic[1]]();
        }
        near(evaluate(expectedSides[side], probe), transformed, `Q${id}: route preserves the requested algebraic operation`);
      }
      if (['expand', 'simplify'].includes(step.operation)) {
        const panel = sim.find(sim.has('math-sim-operation-options'))[0];
        sim.click(panel.props.children[0]);
      } else {
        const [, operator, amount] = step.operation.match(/^([+\-*/])\s+(.+)$/);
        const choices = values(sim).map(sim.text);
        assert.ok(choices.includes(amount), `Q${id} step ${stage + 1}: required value ${amount} exists`);
        for (const choice of getChapter4OperationValues(config, stage)) assert.ok(choices.includes(choice));
        selectValue(sim, amount);
        sim.operation(symbol[operator]);
      }
      sim.apply(firstSide);
      assert.equal(sim.progress().stepsCompleted, stage, 'One pan alone does not complete the operation');
      assert.deepEqual(sim.scale()[firstSide ? 'left' : 'right'], beforeRows[1 - firstSide], 'The other pan stays unchanged');
      for (const probe of [-5, 0, 3]) near(evaluate(sim.scale().equation.split('=')[firstSide], probe), evaluate(expectedSides[firstSide], probe), `Q${id}: first pan`);
      const undo = sim.find(sim.has('math-sim-reset'))[0];
      sim.click(undo);
      assert.equal(sim.scale().equation, before, 'Undo restores the entire previous equation');
      sim.apply(firstSide); sim.apply(1 - firstSide);
      assert.equal(sim.progress().stepsCompleted, stage + 1, 'Both pans complete the step immediately');
      for (const side of [0, 1]) for (const probe of [-5, 0, 3]) near(evaluate(sim.scale().equation.split('=')[side], probe), evaluate(expectedSides[side], probe), `Q${id}: completed pan ${side}`);
      if (stage + 1 < config.steps.length && !['expand', 'simplify'].includes(config.steps[stage + 1].operation)) {
        const selected = values(sim).find((node) => node.props.className === 'is-selected');
        assert.equal(sim.text(selected), config.steps[stage + 1].operation.slice(2), 'The previous number does not leak into the next step');
      }
    }
    assert.equal(sim.progress().stepErrors, 0);
    const answer = Number(questions.find((question) => question.id === id).answer);
    for (const side of config.equation.split('=')) near(evaluate(side, answer), evaluate(config.equation.split('=')[0], answer), `Q${id}: official answer satisfies the original equation`);
    if (id === 33) assert.equal(sim.scale().equation, '6 = a', 'The last operation keeps the variable on its actual pan');
    sim.flushTimers(5000);
    assert.equal(sim.progress().ready, true, 'The solved equation becomes ready for automatic attack');
    assert.equal(sim.completion().questionId, id);
    completedCases++;
  }
}
assert.equal(completedCases, 40);
console.log('PASS all 10 Chapter 4 questions in both languages, left/right first: algebraic validity, independent pans, undo, official answers and completion');

for (let id = 31; id <= 40; id++) {
  const sim = mount(id);
  const distribution = sim.find((node) => node.type?.name === 'DistributiveModel')[0];
  if (distribution) { distribution.props.onComplete(); sim.render(); }
  if (SIMULATIONS[id].steps[sim.progress().stepsCompleted].operation === 'simplify') {
    sim.click(sim.find(sim.has('math-sim-operation-options'))[0].props.children[0]);
    sim.apply(0); sim.apply(1);
  }
  const step = SIMULATIONS[id].steps[sim.progress().stepsCompleted];
  const [, operator, amount] = step.operation.match(/^([+\-*/])\s+(.+)$/);
  const opposite = amount.startsWith('-') ? amount.slice(1) : `-${amount}`;
  const before = sim.scale().equation;
  selectValue(sim, opposite); sim.operation(symbol[operator]); sim.apply(0);
  assert.equal(sim.progress().stepErrors, 1, `Q${id}: a wrong signed operation is recorded immediately`);
  assert.equal(sim.scale().equation, before, `Q${id}: rejected operations leave the equation intact`);
}
console.log('PASS all 10 Chapter 4 questions reject incorrect signed operations without changing the equation');

for (const lang of ['id', 'en']) for (const id of [34, 38, 39, 40]) {
  const sim = mount(id, lang);
  const model = sim.mountDistribution();
  const factor = (index) => sim.find(sim.has('math-sim-distributive-factor'))[index];
  const target = (group, term) => sim.find((node) => node.props['data-distributive-target'] === `${group}:${term}`)[0];
  const proceed = () => sim.find(sim.has('math-sim-distributive-actions'))[0].props.children[1];
  assert.equal(proceed().props.disabled, true, 'Distribution cannot be skipped before every term is handled');
  if (model.groups.length > 1) {
    sim.click(factor(0)); sim.click(target(1, 0));
    assert.equal(sim.distributionEvents.errors, 1, 'A factor from the other side is rejected');
    assert.equal(sim.find(sim.has('is-applied')).length, 0);
  }
  for (const [groupIndex, group] of model.groups.entries()) for (let termIndex = 0; termIndex < group.terms.length; termIndex++) {
    if (lang === 'id') {
      sim.click(factor(groupIndex)); sim.click(target(groupIndex, termIndex));
    } else {
      let payload;
      factor(groupIndex).props.onDragStart({ dataTransfer: { setData: (_type, value) => { payload = value; } } });
      target(groupIndex, termIndex).props.onDrop({ preventDefault() {}, dataTransfer: { getData: () => payload } });
      sim.render();
    }
    assert.ok(target(groupIndex, termIndex).props.className.includes('is-applied'));
  }
  assert.equal(proceed().props.disabled, false);
  sim.click(sim.find(sim.has('math-sim-distributive-back'))[0]);
  assert.equal(proceed().props.disabled, true, 'Undo requires the last factor to be applied again');
  const lastGroup = model.groups.length - 1;
  sim.click(factor(lastGroup)); sim.click(target(lastGroup, model.groups[lastGroup].terms.length - 1));
  sim.click(proceed());
  assert.equal(sim.distributionEvents.completed, 1, 'The completed visual model opens the balance');
}
console.log('PASS Chapter 4 parentheses models: tap/drag every factor, reject wrong-side factors, undo and continue');

for (const [actual, expected] of [['+ -2x', '- 2x'], ['- -3', '+ 3'], ['/ 1/4', '* 4'], ['* -1/6', '/ -6']]) {
  assert.equal(equivalentBalanceOperations(actual, expected), true, `Equivalent operations: ${actual} / ${expected}`);
}
for (const [actual, expected] of [['/ 0', '* 4'], ['- 3', '+ 3'], ['- 2', '- 2x'], ['+ (1/4)x', '- (1/4)x']]) {
  assert.equal(equivalentBalanceOperations(actual, expected), false);
}
const inverse = mount(31);
selectValue(inverse, '-2x'); inverse.operation('+'); inverse.apply(0); inverse.apply(1);
selectValue(inverse, '-3'); inverse.operation('−'); inverse.apply(0); inverse.apply(1);
selectValue(inverse, '-3'); inverse.operation('÷'); inverse.apply(0);
assert.equal(inverse.progress().stepErrors, 1, 'A genuinely wrong signed divisor is rejected immediately');
selectValue(inverse, '3'); inverse.operation('÷'); inverse.apply(0); inverse.apply(1);
assert.equal(inverse.scale().equation, 'x = 4');
console.log('PASS equivalent inverse operations are accepted and incorrect signed operations are rejected');

const reciprocal = mount(37);
selectValue(reciprocal, '(1/4)x'); reciprocal.operation('−'); reciprocal.apply(0); reciprocal.apply(1);
selectValue(reciprocal, '3'); reciprocal.operation('−'); reciprocal.apply(0); reciprocal.apply(1);
selectValue(reciprocal, '1/4'); reciprocal.operation('÷'); reciprocal.apply(0); reciprocal.apply(1);
assert.equal(reciprocal.scale().equation, 'x = 8', 'Dividing by 1/4 is accepted as equivalent to multiplying by 4');
console.log('PASS Chapter 4 fraction coefficients support equivalent reciprocal operations');
