import React from 'react';

export default function MobileLandscapeTip({ lang = 'id' }) {
  const isEnglish = lang === 'en';

  return (
    <aside className="mobile-landscape-tip" aria-label={isEnglish ? 'Mobile display tip' : 'Saran tampilan mobile'}>
      <span className="mobile-landscape-tip-icon" aria-hidden="true">↻</span>
      <span>{isEnglish
        ? 'Need more room? Turn your phone sideways for a wider arena and question.'
        : 'Layar terasa sempit? Putar HP ke landscape agar arena dan soal lebih lega.'}</span>
    </aside>
  );
}
