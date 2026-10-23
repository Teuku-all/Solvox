import React, { useLayoutEffect, useRef, useState } from 'react';

export function formatBalanceSide(items, lang = 'id') {
  const formatNumber = (value) => Number(value.toFixed(3)).toLocaleString(lang === 'en' ? 'en-US' : 'id-ID', { maximumFractionDigits: 3, useGrouping: true });
  const expressionItem = items.find((item) => item.expression);
  const regularItems = items.filter((item) => !item.expression);
  if (expressionItem && !regularItems.length) return expressionItem.label;
  if (expressionItem && regularItems.length) {
    const addition = formatBalanceSide(regularItems, lang);
    const delta = regularItems.reduce((sum, item) => sum + item.value, 0);
    return `${expressionItem.label} ${delta < 0 ? '−' : '+'} ${addition}`;
  }
  const coefficients = new Map();
  items.filter((item) => item.type === 'variable').forEach((item) => {
    const symbol = item.variable || item.label.match(/[a-z]/i)?.[0] || 'x';
    coefficients.set(symbol, (coefficients.get(symbol) || 0) + item.value);
  });
  const terms = [...coefficients].filter(([, value]) => Math.abs(value) > 0.001).map(([symbol, value]) => {
    const magnitude = Math.abs(value);
    const fraction = items.find((item) => item.variable === symbol && item.fractionNumerator && item.fractionDenominator && Math.abs(magnitude - item.fractionNumerator / item.fractionDenominator) < 0.001);
    const label = fraction ? fraction.fractionNumerator + '/' + fraction.fractionDenominator + symbol : (Math.abs(magnitude - 1) < 0.001 ? '' : formatNumber(magnitude)) + symbol;
    return { value, label };
  });
  const unitItems = items.filter((item) => item.type === 'unit');
  const constant = unitItems.reduce((sum, item) => sum + item.value, 0);
  if (Math.abs(constant) > 0.001) {
    const hasHalf = unitItems.some((item) => item.parts === 2);
    const label = hasHalf && Math.abs(constant - Math.round(constant)) > 0.001
      ? `${Math.round(Math.abs(constant) * 2)}/2`
      : formatNumber(Math.abs(constant));
    terms.push({ value: constant, label });
  }
  return terms.reduce((text, term) => text ? `${text} ${term.value < 0 ? '−' : '+'} ${term.label}` : `${term.value < 0 ? '−' : ''}${term.label}`, '') || '0';
}

function BalanceTile({ item, side, onMoveTile, onSelectMoveTile, selectedForMove = false, draggingSource, interactive = true }) {
  const label = item.label || (item.value < 0 ? '−1' : '+1');
  const tileClass = `math-sim-balance-item ${item.expression ? 'is-expression' : ''} ${item.type === 'variable' ? 'is-variable' : item.value < 0 ? 'is-negative' : 'is-positive'} shape-${item.shape || 'square'} ${item.parts ? 'is-divided' : ''} ${item.id.startsWith('added-') ? 'is-new' : ''} ${selectedForMove ? 'is-selected-for-move' : ''} ${draggingSource === `pan-${side}-${item.id}` ? 'is-lifting' : ''}`;
  if (!interactive) return <span className={tileClass}><span>{label}</span></span>;
  return <button type="button" draggable="false" className={tileClass} aria-pressed={selectedForMove} aria-label={`${label}, ${side === 'left' ? 'ruas kiri' : 'ruas kanan'}; seret ke ruas lain atau pilih lalu ketuk ruas tujuan`} onPointerDown={(event) => onMoveTile(event, side, item)} onClick={(event) => { if (event.detail === 0) onSelectMoveTile(side, item); }}><span>{label}</span></button>;
}

