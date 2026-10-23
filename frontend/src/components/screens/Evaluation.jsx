import React, { useEffect, useMemo, useState } from 'react';
import { classifyMastery, summarizePerformance } from '../../services/evaluation';
import { evaluateSolvoxChapter } from '../../services/solvoxEvaluation';
import { SIMULATIONS, operationLabel } from '../../data/algebraSimulation';
import PixelIcon from '../shared/PixelIcon';
import SolvoxBackButton from '../shared/SolvoxBackButton';
import {apiJson} from '../../services/api';
import useDialogKeyboard from '../shared/useDialogKeyboard';
import useAnimatedDismiss from '../shared/useAnimatedDismiss';

const ERROR_LABELS = {
  'one-side-only-operation': ['operasi hanya pada satu ruas', 'operation applied to one side only'],
  'sign-changed-without-operation': ['mengubah tanda tanpa operasi', 'changed a sign without an operation'],
  'unbalanced-tile-operation': ['operasi ubin tidak menjaga keseimbangan', 'tile operation did not preserve balance'],
  'incorrect-tile-transfer': ['pemindahan ubin menghasilkan persamaan yang keliru', 'tile transfer produced an incorrect equation'],
  'wrong-operation-on-both-sides': ['memilih operasi yang keliru pada kedua ruas', 'selected the wrong operation on both sides'],
  'different-operation-on-each-side': ['menggunakan operasi berbeda pada tiap ruas', 'used different operations on each side'],
  'parentheses-or-like-term-error': ['kesalahan pada tanda kurung atau suku sejenis', 'parentheses or like-term error'],
  'fraction-or-grouping-error': ['kesalahan pada pecahan atau pengelompokan', 'fraction or grouping error'],
  'chapter2-grouping-error': ['kesalahan membagi ubin ke kelompok yang sama besar', 'tile grouping error'],
  'chapter2-wrong-side': ['ubin ditempatkan pada ruas yang keliru', 'tile placed on the wrong side'],
  'chapter2-group-capacity': ['jumlah ubin dalam kelompok tidak sesuai', 'group has an incorrect number of tiles'],
  'chapter2-group-match-error': ['kelompok dengan nomor berbeda dipasangkan', 'groups with different numbers were matched'],
  'chapter2-fraction-cut': ['alat pemotong belum diterapkan pada batang yang tepat', 'cutter was not applied to the correct bar'],
  'chapter2-fraction-target': ['kepingan pecahan ditempatkan pada target yang keliru', 'fraction piece was placed on the wrong target'],
  'chapter2-fraction-capacity': ['jumlah kepingan pada bagian pecahan tidak sesuai', 'fraction part has an incorrect number of pieces'],
  'chapter2-fraction-sign': ['aturan perubahan tanda belum diterapkan dengan benar', 'sign change was not applied correctly'],
};

