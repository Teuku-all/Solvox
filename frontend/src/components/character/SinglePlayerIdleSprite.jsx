import React, { useEffect, useRef } from 'react';

import { loadAssetImage } from '../../services/assetImageCache';
import { selectionFrameAnchor } from '../../services/optimizedAssets';
import { selectionFrameSources } from '../../services/selectionAssets';

export default function SinglePlayerIdleSprite({ asset, reducedMotion, onReady, onLoadError }) {
  const readyReportedRef = useRef(false);
  const readyCallbackRef = useRef(onReady);
  readyCallbackRef.current = onReady;
  const errorCallbackRef = useRef(onLoadError);
  errorCallbackRef.current = onLoadError;
  const sequence = asset.selectionIdle?.sequence || asset.sequences.idle;
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const redrawRef = useRef(() => {});

  useEffect(() => {
    let alive = true;
    framesRef.current = [];
    readyReportedRef.current = false;
    let failed = 0;
    const sources = selectionFrameSources(asset);
    const loadFrame = async (src, index) => {
      try {
        const image = await loadAssetImage(src, { fetchPriority: index === 0 ? 'high' : 'low' });
        if (!alive) return false;
        const anchor = selectionFrameAnchor(src) || { footX: image.naturalWidth / 2, bottom: image.naturalHeight };
        framesRef.current[index] = { image, ...anchor };
        redrawRef.current();
        return true;
      } catch {
        failed += 1;
        if (alive && failed === sources.length) errorCallbackRef.current?.();
        return false;
      }
    };
    // Let the first pose paint before downloading the rest of the animation.
    (async () => {
      const firstLoaded = await loadFrame(sources[0], 0);
      if (!alive) return;
      if (!reducedMotion) sources.slice(1).forEach((src, index) => loadFrame(src, index + 1));
      else if (!firstLoaded) {
        for (let index = 1; index < sources.length && alive; index++) {
          if (await loadFrame(sources[index], index)) break;
        }
      }
    })();
    return () => { alive = false; };
  }, [asset, sequence, reducedMotion]);

  useEffect(() => {
    let raf = 0;
    let previousFrame = -1;
    let previousImage = null;
    const start = performance.now();
    const draw = (now = performance.now()) => {
      const index = reducedMotion ? 0 : Math.floor((now - start) / sequence.step) % sequence.frames.length;
      const frame = framesRef.current[index] || framesRef.current.find(Boolean);
      if (!frame || (index === previousFrame && frame.image === previousImage)) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      const height = (asset.selectionIdle?.referenceSize || asset.referenceSize).height;
      // Extra transparent space accommodates cape / idle effects without clipping.
      const width = Math.ceil(height * 1.6);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.clearRect(0, 0, width, height);
      context.drawImage(frame.image, width / 2 - frame.footX, height - frame.bottom);
      if (!readyReportedRef.current) {
        readyReportedRef.current = true;
        readyCallbackRef.current?.();
      }
      previousFrame = index;
      previousImage = frame.image;
    };
    redrawRef.current = draw;
    const tick = (now) => {
      if (!canvasRef.current) return;
      if (!document.hidden) draw(now);
      if (canvasRef.current) raf = requestAnimationFrame(tick);
    };
    draw();
    if (!reducedMotion) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      redrawRef.current = () => {};
    };
  }, [asset, sequence, reducedMotion]);

  return <canvas className="sp-cinema-sprite" ref={canvasRef} aria-hidden="true" />;
}