function BalanceOperationVisual({ items, operation, value, result, lang }) {
  if (operation === 'expand' || operation === 'simplify') {
    const action = operation === 'expand'
      ? (lang === 'en' ? 'Expand brackets' : 'Buka kurung')
      : (lang === 'en' ? 'Combine like terms' : 'Gabungkan suku');
    return <div className="math-sim-operation-visual" aria-live="polite"><small>{operation === 'expand' ? '↗' : '≋'}</small><div className="math-sim-operation-groups"><div className="math-sim-operation-group"><i>{action}</i><span>{items.length ? items.map((item, index) => <b key={`${item.id}-${index}`} className={item.type === 'variable' ? 'is-variable' : item.value < 0 ? 'is-negative' : ''}>{item.label || (item.value < 0 ? '−1' : '1')}</b>) : <b>0</b>}</span></div></div>{result && <strong className="math-sim-operation-result">→ {result}</strong>}</div>;
  }
  const divide = operation.startsWith('/');
  const arithmetic = operation.startsWith('+') || operation.startsWith('-');
  if (arithmetic) {
    const symbol = operation.startsWith('+') ? '+' : '−';
    return <div className="math-sim-operation-visual" aria-live="polite">
      <small>{symbol} {value}</small>
      <div className="math-sim-operation-groups is-compact"><div className="math-sim-operation-group">
        <i>{lang === 'en' ? 'Both sides' : 'Kedua ruas'}</i>
        <span>{items.length ? items.map((item, index) => <b key={`${item.id}-${index}`} className={item.type === 'variable' ? 'is-variable' : item.value < 0 ? 'is-negative' : ''}>{item.label || (item.value < 0 ? '−1' : '1')}</b>) : <b>0</b>}</span>
      </div></div>
      {result && <strong className="math-sim-operation-result">→ {result}</strong>}
    </div>;
  }
  const rawAmount = String(value || '2');
  const fractionAmount = rawAmount.match(/^([+-]?\d+)\/(\d+)$/);
  const numericAmount = fractionAmount ? Number(fractionAmount[1]) / Number(fractionAmount[2]) : Number(rawAmount.replace(',', '.'));
  const groupCount = fractionAmount ? Math.abs(Number(fractionAmount[1])) : Math.round(Math.abs(numericAmount));
  const amount = Math.max(2, groupCount || 2);
  if (amount > 8) {
    const perGroup = formatBalanceSide(items.map((item) => ({ ...item, value: item.value / amount })), lang);
    return <div className="math-sim-operation-visual" aria-live="polite">
      <small>{divide ? `÷ ${rawAmount}` : `× ${rawAmount}`}</small>
      <div className="math-sim-operation-groups is-compact"><div className="math-sim-operation-group">
        <i>{lang === 'en' ? `${amount} equal groups` : `${amount} kelompok sama`}</i>
        <span><b>{formatBalanceSide(items, lang)}</b><b>{lang === 'en' ? `Each group: ${perGroup}` : `Tiap kelompok: ${perGroup}`}</b></span>
      </div></div>
      {result && <strong className="math-sim-operation-result">→ {result}</strong>}
    </div>;
  }
  const expandedItems = items.flatMap((item) => item.type === 'unit' && Number.isInteger(Math.abs(item.value)) && Math.abs(item.value) > 1 && Math.abs(item.value) <= 120
    ? Array.from({ length: Math.abs(item.value) }, (_, index) => ({ ...item, id: `${item.id}-unit-${index}`, value: Math.sign(item.value), label: item.value < 0 ? '−1' : '1' }))
    : [item]);
  const groups = divide
    ? Array.from({ length: amount }, (_, index) => expandedItems.flatMap((item, itemIndex) => {
      if (item.type === 'unit' && Math.abs(item.value) > 120) {
        const eachGroup = item.value / amount;
        return [{ ...item, id: `${item.id}-group-${index}`, value: eachGroup, label: `${eachGroup} × 1` }];
      }
      return itemIndex % amount === index ? [item] : [];
    }))
    : Array.from({ length: amount }, () => items);
  return <div className="math-sim-operation-visual" aria-live="polite">
    <small>{divide ? `÷ ${rawAmount}` : `× ${rawAmount}`}</small>
    <div className="math-sim-operation-groups">{groups.map((group, index) => <div className="math-sim-operation-group" key={index}>
      <i>{divide ? `G${index + 1}` : `×${index + 1}`}</i>
      <span>{group.length ? group.map((item, itemIndex) => <b key={`${item.id}-${itemIndex}`} className={item.type === 'variable' ? 'is-variable' : item.value < 0 ? 'is-negative' : ''}>{item.label || (item.value < 0 ? '−1' : '1')}</b>) : <b>0</b>}</span>
    </div>)}</div>
    {result && <strong className="math-sim-operation-result">→ {result}</strong>}
  </div>;
}

