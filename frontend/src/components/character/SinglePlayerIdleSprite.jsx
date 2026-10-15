import React, { useEffect, useRef } from 'react';

// Selection-only renderer: keep combat timing, effects and asset loading untouched.
// Align the supplied frames by their feet; transparent padding differs per pose.
function measureFrame(image) {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let bottom = 0;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (data[(y * canvas.width + x) * 4 + 3] > 32) bottom = y + 1;
    }
  }
  let left = canvas.width;
  let right = 0;
  for (let y = Math.max(0, bottom - Math.ceil(canvas.height * 0.07)); y < bottom; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      if (data[(y * canvas.width + x) * 4 + 3] > 32) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }
    }
  }
  return { image, footX: left <= right ? (left + right) / 2 : canvas.width / 2, bottom: bottom || canvas.height };
}

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
    const images = sequence.frames.map((name) => {
      const image = new Image();
      image.decoding = 'async';
      return { image, src: `${asset.base}/${asset.selectionIdle?.folder || asset.sequenceFolders?.idle || 'idle'}/${name}` };
    });
    images.forEach(({ image, src }, index) => {
      image.onload = () => {
        if (alive) {
          // Show available poses immediately, without waiting for the full loop.
          framesRef.current[index] = measureFrame(image);
          redrawRef.current();
        }
      };
      image.onerror = () => {
        failed += 1;
        if (alive && failed === images.length) errorCallbackRef.current?.();
      };
      image.src = src;
    });
    return () => {
      alive = false;
      images.forEach(({ image }) => { image.onload = null; image.onerror = null; });
    };
  }, [asset, sequence]);

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
      const context = canvas.getContext('2d');
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
      if (!document.hidden) draw(now);
      raf = requestAnimationFrame(tick);
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