function buildErrorSummary(summary, t, automaticChapter, lang) {
  const findings = [];
  if (automaticChapter) {
    if ([1, 2, 3].includes(Number(summary.chapterId)) && summary.simulationErrorHistory?.length) {
      const byQuestion = new Map();
      summary.simulationErrorHistory.forEach((error) => {
        const qid = Number(error.questionId) || 0;
        const item = byQuestion.get(qid) || { count: 0, steps: new Set(), kinds: new Map() };
        item.count += 1;
        item.steps.add(Number(error.step) || 1);
        item.kinds.set(error.kind, (item.kinds.get(error.kind) || 0) + 1);
        byQuestion.set(qid, item);
      });
      [...byQuestion.entries()].sort(([a], [b]) => a - b).forEach(([qid, item]) => {
        const common = [...item.kinds.entries()].sort((a, b) => b[1] - a[1])[0];
        const label = ERROR_LABELS[common?.[0]]?.[lang === 'en' ? 1 : 0] || (lang === 'en' ? 'equation-step correction' : 'koreksi langkah persamaan');
        findings.push(lang === 'en'
          ? `Question ${qid}: ${item.count} correction(s), at step(s) ${[...item.steps].join(', ')}; most often ${label} (${common?.[1] || 0}x).`
          : `Soal ${qid}: ${item.count} koreksi pada langkah ${[...item.steps].join(', ')}; paling sering ${label} (${common?.[1] || 0}×).`);
      });
    }
    if (summary.simulationStepErrors > 0 && !findings.length) findings.push(lang === 'en' ? `${summary.simulationStepErrors} equation step correction(s) were needed.` : `Ada ${summary.simulationStepErrors} koreksi langkah persamaan.`);
    if (summary.simulationModelErrors > 0) findings.push(lang === 'en' ? `${summary.simulationModelErrors} story model correction(s) were needed.` : `Ada ${summary.simulationModelErrors} koreksi model soal cerita.`);
    if (summary.unansweredQuestions > 0) findings.push(lang === 'en' ? `${summary.unansweredQuestions} question(s) were left unanswered.` : `Ada ${summary.unansweredQuestions} soal yang belum dijawab.`);
    if (!findings.length) findings.push(lang === 'en' ? 'No incorrect equation steps were recorded.' : 'Tidak ada langkah persamaan yang tercatat keliru.');
    return findings.slice(0, 3);
  }
  if (summary.wrongQuestions > 0) findings.push(lang === 'en' ? `${summary.wrongQuestions} question(s) were answered incorrectly.` : `${summary.wrongQuestions} soal dijawab dengan salah.`);
  if (summary.retryQuestions > 0) findings.push(lang === 'en' ? `${summary.retryQuestions} question(s) needed another attempt.` : `${summary.retryQuestions} soal perlu dicoba ulang.`);
  if (summary.unansweredQuestions > 0) findings.push(lang === 'en' ? `${summary.unansweredQuestions} question(s) were left unanswered.` : `${summary.unansweredQuestions} soal belum dijawab.`);
  if (!findings.length) findings.push(lang === 'en' ? 'No incorrect answers or repeated attempts were recorded.' : 'Tidak ada jawaban salah atau percobaan ulang yang tercatat.');
  return findings.slice(0, 3);
}

