const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require('esbuild');

const source = fs.readFileSync(path.join(__dirname, '../frontend/src/components/battle/Chapter2FractionLab.jsx'), 'utf8');
const code = esbuild.transformSync(source, { loader: 'jsx', format: 'cjs' }).code;
const cases = [
  { id: 13, equation: 'a / 5 = 6', after: 'a = 30', pieces: 1, whole: 5 },
  { id: 14, equation: 'm / 4 = -9', after: 'm = -36', pieces: 1, whole: 4 },
  { id: 15, equation: '(2/3)x = 12', after: 'x = 18', pieces: 2, whole: 3 },
  { id: 17, equation: 'y / 0,5 = 14', after: 'y = 7', measure: 14 },
  { id: 18, equation: '0,4k = 1,6', after: 'k = 4', pieces: 4, whole: 10 },
  { id: 19, equation: '-(3/4)n = 15', after: 'n = -20', pieces: 3, whole: 4, negative: true },
];

function mount(config, lang) {
  let slots = [], cursor = 0, solved = 0, mistakes = 0, undone = 0, target = '';
  const listeners = {};
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } }),
    Fragment: 'fragment',
    useEffect: () => {},
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: (name) => name === 'react' ? react : { createPortal: () => null },
    window: {
      addEventListener: (name, handler) => { listeners[name] = handler; },
      removeEventListener: (name) => { delete listeners[name]; },
    },
    document: { elementFromPoint: () => ({ closest: () => ({ dataset: { fractionDrop: target } }) }) },
  });
  const props = { config, lang, busy: false, onSolved: () => solved++, onMistake: () => mistakes++, onUndo: () => undone++ };
  const render = () => {
    cursor = 0;
    const tree = module.exports.default(props);
    tree.props.ref.current = { contains: () => true };
    return tree;
  };
  const find = (node, predicate) => {
    if (!node || typeof node !== 'object') return [];
    const rendered = typeof node.type === 'function' ? node.type(node.props) : node;
    return [
      ...(predicate(rendered) ? [rendered] : []),
      ...(rendered.props?.children || []).flatMap((child) => find(child, predicate)),
    ];
  };
  const has = (name) => (node) => (node.props?.className || '').split(' ').includes(name);
  const drag = (source, destination) => {
    assert.ok(source, `Missing drag source for ${destination}`);
    target = destination;
    source.props.onPointerDown({ button: 0, pointerId: 1, clientX: 10, clientY: 10, preventDefault() {} });
    assert.ok(listeners.pointermove);
    listeners.pointermove({ pointerId: 1, clientX: 30, clientY: 30 });
    listeners.pointerup({ pointerId: 1, clientX: 30, clientY: 30 });
  };
  return { render, find, has, drag, supports: module.exports.supportsChapter2FractionLab, counts: () => ({ solved, mistakes, undone }) };
}

for (const lang of ['id', 'en']) for (const example of cases) {
  const config = { equation: example.equation, steps: [{ after: example.after }] };
  const lab = mount(config, lang);
  assert.ok(lab.supports(config), `Question ${example.id} should use the visual workshop`);
  assert.equal(lab.find(lab.render(), lab.has('c2f-lab')).length, 1);
  const cut = (destination) => lab.drag(lab.find(lab.render(), lab.has('is-cutter'))[0], destination);
  if (example.measure) cut('cut-right');
  else { cut('cut-left'); cut('cut-right'); }

  if (example.measure) {
    assert.equal(lab.find(lab.render(), lab.has('is-half')).length, example.measure);
    for (let index = 0; index < example.measure; index++) {
      const piece = lab.find(lab.render(), lab.has('is-half')).find((node) => !node.props.disabled);
      lab.drag(piece, `measure-${Math.floor(index / 2)}`);
    }
  } else {
    assert.equal(lab.find(lab.render(), lab.has('c2f-known-part')).length, example.pieces);
    if (example.id === 18) assert.equal(lab.find(lab.render(), lab.has('c2f-ten-bar')).length, 4);
    for (let index = 0; index < example.pieces; index++) {
      const piece = lab.find(lab.render(), lab.has('c2f-piece')).find((node) => node.props['aria-label']?.includes('/'));
      lab.drag(piece, `pair-${index}`);
    }
    for (let index = 0; index < example.whole; index++) {
      lab.drag(lab.find(lab.render(), lab.has('is-matched'))[0], `whole-${index}`);
    }
    if (example.negative) {
      assert.equal(lab.counts().solved, 0, 'The negative variable needs both signs flipped');
      lab.drag(lab.find(lab.render(), lab.has('is-sign'))[0], 'sign-left');
      lab.drag(lab.find(lab.render(), lab.has('is-sign'))[0], 'sign-right');
    }
  }
  assert.equal(lab.counts().solved, 1, `Question ${example.id} should finish once`);
  assert.equal(lab.find(lab.render(), lab.has('c2f-result')).length, 1);
  console.log(`PASS Chapter 2 question ${example.id - 10} (${lang}): dragged to ${example.after}`);
}
