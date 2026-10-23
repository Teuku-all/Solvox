const assert = require('node:assert/strict');
const fs = require('node:fs');
const esbuild = require('esbuild');
const vm = require('node:vm');

const source = fs.readFileSync('frontend/src/components/battle/Chapter2Partition.jsx', 'utf8');
const code = esbuild.transformSync(source, { loader: 'jsx', format: 'cjs' }).code;
const cases = [
  { id: 11, equation: '4x = 28', after: 'x = 7', groups: 4, rightPerGroup: 7 },
  { id: 12, equation: '-3y = 21', after: 'y = -7', groups: 3, rightPerGroup: 7, flip: true },
  { id: 16, equation: '-8p = -56', after: 'p = 7', groups: 8, rightPerGroup: 1, flip: true },
  { id: 20, equation: '15z = -75', after: 'z = -5', groups: 15, rightPerGroup: 1 },
];

function mount(example, lang) {
  const slots = [];
  let cursor = 0, tree, solved = 0, mistakes = 0;
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children: children.flat(Infinity) } }),
    Fragment: 'fragment',
    useMemo: (callback) => callback(),
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (update) => { slots[index] = typeof update === 'function' ? update(slots[index]) : update; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ||= { current: initial };
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module, exports: module.exports,
    require: (name) => name === 'react' ? react : null,
    window: { setTimeout() {} },
    document: {},
  });
  const props = {
    config: { equation: example.equation, steps: [{ after: example.after }] },
    questionId: example.id, lang, busy: false,
    onSolved: () => solved++, onMistake: () => mistakes++, onUndo() {},
  };
  const render = () => { cursor = 0; tree = module.exports.default(props); return tree; };
  const find = (predicate, node = tree) => !node || typeof node !== 'object' ? [] : [
    ...(predicate(node) ? [node] : []),
    ...(node.props?.children || []).flatMap((child) => find(predicate, child)),
  ];
  const has = (name) => (node) => (node.props.className || '').split(' ').includes(name);
  const click = (node) => {
    assert.ok(node && !node.props.disabled, `Expected enabled ${node?.props.className || 'control'}`);
    node.props.onClick({ stopPropagation() {}, preventDefault() {}, target: null, currentTarget: null });
    render();
  };
  render();
  return { render, find, has, click, counts: () => ({ solved, mistakes }) };
}

for (const lang of ['id', 'en']) for (const example of cases) {
  const game = mount(example, lang);
  for (let i = 0; i < example.groups - 1; i++) {
    game.click(game.find(game.has('c2p-place-divider'))[0]);
    game.click(game.find(game.has('c2p-place-divider'))[1]);
  }
  for (const [side, perGroup] of [['left', 1], ['right', example.rightPerGroup]]) {
    const pool = () => game.find((node) => node.props['data-c2p-pool'] === side)[0];
    const itemIds = game.find((node) => node.props['data-c2p-item'], pool()).map((node) => node.props['data-c2p-item']);
    for (const [index, itemId] of itemIds.entries()) {
      const tile = game.find((node) => node.props['data-c2p-item'] === itemId, pool())[0];
      game.click(tile);
      const group = game.find((node) => node.props['data-c2p-group'] === `${side}:${Math.floor(index / perGroup)}`)[0];
      game.click(group);
    }
  }
  for (let index = 0; index < example.groups; index++) {
    game.click(game.find((node) => node.props['data-c2p-group'] === `left:${index}`)[0]);
    game.click(game.find((node) => node.props['data-c2p-group'] === `right:${index}`)[0]);
  }
  if (example.flip) game.click(game.find(game.has('c2p-flip-signs'))[0]);
  assert.equal(game.counts().solved, 1, `Question ${example.id} (${lang}) did not finish grouping`);
  assert.equal(game.counts().mistakes, 0, `Question ${example.id} (${lang}) rejected a correct group`);
  assert.equal(game.find(game.has('c2p-solved')).length, 1);
  console.log(`PASS Chapter 2 question ${example.id - 10} (${lang}): grouped to ${example.after}`);
}
