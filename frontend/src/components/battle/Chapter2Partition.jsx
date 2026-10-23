import React, { useMemo, useState } from 'react';

const localize = (value, lang) => lang === 'en'
  ? String(value).replace(/(\d),(\d)(?!\d{2,})/g, '$1.$2')
  : String(value).replace(/(\d)\.(\d)/g, '$1,$2');

function readEquation(config, lang) {
  const match = config.equation.replace(/\s/g, '').match(/^([+-]?)(\d+(?:[.,]\d+)?)([a-z])=([+-]?\d+(?:[.,]\d+)?)$/i);
  if (!match) return null;
  const originalCoefficient = (match[1] === '-' ? -1 : 1) * Number(match[2].replace(',', '.'));
  const originalTotal = Number(match[4].replace(',', '.'));
  const decimalPlaces = Math.max(...[match[2], match[4]].map((value) => value.split(/[.,]/)[1]?.length || 0));
  const normalizationFactor = 10 ** decimalPlaces;
  const coefficient = Math.round(originalCoefficient * normalizationFactor);
  const variable = match[3];
  const total = Math.round(originalTotal * normalizationFactor);
  const groups = Math.abs(coefficient);
  if (!groups || !Number.isInteger(total / groups)) return null;
  const compressed = Math.abs(total) > 36;
  const rightItems = compressed
    ? Array.from({ length: groups }, (_, index) => ({ id: `r-${index}`, side: 'right', kind: 'unit', value: total / groups, label: localize(total / groups, lang), shape: 'compressed' }))
    : Array.from({ length: Math.abs(total) }, (_, index) => ({ id: `r-${index}`, side: 'right', kind: 'unit', value: Math.sign(total), label: localize(Math.sign(total), lang), shape: 'unit' }));
  const leftItems = Array.from({ length: groups }, (_, index) => ({ id: `l-${index}`, side: 'left', kind: 'variable', value: Math.sign(coefficient), label: coefficient < 0 ? `−${variable}` : variable, shape: 'variable' }));
  const eachRight = compressed ? 1 : Math.abs(total) / groups;
  return { coefficient, variable, total, originalCoefficient, originalTotal, normalizationFactor, groups, compressed, eachRight, items: { left: leftItems, right: rightItems } };
}

const initialProgress = () => ({ normalized: false, separators: { left: 0, right: 0 }, assignments: {}, links: [], selectedGroup: null, complete: false });

