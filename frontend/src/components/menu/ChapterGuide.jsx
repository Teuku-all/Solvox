import React from 'react';
import { getChapterGuide } from '../../data/chapterGuide';

export default function ChapterGuide({ levelId, lang = 'id' }) {
  const guide = getChapterGuide(levelId, lang);
  const en = lang === 'en';

  return <div className="tutorial-chapter-detail" id={`guide-chapter-${levelId}`}>
    <section className="tutorial-chapter-goal" aria-labelledby={`guide-goal-${levelId}`}>
      <h4 id={`guide-goal-${levelId}`}>{en ? 'What you will learn' : 'Yang akan kamu pelajari'}</h4>
      <p>{guide.goal}</p>
    </section>
    <section aria-labelledby={`guide-steps-${levelId}`}>
      <h4 id={`guide-steps-${levelId}`}>{en ? 'How to play, step by step' : 'Langkah bermain, dari awal sampai selesai'}</h4>
      <ol className="tutorial-chapter-steps">
        {guide.steps.map(({ title, body }) => <li key={title}><h5>{title}</h5><p>{body}</p></li>)}
      </ol>
    </section>
    <section className="tutorial-chapter-example" aria-labelledby={`guide-example-${levelId}`}>
      <h4 id={`guide-example-${levelId}`}>{en ? 'Worked example' : 'Contoh penyelesaian'}</h4>
      {guide.example.context && <p>{guide.example.context}</p>}
      <p className="tutorial-chapter-equation">{guide.example.equation}</p>
      <ol>{guide.example.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <p className="tutorial-chapter-result"><strong>{en ? 'Result: ' : 'Hasil: '}{guide.example.result}</strong></p>
    </section>
    <section className="tutorial-chapter-tips" aria-labelledby={`guide-tips-${levelId}`}>
      <h4 id={`guide-tips-${levelId}`}>{en ? 'Keep in mind' : 'Ingat saat bermain'}</h4>
      <ul>{guide.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
    </section>
  </div>;
}