export function BalanceScale({ left, right, equation, sides, selectedTile, overPans, tilt, indicator, statusText, balanceDelta, operationAnimation, onMoveTile, onSelectMoveTile, selectedMove, onMoveSelectedTile, draggingSource, interactiveTiles = true, chapter2DropTargets = false, chapter2HoverSide = '', chapter2OperationSides = [], chapter2OperationText = '', lang, className = '' }) {
  const beamRef = useRef(null);
  const pansRef = useRef(null);
  const [attachment, setAttachment] = useState({ run: 0, ropeTop: -27 });
  useLayoutEffect(() => {
    const beam = beamRef.current;
    const pans = pansRef.current;
    if (!beam || !pans) return undefined;
    const measure = () => {
      const run = beam.offsetWidth * 0.3;
      const ropeTop = beam.offsetTop + beam.offsetHeight / 2 - pans.offsetTop;
      setAttachment((current) => current.run === run && current.ropeTop === ropeTop ? current : { run, ropeTop });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(beam);
    observer.observe(pans);
    observer.observe(beam.parentElement);
    return () => observer.disconnect();
  }, []);
  const swing = balanceDelta ? Math.min(8, 4.5 + Math.abs(balanceDelta) * 1.1) : 0;
  const drop = attachment.run * Math.sin(swing * Math.PI / 180);
  const direction = Math.sign(balanceDelta);
  return <div
    className={`math-sim-balance-scale ${className} ${selectedTile ? 'has-pending-tile' : ''} ${tilt} ${operationAnimation ? 'is-operation-active' : ''}`}
    aria-label={equation}
    style={{
      '--scale-angle': `${-direction * swing}deg`,
      '--left-drop': `${direction * drop}px`,
      '--right-drop': `${-direction * drop}px`,
      '--rope-top': `${attachment.ropeTop}px`,
    }}
  >
    <svg className="math-sim-scale-frame-art" viewBox="0 0 1000 310" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="balance-brass" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#4d3825" /><stop offset=".18" stopColor="#b18a50" /><stop offset=".38" stopColor="#f7e3a4" /><stop offset=".54" stopColor="#bd985d" /><stop offset=".76" stopColor="#74502e" /><stop offset="1" stopColor="#33281f" /></linearGradient>
        <linearGradient id="balance-brass-edge" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fff0bc" /><stop offset=".24" stopColor="#d5b46d" /><stop offset="1" stopColor="#5b4128" /></linearGradient>
        <linearGradient id="balance-brass-foot" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f3dfa0" /><stop offset=".24" stopColor="#b38b4e" /><stop offset=".7" stopColor="#76532f" /><stop offset="1" stopColor="#392a20" /></linearGradient>
        <filter id="balance-hardware-shadow" x="-.3" y="-.3" width="1.6" height="1.8"><feGaussianBlur in="SourceAlpha" stdDeviation="5" /><feOffset dy="5" /><feComponentTransfer><feFuncA type="linear" slope=".48" /></feComponentTransfer><feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <ellipse cx="500" cy="290" rx="211" ry="12" fill="#020c12" opacity=".5" />
      <g filter="url(#balance-hardware-shadow)">
        <path d="M480 79h40l16 143 111 35v12H353v-12l111-35z" fill="url(#balance-brass)" stroke="#f0d99a" strokeOpacity=".74" strokeWidth="2" />
        <path d="M493 91h14l12 133-19 21-19-21z" fill="url(#balance-brass-edge)" opacity=".83" />
        <path d="M369 258h262l-23 13H392z" fill="#493522" stroke="#f5dda0" strokeOpacity=".7" strokeWidth="2" />
        <ellipse cx="500" cy="270" rx="151" ry="13" fill="url(#balance-brass-foot)" stroke="#f3dfa0" strokeWidth="2" />
        <ellipse cx="500" cy="267" rx="137" ry="7" fill="none" stroke="#fff0bc" strokeOpacity=".62" strokeWidth="2" />
        <path d="M386 264h228" stroke="#3f2e20" strokeOpacity=".65" strokeWidth="2" />
      </g>
    </svg>
    <div className={`math-sim-balance-readout is-${indicator}`} role="status" aria-live="polite"><span aria-hidden="true" />{statusText}</div>
    <div ref={beamRef} className="math-sim-scale-beam" aria-hidden="true"><span /></div>
    <div className="math-sim-scale-crystal" aria-hidden="true">◆</div>
    <div className="math-sim-scale-post" aria-hidden="true" />
    <div ref={pansRef} className={`math-sim-scale-pans ${overPans ? 'is-drop-target' : ''}`}>
      <div className={`math-sim-scale-pan is-left ${overPans === 'left' ? 'is-drop-target' : ''} ${selectedMove && selectedMove.side !== 'left' ? 'is-move-target' : ''} ${chapter2HoverSide === 'left' ? 'is-ch2-hovered' : ''}`} data-balance-side="left" data-ch2-side={chapter2DropTargets ? 'left' : undefined} role={selectedMove && selectedMove.side !== 'left' ? 'group' : undefined} aria-label={selectedMove && selectedMove.side !== 'left' ? (lang === 'en' ? 'Move selected tile to the left side' : 'Pindahkan ubin terpilih ke ruas kiri') : undefined} onClick={() => onMoveSelectedTile?.('left')} onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && selectedMove && selectedMove.side !== 'left') { event.preventDefault(); onMoveSelectedTile?.('left'); } }} tabIndex={selectedMove && selectedMove.side !== 'left' ? 0 : undefined}>
        <small>{sides[0]}</small>
        {chapter2OperationSides.includes(0) && <b className="math-sim-ch2-pan-operation">{chapter2OperationText}</b>}
        <div className="math-sim-balance-pan-content"><div className="math-sim-balance-tiles">{left.map((item) => <BalanceTile key={item.id} item={item} side="left" onMoveTile={onMoveTile} onSelectMoveTile={onSelectMoveTile} selectedForMove={selectedMove?.side === 'left' && selectedMove.item.id === item.id} draggingSource={draggingSource} interactive={interactiveTiles} />)}</div><strong className="math-sim-balance-expression">{formatBalanceSide(left, lang)}</strong>{operationAnimation && <BalanceOperationVisual items={left} {...operationAnimation} result={operationAnimation.results?.[0]} lang={lang} />}</div>
      </div>
      <span className="math-sim-scale-equals" aria-hidden="true">=</span>
      <div className={`math-sim-scale-pan is-right ${overPans === 'right' ? 'is-drop-target' : ''} ${selectedMove && selectedMove.side !== 'right' ? 'is-move-target' : ''} ${chapter2HoverSide === 'right' ? 'is-ch2-hovered' : ''}`} data-balance-side="right" data-ch2-side={chapter2DropTargets ? 'right' : undefined} role={selectedMove && selectedMove.side !== 'right' ? 'group' : undefined} aria-label={selectedMove && selectedMove.side !== 'right' ? (lang === 'en' ? 'Move selected tile to the right side' : 'Pindahkan ubin terpilih ke ruas kanan') : undefined} onClick={() => onMoveSelectedTile?.('right')} onKeyDown={(event) => { if ((event.key === 'Enter' || event.key === ' ') && selectedMove && selectedMove.side !== 'right') { event.preventDefault(); onMoveSelectedTile?.('right'); } }} tabIndex={selectedMove && selectedMove.side !== 'right' ? 0 : undefined}>
        <small>{sides[1]}</small>
        {chapter2OperationSides.includes(1) && <b className="math-sim-ch2-pan-operation">{chapter2OperationText}</b>}
        <div className="math-sim-balance-pan-content"><div className="math-sim-balance-tiles">{right.map((item) => <BalanceTile key={item.id} item={item} side="right" onMoveTile={onMoveTile} onSelectMoveTile={onSelectMoveTile} selectedForMove={selectedMove?.side === 'right' && selectedMove.item.id === item.id} draggingSource={draggingSource} interactive={interactiveTiles} />)}</div><strong className="math-sim-balance-expression">{formatBalanceSide(right, lang)}</strong>{operationAnimation && <BalanceOperationVisual items={right} {...operationAnimation} result={operationAnimation.results?.[1]} lang={lang} />}</div>
      </div>
    </div>
    <div className="math-sim-scale-base" aria-hidden="true" />
    <div className="math-sim-balance-indicator" aria-label={statusText}><span className={`is-${indicator}`} /></div>
  </div>;
}

export default BalanceScale;