function buildAdvice(summary, t, automaticChapter, lang) {
  if (automaticChapter) {
    if (summary.simulationModelErrors > 0) return [lang === 'en' ? 'Review how the story becomes an equation before balancing both sides.' : 'Tinjau kembali cara mengubah cerita menjadi persamaan sebelum menyeimbangkan kedua ruas.'];
    if (Number(summary.chapterId) === 2 && summary.simulationErrorHistory?.length) {
      const kinds = new Set(summary.simulationErrorHistory.map((item) => item.kind));
      const advice = [];
      if (kinds.has('chapter2-wrong-side')) advice.push(lang === 'en' ? 'Keep each tile on its original side of the balance.' : 'Pertahankan setiap ubin pada ruas asalnya.');
      if (kinds.has('chapter2-group-capacity') || kinds.has('chapter2-grouping-error')) advice.push(lang === 'en' ? 'Count the tiles in each group and keep the same contents in matching groups.' : 'Hitung ubin di setiap kelompok dan samakan isi kelompok yang berpasangan.');
      if (kinds.has('chapter2-group-match-error')) advice.push(lang === 'en' ? 'Match groups with the same number before applying the sign rule.' : 'Pasangkan kelompok dengan nomor yang sama sebelum menerapkan aturan tanda.');
      if (kinds.has('chapter2-fraction-cut') || kinds.has('chapter2-fraction-target') || kinds.has('chapter2-fraction-capacity')) advice.push(lang === 'en' ? 'Check that each fraction piece matches the intended equal part and target frame.' : 'Pastikan setiap kepingan pecahan mewakili bagian sama besar dan masuk ke bingkai yang sesuai.');
      if (kinds.has('chapter2-fraction-sign')) advice.push(lang === 'en' ? 'Apply the sign change to both sides to keep the equation equivalent.' : 'Terapkan perubahan tanda pada kedua ruas agar persamaan tetap setara.');
      if (advice.length) return advice;
    }
    if (Number(summary.chapterId) === 3 && summary.simulationErrorHistory?.length) {
      const kinds = new Set(summary.simulationErrorHistory.map((item) => item.kind));
      const advice = [];
      if (kinds.has('incorrect-tile-transfer') || kinds.has('unbalanced-tile-operation')) advice.push(lang === 'en' ? 'Check the tile sign and value against the inverse operation, and apply equivalent changes to both sides.' : 'Cocokkan tanda dan nilai ubin dengan operasi invers, lalu lakukan perubahan yang setara pada kedua ruas.');
      if (kinds.has('wrong-operation-on-both-sides')) advice.push(lang === 'en' ? 'Choose the inverse operation and use the same number on both sides.' : 'Pilih operasi invers dan gunakan angka yang sama pada kedua ruas.');
      if (kinds.has('parentheses-or-like-term-error')) advice.push(lang === 'en' ? 'Distribute the factor to every term inside the parentheses, preserving each sign.' : 'Kalikan faktor ke setiap suku di dalam kurung dan pertahankan tanda tiap suku.');
      if (advice.length) return advice;
    }
    if (Number(summary.chapterId) === 1 && summary.simulationErrorHistory?.length) {
      const kinds = new Set(summary.simulationErrorHistory.map((item) => item.kind));
      const advice = [];
      if (kinds.has('one-side-only-operation') || kinds.has('unbalanced-tile-operation') || kinds.has('different-operation-on-each-side')) advice.push(lang === 'en' ? 'Apply the same operation and value to both sides so equality is preserved.' : 'Terapkan operasi dan nilai yang sama pada kedua ruas agar persamaan tetap setara.');
      if (kinds.has('sign-changed-without-operation') || kinds.has('wrong-operation-on-both-sides')) advice.push(lang === 'en' ? 'Use the inverse operation; a sign changes only as a result of a valid operation.' : 'Gunakan operasi kebalikan; tanda berubah karena operasi yang sah, bukan dipindahkan begitu saja.');
      if (kinds.has('incorrect-tile-transfer')) advice.push(lang === 'en' ? 'Check the tile value and its sign before moving it, then confirm the scale returns to balance.' : 'Periksa nilai dan tanda ubin sebelum memindahkannya, lalu pastikan timbangan kembali seimbang.');
      if (advice.length) return advice;
    }
    if (summary.simulationStepErrors > 0) return [lang === 'en' ? `${summary.simulationStepErrors} equation step correction(s) were needed. Review how the same operation is applied to both sides.` : `Ada ${summary.simulationStepErrors} koreksi langkah. Tinjau kembali cara menerapkan operasi yang sama pada kedua ruas.`];
    if (summary.unansweredQuestions > 0) return [lang === 'en' ? 'Review the unanswered equation steps before moving on.' : 'Periksa kembali langkah persamaan yang belum diselesaikan.'];
    return [lang === 'en' ? 'No incorrect equation steps need review.' : 'Tidak ada langkah persamaan yang keliru untuk diperbaiki.'];
  }
  const advice = summary.weakConcepts.map(item => `${item.concept} — ${item.accuracy}%`);
  if (!advice.length) advice.push(lang === 'en' ? 'No incorrect answers need review.' : 'Tidak ada jawaban salah yang perlu diperbaiki.');
  if (summary.retryQuestions >= 2) advice.push(t('evalAdviceRetries'));
  return advice.slice(0, 2);
}