export default function Chapter2Partition({ config, questionId, lang = 'id', busy, onSolved, onUndo, onMistake }) {
  const data = useMemo(() => readEquation(config, lang), [config, lang]);
  const [progress, setProgress] = useState(initialProgress);
  const [history, setHistory] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [draggingItem, setDraggingItem] = useState('');
  const [message, setMessage] = useState('');
  if (!data) return null;

  const commit = (next) => {
    setHistory((items) => [...items, progress]);
    setProgress(next);
    setSelectedItem(null);
  };
  const groupCount = data.groups;
  const allMatched = progress.links.length === groupCount;
  const needsSignFlip = data.coefficient < 0;
  const needsNormalization = data.normalizationFactor > 1;
  const normalizationReady = !needsNormalization || progress.normalized;
  const requiredDividers = groupCount - 1;
  const partitionComplete = normalizationReady && ['left', 'right'].every((side) => progress.separators[side] === requiredDividers);
  const itemsIn = (side, groupIndex) => data.items[side].filter((item) => progress.assignments[item.id] === groupIndex);
  const expectedPerGroup = (side) => side === 'left' ? 1 : data.eachRight;
  const allSorted = partitionComplete && ['left', 'right'].every((side) => Array.from({ length: groupCount }, (_, index) => itemsIn(side, index).length === expectedPerGroup(side)).every(Boolean));
  const anyPlaced = Object.keys(progress.assignments).length > 0;
  const questionNumber = ((Number(questionId) - 1) % 10) + 1;
  const isEnglish = lang === 'en';
  const text = isEnglish ? {
    title: 'Make equal groups', left: 'LEFT SIDE', right: 'RIGHT SIDE', instruction: 'Drag a divider into each side. Make the same number of groups on both sides.',
    phaseDivide: 'Divide', phaseSort: 'Place tiles', phaseMatch: 'Pair groups', phaseSign: 'Flip signs',
    phaseNormalize: 'Clear decimals', normalize: `Multiply both sides by ${data.normalizationFactor}`,
    normalizeHelp: `First multiply both sides by ${data.normalizationFactor}: ${data.coefficient}${data.variable} = ${data.total}. Then make ${groupCount} equal groups on each side.`,
    signHelp: `Each pair shows −${data.variable} = ${localize(data.total / groupCount, lang)}. Multiply both sides by −1 to isolate ${data.variable}.`,
    flipSigns: 'Multiply both sides by −1',
    divider: 'Divider tool', dividerHelp: 'Drag the divider to a side, or select it and tap “Place divider”.',
    groups: 'Groups formed', place: 'Place divider', loose: 'Tiles to sort', drop: 'Drop tiles into groups', remove: 'Return tile',
    noGroup: 'Create the dividers on both sides before sorting tiles.', count: 'Group', each: 'tiles',
    fill: 'Every group must have the same contents as its matching group.', matching: 'Now match corresponding groups: select one left group, then its right partner.',
    matchHint: 'Select matching group numbers on both sides.', linked: 'Matched', undo: 'Undo', restart: 'Restart grouping',
    needMore: 'Make the same number of dividers on both sides.', wrongSide: 'A tile can only go into a group on its own side.', full: 'That group already has enough tiles.',
    matchWrong: 'Match groups with the same number.', finished: 'Equal groups matched!', final: 'Equation found',
    compressed: 'Large total shown as one compressed block per group.', reset: 'Reset',
  } : {
    title: 'Buat kelompok sama besar', left: 'RUAS KIRI', right: 'RUAS KANAN', instruction: 'Seret alat pembagi ke setiap ruas. Buat jumlah kelompok yang sama di kedua ruas.',
    phaseDivide: 'Bagi ruas', phaseSort: 'Susun ubin', phaseMatch: 'Cocokkan', phaseSign: 'Balik tanda',
    phaseNormalize: 'Ubah desimal', normalize: `Kalikan kedua ruas dengan ${data.normalizationFactor}`,
    normalizeHelp: `Kalikan kedua ruas dengan ${data.normalizationFactor} terlebih dahulu: ${data.coefficient}${data.variable} = ${data.total}. Lalu buat ${groupCount} kelompok sama besar pada setiap ruas.`,
    signHelp: `Setiap pasangan menunjukkan −${data.variable} = ${localize(data.total / groupCount, lang)}. Kalikan kedua ruas dengan −1 untuk memperoleh ${data.variable}.`,
    flipSigns: 'Kalikan kedua ruas dengan −1',
    divider: 'Alat pembagi', dividerHelp: 'Seret pembatas ke ruas, atau pilih alat ini lalu tekan “Pasang pembatas”.',
    groups: 'Kelompok terbentuk', place: 'Pasang pembatas', loose: 'Ubin yang belum dibagi', drop: 'Pindahkan ubin ke kelompok', remove: 'Kembalikan ubin',
    noGroup: 'Buat garis pembatas pada kedua ruas sebelum menyusun ubin.', count: 'Kelompok', each: 'ubin',
    fill: 'Isi setiap kelompok harus sama dengan kelompok pasangannya.', matching: 'Sekarang cocokkan kelompok: pilih kelompok di kiri, lalu pasangannya di kanan.',
    matchHint: 'Pilih nomor kelompok yang sama pada kedua ruas.', linked: 'Cocok', undo: 'Urungkan', restart: 'Ulangi pembagian',
    needMore: 'Buat jumlah pembatas yang sama di kedua ruas.', wrongSide: 'Ubin hanya bisa ditempatkan pada kelompok di ruas asalnya.', full: 'Kelompok ini sudah berisi cukup ubin.',
    matchWrong: 'Pasangkan kelompok dengan nomor yang sama.', finished: 'Semua kelompok sudah cocok!', final: 'Persamaan yang diperoleh',
    compressed: 'Bilangan besar diringkas menjadi satu balok total per kelompok.', reset: 'Ulangi',
  };
  const phases = [...(needsNormalization ? [[text.phaseNormalize, normalizationReady]] : []), [text.phaseDivide, partitionComplete], [text.phaseSort, allSorted], [text.phaseMatch, allMatched], ...(needsSignFlip ? [[text.phaseSign, progress.complete]] : [])];
  const activePhase = phases.findIndex(([, complete]) => !complete);
  const reject = (feedback) => { setMessage(feedback); onMistake?.(); };

  const placeDivider = (side) => {
    if (busy || progress.complete) return;
    if (!normalizationReady) { setMessage(text.normalizeHelp); return; }
    if (anyPlaced) {
      setMessage(isEnglish ? 'Return the tiles to the source area before changing the dividers.' : 'Kembalikan ubin ke area asal sebelum mengubah garis pembatas.');
      return;
    }
    if (progress.separators[side] >= requiredDividers) {
      setMessage(isEnglish ? 'There are already enough dividers on this side.' : 'Pembatas di ruas ini sudah cukup.');
      return;
    }
    commit({ ...progress, separators: { ...progress.separators, [side]: progress.separators[side] + 1 }, links: [], selectedGroup: null });
    setMessage('');
  };
  const onDividerDrop = (event, side) => {
    if (event.dataTransfer.getData('text/plain') !== 'divider') return;
    event.preventDefault();
    placeDivider(side);
  };
  const assignItem = (itemId, groupIndex) => {
    if (busy || progress.complete) return;
    const item = data.items.left.concat(data.items.right).find((entry) => entry.id === itemId);
    if (!item) return;
    if (!partitionComplete) { reject(text.noGroup); return; }
    if (item.side !== (groupIndex.side || item.side)) return;
    const side = item.side;
    const targetCount = expectedPerGroup(side);
    const groupItems = itemsIn(side, groupIndex.index);
    if (progress.assignments[itemId] === groupIndex.index) return;
    if (groupItems.length >= targetCount) { reject(text.full); return; }
    commit({ ...progress, assignments: { ...progress.assignments, [itemId]: groupIndex.index }, links: [], selectedGroup: null });
    setMessage('');
  };
  const handleGroupDrop = (event, side, groupIndex) => {
    const itemId = event.dataTransfer.getData('text/plain');
    if (!itemId) return;
    event.preventDefault();
    const item = data.items.left.concat(data.items.right).find((entry) => entry.id === itemId);
    if (item?.side !== side) { reject(text.wrongSide); return; }
    assignItem(itemId, { side, index: groupIndex });
  };
  const returnToPool = (event, side) => {
    if (busy || progress.complete) return;
    const itemId = event.dataTransfer.getData('text/plain');
    if (!itemId) return;
    event.preventDefault();
    const item = data.items.left.concat(data.items.right).find((entry) => entry.id === itemId);
    if (item?.side !== side) { reject(text.wrongSide); return; }
    const assignments = { ...progress.assignments };
    delete assignments[itemId];
    commit({ ...progress, assignments, links: [], selectedGroup: null });
    setMessage('');
  };
  const onTileClick = (item) => {
    if (busy || progress.complete || allSorted) return;
    setSelectedItem((current) => current === item.id ? null : item.id);
    setMessage(isEnglish ? 'Now tap a group on the same side.' : 'Sekarang ketuk kelompok pada ruas yang sama.');
  };
  const onGroupClick = (side, index) => {
    if (busy || progress.complete) return;
    if (!partitionComplete) { reject(text.noGroup); return; }
    if (!allSorted && selectedItem) {
      const selected = data.items.left.concat(data.items.right).find((item) => item.id === selectedItem);
      if (selected?.side !== side) { reject(text.wrongSide); return; }
      assignItem(selectedItem, { side, index });
      return;
    }
    if (!allSorted) { setMessage(text.fill); return; }
    if (side === 'left') {
      setProgress((current) => ({ ...current, selectedGroup: index }));
      setMessage(text.matchHint);
      return;
    }
    if (progress.selectedGroup === null) { setMessage(text.matching); return; }
    if (progress.selectedGroup !== index) { reject(text.matchWrong); return; }
    const links = [...new Set([...progress.links, index])];
    const complete = links.length === groupCount && !needsSignFlip;
    commit({ ...progress, links, selectedGroup: null, complete });
    setMessage(complete ? text.finished : '');
    if (complete) onSolved?.();
  };
  const flipSigns = () => {
    if (busy || progress.complete || !needsSignFlip || !allMatched) return;
    commit({ ...progress, complete: true });
    setMessage(text.finished);
    onSolved?.();
  };
  const normalize = () => {
    if (busy || progress.complete || normalizationReady) return;
    commit({ ...progress, normalized: true });
    setMessage('');
  };
  const undo = () => {
    if (busy || !history.length) return;
    const previous = history[history.length - 1];
    setProgress(previous);
    setHistory((items) => items.slice(0, -1));
    setSelectedItem(null);
    setMessage('');
    if (progress.complete || previous.links.length < groupCount) onUndo?.();
  };
  const reset = () => {
    setProgress(initialProgress());
    setHistory([]);
    setSelectedItem(null);
    setMessage('');
    onUndo?.();
  };

  const renderTile = (item) => {
    const label = normalizationReady ? item.label : item.kind === 'variable'
      ? `${localize(item.value / data.normalizationFactor, lang)}${data.variable}`
      : localize(item.value / data.normalizationFactor, lang);
    return <button type="button" key={item.id}
    className={`c2p-tile ${item.shape === 'variable' ? 'is-variable' : 'is-unit'} ${item.value < 0 ? 'is-negative' : ''} ${item.shape === 'compressed' ? 'is-compressed' : ''} ${selectedItem === item.id ? 'is-selected' : ''} ${draggingItem === item.id ? 'is-dragging' : ''}`}
    draggable={!busy && !progress.complete && normalizationReady}
    disabled={busy || !normalizationReady}
    onDragStart={(event) => { event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move'; setDraggingItem(item.id); }}
    onDragEnd={() => setDraggingItem('')}
    onClick={(event) => { event.stopPropagation(); onTileClick(item); }}
    aria-label={`${isEnglish ? 'Tile' : 'Ubin'} ${label}`}
  ><span>{label}</span></button>;
  };

  const renderSide = (side) => {
    const isLeft = side === 'left';
    const tiles = data.items[side];
    const placed = tiles.filter((item) => progress.assignments[item.id] !== undefined);
    const loose = tiles.filter((item) => progress.assignments[item.id] === undefined);
    const lineCount = progress.separators[side];
    const slots = lineCount || normalizationReady && groupCount === 1 ? Array.from({ length: lineCount + 1 }, (_, index) => index) : [];
    return <section className={`c2p-side ${isLeft ? 'is-left' : 'is-right'}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onDividerDrop(event, side)}>
      <header><b>{text[side]}</b><strong>{isLeft ? `${localize(normalizationReady ? data.coefficient : data.originalCoefficient, lang)}${data.variable}` : localize(normalizationReady ? data.total : data.originalTotal, lang)}</strong></header>
      {slots.length > 0 && <div className="c2p-groups" style={{ '--c2p-group-columns': Math.min(slots.length, 4) }}>
        {slots.map((index) => {
          const groupItems = itemsIn(side, index);
          const full = groupItems.length === expectedPerGroup(side);
          const linked = progress.links.includes(index);
          return <div key={index} role="group" tabIndex={0} aria-label={`${text.count} ${index + 1}`}
            className={`c2p-group ${full ? 'is-full' : ''} ${linked ? 'is-linked' : ''} ${progress.selectedGroup === index ? 'is-selected' : ''}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => handleGroupDrop(event, side, index)}
            onClick={() => onGroupClick(side, index)}
            onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onGroupClick(side, index); } }}
          >
            <i>{text.count} {index + 1}{linked ? ` · ${text.linked}` : ''}</i>
            <span>{groupItems.length ? groupItems.map(renderTile) : <em>{text.drop}</em>}</span>
            {full && <small>{groupItems.length} {text.each}</small>}
          </div>;
        })}
      </div>}
      {lineCount > 0 && <div className="c2p-divider-count">{text.groups}: {lineCount + 1}</div>}
      <div className={`c2p-pool ${placed.length ? 'has-placed' : ''}`} onDragOver={(event) => event.preventDefault()} onDrop={(event) => returnToPool(event, side)}>
        <small>{text.loose} · {loose.length}/{tiles.length} · {text.remove}</small>
        <div>{loose.length ? loose.map(renderTile) : <em>{isEnglish ? 'All tiles placed' : 'Semua ubin sudah ditempatkan'}</em>}</div>
        {data.compressed && isLeft === false && <small className="c2p-compressed-note">{text.compressed}</small>}
      </div>
    </section>;
  };

  return <section className="c2p-simulation" aria-label={text.title}>
    <header className="c2p-header"><div><small>CHAPTER 2 · {isEnglish ? `QUESTION ${questionNumber}/10` : `SOAL ${questionNumber}/10`}</small><h2>{text.title}</h2></div><button type="button" onClick={undo} disabled={busy || !history.length}>{text.undo}</button></header>
    {progress.complete ? <div className="c2p-solved"><span>✓</span><strong>{text.finished}</strong><small>{text.final}: {localize(config.steps[0]?.after || config.equation, lang)}</small></div> : <>
      <p className="c2p-instruction">{!normalizationReady ? text.normalizeHelp : allMatched && needsSignFlip ? text.signHelp : partitionComplete ? allSorted ? text.matching : text.fill : text.instruction}</p>
      <ol className="c2p-phase-track" style={{ gridTemplateColumns: `repeat(${phases.length}, minmax(0, 1fr))` }} aria-label={isEnglish ? 'Grouping steps' : 'Tahap membuat kelompok'}>
        {phases.map(([label, complete], index) => <li key={label} className={`${complete ? 'is-complete' : ''} ${index === activePhase ? 'is-active' : ''}`}><b>{complete ? '✓' : index + 1}</b><span>{label}</span></li>)}
      </ol>
      <div className="c2p-scale">
        {renderSide('left')}
        <div className="c2p-scale-center" aria-hidden="true">⚖</div>
        {renderSide('right')}
      </div>
      <div className="c2p-toolbar">
        {!normalizationReady ? <button type="button" className="c2p-normalize" onClick={normalize} disabled={busy}>{text.normalize}</button> : allMatched && needsSignFlip ? <button type="button" className="c2p-flip-signs" onClick={flipSigns} disabled={busy}>{text.flipSigns}</button> : <>
        <button type="button" className="c2p-divider-tool" draggable={!busy} disabled={busy || progress.complete || progress.separators.left >= requiredDividers && progress.separators.right >= requiredDividers}
          onDragStart={(event) => { event.dataTransfer.setData('text/plain', 'divider'); event.dataTransfer.effectAllowed = 'copy'; }}
          onClick={() => setMessage(text.dividerHelp)}
        ><span aria-hidden="true">│</span><b>{text.divider}</b></button>
        <p>{text.dividerHelp}</p>
        {(['left', 'right']).map((side) => <button type="button" key={side} className="c2p-place-divider" onClick={() => placeDivider(side)} disabled={busy || progress.separators[side] >= requiredDividers}>
          {text.place} · {text[side]}
        </button>)}
        <div className="c2p-group-counter"><small>{text.groups}</small><b>{progress.separators.left ? progress.separators.left + 1 : 0} / {progress.separators.right ? progress.separators.right + 1 : 0}</b></div>
        </>}
        <button type="button" className="c2p-reset" onClick={reset} disabled={busy}>{text.reset}</button>
      </div>
      <p className="c2p-status" role="status" aria-live="polite">{!normalizationReady ? text.normalizeHelp : allMatched && needsSignFlip ? text.signHelp : message || (partitionComplete ? allSorted ? text.matchHint : text.drop : text.noGroup)}</p>
    </>}
    {progress.complete && <button type="button" className="c2p-reset" onClick={reset} disabled={busy}>{text.restart}</button>}
  </section>;
}
