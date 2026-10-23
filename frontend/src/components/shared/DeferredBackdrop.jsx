import React, { useEffect, useState } from 'react';
import { responsiveAsset } from '../../services/optimizedAssets';

// Paint a small still first; decoration must not compete with navigation artwork.
export default function DeferredBackdrop({ src, poster, className = '' }) {
  const [posterReady, setPosterReady] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  useEffect(() => {
    const connection = navigator.connection;
    if (!posterReady || connection?.saveData || /(^|-)2g|3g/.test(connection?.effectiveType || '') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || localStorage.getItem('solvox.reducedMotion') === '1') return;
    const timer = setTimeout(() => setPlayVideo(true), 1800);
    return () => clearTimeout(timer);
  }, [posterReady]);

  const style = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
  return <>
    <img {...responsiveAsset(poster, '100vw')} className={className} style={style} alt="" fetchPriority="high"
      onLoad={() => setPosterReady(true)} onError={() => setPosterReady(true)} />
    {playVideo && <video className={className} style={{ ...style, opacity: videoReady ? 1 : 0 }} autoPlay loop muted playsInline preload="none"
      onLoadedData={() => setVideoReady(true)} onError={() => setVideoReady(false)}>
      <source src={src} type="video/mp4" />
    </video>}
  </>;
}