export default function Evaluation({ result, onClose, onRematch, onNext, nextLevel, t, lang }) {
  const { closing, dismiss } = useAnimatedDismiss(onClose);
  const dialogRef = useDialogKeyboard(dismiss);
  const summary = useMemo(() => summarizePerformance(result), [result]);
  const automaticChapter = [1, 2, 3, 4, 5].includes(Number(result.chapterId));
  const solvoxEvaluation = useMemo(() => result.chapterEvaluation || evaluateSolvoxChapter({ ...result, ...summary }), [result, summary]);
  const cls = classifyMastery(summary.mastery).key;
  const masteryTier = summary.answeredQuestions < summary.totalQuestions || summary.simulationStepsCompleted < summary.simulationStepsTotal
    ? (lang === 'en' ? 'Incomplete' : 'Belum tuntas')
    : summary.simulationStepErrors === 0
      ? (lang === 'en' ? 'Independent' : 'Mandiri')
      : summary.simulationStepErrors <= 2
        ? (lang === 'en' ? 'Independent with corrections' : 'Mandiri dengan koreksi')
        : (lang === 'en' ? 'Guided practice recommended' : 'Perlu latihan terbimbing');
  const [expanded, setExpanded] = useState(null);
  const labels = {
    excellent: t('masteryExcellent'),
    good: t('masteryGood'),
    practice: t('masteryPractice'),
    reinforce: t('masteryReinforce'),
  };
  const strengths = useMemo(() => buildErrorSummary(summary, t, automaticChapter, lang), [summary, t, automaticChapter, lang]);
  const advice = useMemo(() => buildAdvice(summary, t, automaticChapter, lang), [summary, t, automaticChapter, lang]);
  const statusText = result.won ? t('levelClear') : t('levelNotCleared');
  const outcomeNote = result.won ? t('evaluationWinNote') : t('evaluationLoseNote');

  useEffect(() => {
    apiJson('/api/evaluation', {
      method: 'POST',
      body: JSON.stringify({
        chapterId: result.chapterId,
        won: !!result.won,
        mastery: summary.mastery,
        performance: summary,
        questionLogs: result.questionLogs || [],
        completionReason: result.completionReason || '',
        ts: Date.now(),
      }),
    }).catch(() => {});
  }, [result, summary]);

  return (
    <div className={`modal-backdrop evaluation-backdrop${closing ? ' is-closing' : ''}`}>
      <div ref={dialogRef} className={`eval-card eval-card-detailed eval-card--detailed ${result.won ? 'win' : 'loss'}`} role="dialog" aria-modal="true" aria-labelledby="evaluation-title">
        <div className="eval-heading-row"><div className="eyebrow">{t('evaluation')}</div><button className="dialog-icon-close evaluation-close" type="button" onClick={() => dismiss()} aria-label={lang === 'en' ? 'Back to home' : 'Kembali ke beranda'}><PixelIcon name="close" size={18}/></button></div>
        <header className="eval-summary">
          <div className="eval-summary-copy">
            <h2 id="evaluation-title">{statusText}</h2>
            <p>{outcomeNote}</p>
          </div>
          <div className="eval-score">
            <div className="eval-score-number">{summary.mastery}</div>
            <span>{labels[cls]}</span>
            <div className="eval-accuracy-bar" aria-label={`${automaticChapter ? summary.simulationStepCompletionRate : summary.accuracy}% ${automaticChapter ? (lang === 'en' ? 'simulation progress' : 'progres simulasi') : t('accuracy')}`}>
              <i style={{ width: `${automaticChapter ? summary.simulationStepCompletionRate : summary.accuracy}%` }} />
            </div>
            <small>{automaticChapter ? `${summary.simulationStepCompletionRate}% ${lang === 'en' ? 'simulation progress' : 'progres simulasi'}` : `${summary.accuracy}% ${t('accuracy')}`}</small>
          </div>
        </header>

        <section className="eval-summary-block">
          <div className="eval-section-title"><PixelIcon name="spark" size={16} /><h3>{lang === 'en' ? 'Mistakes found' : 'Kesalahan yang ditemukan'}</h3></div>
          <div className="eval-bullets">{strengths.map((text, index) => <p key={`s-${index}`}>• {text}</p>)}</div>
        </section>

        <section className="eval-summary-block">
          <div className="eval-section-title"><PixelIcon name="spark" size={16} /><h3>{lang === 'en' ? 'What to review' : 'Bagian yang perlu diperbaiki'}</h3></div>
          <div className="eval-bullets">{advice.map((text, index) => <p key={`a-${index}`}>• {text}</p>)}</div>
        </section>

        <section className="eval-metrics" aria-label={t('evaluationEvidence')}>
          {(automaticChapter ? [
            [lang === 'en' ? 'Equation steps' : 'Langkah persamaan', `${summary.simulationStepsCompleted}/${summary.simulationStepsTotal}`],
            [lang === 'en' ? 'Step completion' : 'Penyelesaian langkah', `${summary.simulationStepCompletionRate}%`],
            [lang === 'en' ? 'Step corrections' : 'Koreksi langkah', summary.simulationStepErrors],
            ...([1, 2, 3].includes(Number(result.chapterId)) ? [[lang === 'en' ? 'Completion tier' : 'Tingkat penyelesaian', masteryTier]] : []),
            ...(Number(result.chapterId) === 5 ? [[lang === 'en' ? 'Story corrections' : 'Koreksi model cerita', summary.simulationModelErrors]] : []),
            [t('time'), `${summary.totalTime}s`],
            [lang === 'en' ? 'Questions completed' : 'Soal diselesaikan', `${summary.answeredQuestions}/${summary.totalQuestions}`],
            [t('hpRemaining'), `${summary.hpRemaining}/${summary.maxHp}`],
          ] : [
            [t('accuracy'), `${summary.accuracy}%`],
            [t('firstAttempt'), `${summary.firstAttemptRate}%`],
            [t('time'), `${summary.totalTime}s`],
            [t('attempt'), summary.totalAttempts],
            [t('hpRemaining'), `${summary.hpRemaining}/${summary.maxHp}`],
          ]).map(([label, value]) => (
            <div key={label} className="eval-metric"><span>{label}</span><b>{value}</b></div>
          ))}
        </section>

        <section className="eval-recommendation">
          <div className="eval-recommendation-icon"><PixelIcon name="spark" size={18} /></div>
          <div><span>{t('studyRecommendation')}</span><strong>{solvoxEvaluation.title}</strong><p>{solvoxEvaluation.message}</p></div>
        </section>

        <section className="eval-review">
          <div className="eval-review-head">
            <div>
              <div className="eyebrow">{t('chapterReport')}</div>
              <h3>{t('evalDetailsTitle')}</h3>
            </div>
            <span>{summary.answeredQuestions}/{summary.totalQuestions}</span>
          </div>

          <div className="eval-accordion">
            {result.questionLogs?.length ? result.questionLogs.map((item, index) => (
              <details key={`${item.idx}-${index}`} open={expanded === index} className={`eval-detail ${item.correct ? 'ok' : 'bad'}`}>
                <summary onClick={(event) => { event.preventDefault(); setExpanded((current) => current === index ? null : index); }}>
                  <span className="eval-detail-status"><PixelIcon name={item.correct ? 'check' : 'close'} size={14} /></span>
                  <div>
                    <b>{t('questionNumber')} {item.questionId ?? index + 1} · {item.concept}</b>
                    <small>{automaticChapter
                      ? `${item.timeSec}s • ${item.simulation?.stepsCompleted || 0}/${item.simulation?.stepsTotal || 0} ${lang === 'en' ? 'steps' : 'langkah'}`
                      : `${item.timeSec}s • ${t('attempt')}: ${item.attempts} • ${item.wrongAttempts || 0} ${lang === 'en' ? 'mistakes' : 'kesalahan'}`}</small>
                  </div>
                  <span className="eval-detail-chevron">⌄</span>
                </summary>
                <div className="eval-detail-body">
                  <div className="eval-question-full"><span>{t('question')}</span><p>{item.text}</p></div>
                  <div className={`eval-answer-grid${automaticChapter ? ' is-automatic' : ''}`}>
                    {automaticChapter ? <div><span>{lang === 'en' ? 'Solved result' : 'Hasil penyelesaian'}</span><b>{item.answer || '—'}</b></div> : <>
                    <div><span>{t('yourAnswer')}</span><b>{Array.isArray(item.answer) ? item.answer.join(', ') : item.answer || '—'}</b></div>
                    <div><span>{t('expected')}</span><b>{Array.isArray(item.correctAnswer) ? item.correctAnswer.join(lang === 'en' ? ' or ' : ' atau ') : item.correctAnswer}</b></div>
                    </>}
                  </div>
                  {item.simulation && <div className="eval-history">
                    <span>{lang === 'en' ? 'Equation process' : 'Proses persamaan'}</span>
                    <p>{item.simulation.stepsCompleted}/{item.simulation.stepsTotal} {lang === 'en' ? 'steps completed' : 'langkah selesai'} · {item.simulation.stepErrors} {lang === 'en' ? 'step retries' : 'perbaikan langkah'}</p>
                    {[1, 2, 3].includes(Number(result.chapterId)) && item.simulation.stepErrorHistory?.length > 0 && <div className="eval-error-events">
                      <b>{lang === 'en' ? 'Mistakes recorded during play' : 'Kesalahan yang tercatat saat bermain'}</b>
                      {item.simulation.stepErrorHistory.map((error, errorIndex) => <p key={`${error.step}-${errorIndex}`}>
                        {lang === 'en' ? `Step ${error.step}` : `Langkah ${error.step}`} · {ERROR_LABELS[error.kind]?.[lang === 'en' ? 1 : 0] || (lang === 'en' ? 'equation-step error' : 'kesalahan langkah persamaan')}
                        {error.operation ? ` (${lang === 'en' ? 'expected' : 'langkah seharusnya'}: ${error.operation})` : ''}
                        {error.attempted ? ` · ${lang === 'en' ? 'attempted' : 'tindakan/hasil'}: ${error.attempted}` : ''}
                      </p>)}
                    </div>}
                    {[1, 2, 3].includes(Number(result.chapterId)) && item.simulation.stepErrors > 0 && SIMULATIONS[Number(item.questionId)] && <div className="eval-worked-solution">
                      <b>{lang === 'en' ? 'Worked solution' : 'Pembahasan langkah yang benar'}</b>
                      <p>{lang === 'en' ? 'Start:' : 'Mulai dari:'} {SIMULATIONS[Number(item.questionId)].equation}</p>
                      {SIMULATIONS[Number(item.questionId)].steps.map((step, stepIndex) => <p key={`${step.operation}-${stepIndex}`}>
                        {lang === 'en' ? `Step ${stepIndex + 1}: ${operationLabel(step.operation, lang)} → ${step.after}` : `Langkah ${stepIndex + 1}: ${operationLabel(step.operation, lang)} → ${step.after}`}
                      </p>)}
                    </div>}
                    {Number(item.questionId) >= 41 && <p>{lang === 'en' ? 'Story model' : 'Model cerita'}: {item.simulation.modelCorrect ? (lang === 'en' ? 'correct' : 'tepat') : (lang === 'en' ? 'incomplete' : 'belum selesai')} · {item.simulation.modelErrors} {lang === 'en' ? 'model retries' : 'perbaikan model'}</p>}
                  </div>}
                  {item.answerHistory?.length > 1 && <div className="eval-history"><span>{t('answerHistory')}</span><p>{item.answerHistory.join(' → ')}</p></div>}
                </div>
              </details>
            )) : <div className="empty-review">{t('noQuestionLogs')}</div>}
          </div>
        </section>

        <p className="eval-note">{lang === 'en'
          ? 'This evaluation follows completed simulation steps and corrections made during play.'
          : 'Evaluasi ini mengikuti langkah simulasi yang selesai dan koreksi selama bermain.'}</p>
        <div className="eval-actions">
          <SolvoxBackButton className="secondary-btn" onClick={() => dismiss()} label={lang === 'en' ? 'Back to home' : 'Kembali ke beranda'} />
          <button className="secondary-btn rematch-btn" onClick={() => dismiss(onRematch)}><PixelIcon name="retry" size={15} /><span>{t('rematch')}</span></button>
          {nextLevel && <button className="primary-btn" onClick={() => dismiss(() => onNext(nextLevel))}>{t('nextChapter')} →</button>}
        </div>
      </div>
    </div>
  );
}
