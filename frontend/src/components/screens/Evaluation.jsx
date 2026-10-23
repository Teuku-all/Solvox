import React, { useEffect, useMemo, useState } from 'react';
import { classifyMastery, summarizePerformance } from '../../services/evaluation';
import { evaluateSolvoxChapter } from '../../services/solvoxEvaluation';
import PixelIcon from '../shared/PixelIcon';
import SolvoxBackButton from '../shared/SolvoxBackButton';
import {apiJson} from '../../services/api';
import useDialogKeyboard from '../shared/useDialogKeyboard';
import useAnimatedDismiss from '../shared/useAnimatedDismiss';

function buildErrorSummary(summary, t, automaticChapter, lang) {
  const findings = [];
  if (automaticChapter) {
    if (summary.simulationStepErrors > 0) findings.push(lang === 'en' ? `${summary.simulationStepErrors} equation step correction(s) were needed.` : `Ada ${summary.simulationStepErrors} koreksi langkah persamaan.`);
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
  const automaticChapter = [1, 2, 3].includes(Number(result.chapterId));
  const solvoxEvaluation = useMemo(() => result.chapterEvaluation || evaluateSolvoxChapter({ ...result, ...summary }), [result, summary]);
  const cls = classifyMastery(summary.mastery).key;
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
                    {Number(item.questionId) >= 41 && <p>{lang === 'en' ? 'Story model' : 'Model cerita'}: {item.simulation.modelCorrect ? (lang === 'en' ? 'correct' : 'tepat') : (lang === 'en' ? 'incomplete' : 'belum selesai')} · {item.simulation.modelErrors} {lang === 'en' ? 'model retries' : 'perbaikan model'}</p>}
                  </div>}
                  {item.answerHistory?.length > 1 && <div className="eval-history"><span>{t('answerHistory')}</span><p>{item.answerHistory.join(' → ')}</p></div>}
                </div>
              </details>
            )) : <div className="empty-review">{t('noQuestionLogs')}</div>}
          </div>
        </section>

        <p className="eval-note">{lang === 'en'
          ? 'This evaluation focuses on incorrect answers, repeated attempts, and corrections made during play.'
          : 'Evaluasi ini berfokus pada jawaban yang salah, percobaan ulang, dan koreksi yang dilakukan selama bermain.'}</p>
        <div className="eval-actions">
          <SolvoxBackButton className="secondary-btn" onClick={() => dismiss()} label={lang === 'en' ? 'Back to home' : 'Kembali ke beranda'} />
          <button className="secondary-btn rematch-btn" onClick={() => dismiss(onRematch)}><PixelIcon name="retry" size={15} /><span>{t('rematch')}</span></button>
          {nextLevel && <button className="primary-btn" onClick={() => dismiss(() => onNext(nextLevel))}>{t('nextChapter')} →</button>}
        </div>
      </div>
    </div>
  );
}
