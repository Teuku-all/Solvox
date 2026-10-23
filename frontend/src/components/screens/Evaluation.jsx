import React, { useEffect, useMemo, useState } from 'react';
import { classifyMastery, summarizePerformance } from '../../services/evaluation';
import { evaluateSolvoxChapter } from '../../services/solvoxEvaluation';
import PixelIcon from '../shared/PixelIcon';
import {apiJson} from '../../services/api';
import useDialogKeyboard from '../shared/useDialogKeyboard';
import useAnimatedDismiss from '../shared/useAnimatedDismiss';

function buildStrengths(summary, t, automaticChapter, lang) {
  const strengths = [];
  if (automaticChapter) {
    if (summary.simulationStepCompletionRate >= 90) strengths.push(lang === 'en' ? 'You completed nearly every equation step.' : 'Kamu menyelesaikan hampir semua langkah persamaan.');
    if (summary.simulationStepErrors === 0 && summary.simulationStepsCompleted > 0) strengths.push(lang === 'en' ? 'You solved the equation steps without mistakes.' : 'Kamu menyelesaikan langkah persamaan tanpa kesalahan.');
    if (summary.completionRate >= 90) strengths.push(lang === 'en' ? 'You completed nearly the whole chapter journey.' : 'Kamu menuntaskan hampir seluruh perjalanan chapter.');
    if (!strengths.length) strengths.push(lang === 'en' ? 'You made progress through the equation simulations.' : 'Kamu sudah berlatih melalui simulasi persamaan.');
    return strengths.slice(0, 3);
  }
  if (summary.accuracy >= 85) strengths.push(t('evalStrengthAccuracy'));
  if (summary.firstAttemptRate >= 70) strengths.push(t('evalStrengthFirstTry'));
  if (summary.avgTimePerAnsweredQuestion > 0 && summary.avgTimePerAnsweredQuestion <= 30) strengths.push(t('evalStrengthPace'));
  if (summary.hintsUsed === 0) strengths.push(t('evalStrengthIndependence'));
  if (summary.completionRate >= 90) strengths.push(t('evalStrengthCompletion'));
  if (!strengths.length) strengths.push(t('evalStrengthPersistence'));
  return strengths.slice(0, 3);
}

function buildAdvice(summary, t, automaticChapter, lang) {
  if (automaticChapter) {
    if (summary.simulationStepErrors > 0) return [lang === 'en' ? `${summary.simulationStepErrors} equation step correction(s) were needed. Review how the same operation is applied to both sides.` : `Ada ${summary.simulationStepErrors} koreksi langkah. Tinjau kembali cara menerapkan operasi yang sama pada kedua ruas.`];
    if (summary.simulationStepCompletionRate < 100) return [lang === 'en' ? 'Complete the remaining equation simulations to strengthen your understanding.' : 'Selesaikan simulasi persamaan yang tersisa untuk memperkuat pemahamanmu.'];
    return [lang === 'en' ? 'Continue to the next chapter and apply the same balance principle to new equations.' : 'Lanjutkan ke chapter berikutnya dan gunakan prinsip keseimbangan pada persamaan baru.'];
  }
  const advice = summary.weakConcepts.map(item => `${item.concept} — ${item.accuracy}%`);
  if (!advice.length) advice.push(summary.mastery >= 85 ? t('evalAdviceChallenge') : t('evalAdviceReview'));
  if (summary.hintsUsed >= 2) advice.push(t('evalAdviceHints'));
  if (summary.retryQuestions >= 2) advice.push(t('evalAdviceRetries'));
  return advice.slice(0, 2);
}

export default function Evaluation({ result, onClose, onRematch, onNext, nextLevel, t, lang }) {
  const { closing, dismiss } = useAnimatedDismiss(onClose);
  const dialogRef = useDialogKeyboard(dismiss);
  const summary = useMemo(() => summarizePerformance(result), [result]);
  const automaticChapter = Number(result.chapterId) === 1;
  const solvoxEvaluation = useMemo(() => result.chapterEvaluation || evaluateSolvoxChapter({ ...result, ...summary }), [result, summary]);
  const cls = classifyMastery(summary.mastery).key;
  const [expanded, setExpanded] = useState(null);
  const labels = {
    excellent: t('masteryExcellent'),
    good: t('masteryGood'),
    practice: t('masteryPractice'),
    reinforce: t('masteryReinforce'),
  };
  const strengths = useMemo(() => buildStrengths(summary, t, automaticChapter, lang), [summary, t, automaticChapter, lang]);
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
        <header className="eval-summary">
          <div className="eval-summary-copy">
            <div className="eval-heading-row"><div className="eyebrow">{t('evaluation')}</div><button className="dialog-icon-close evaluation-close" type="button" onClick={() => dismiss()} aria-label={lang === 'en' ? 'Back to home' : 'Kembali ke beranda'}><PixelIcon name="close" size={18}/></button></div>
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
          <div className="eval-section-title"><PixelIcon name="spark" size={16} /><h3>{t('evalStrengthsTitle')}</h3></div>
          <div className="eval-bullets">{strengths.map((text, index) => <p key={`s-${index}`}>• {text}</p>)}</div>
        </section>

        <section className="eval-summary-block">
          <div className="eval-section-title"><PixelIcon name={automaticChapter ? 'spark' : 'hint'} size={16} /><h3>{t('evalAdviceTitle')}</h3></div>
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
            [t('hints'), summary.hintsUsed],
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
                      : `${item.timeSec}s • ${t('attempt')}: ${item.attempts} • ${t('hints')}: ${item.hintsUsed || 0}`}</small>
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
                  {!automaticChapter && item.feedback && <div className="eval-feedback"><span>{t('learningFeedback')}</span><p>{item.feedback}</p></div>}
                  {!automaticChapter && item.explanation && <div className="eval-explanation"><span>{t('explanation')}</span><p>{item.explanation}</p></div>}
                  {item.answerHistory?.length > 1 && <div className="eval-history"><span>{t('answerHistory')}</span><p>{item.answerHistory.join(' → ')}</p></div>}
                </div>
              </details>
            )) : <div className="empty-review">{t('noQuestionLogs')}</div>}
          </div>
        </section>

        <p className="eval-note">{automaticChapter
          ? (lang === 'en' ? 'Chapter 1 evaluation is based on completed equation steps and corrections made during the simulation.' : 'Evaluasi Chapter 1 didasarkan pada langkah persamaan yang diselesaikan dan koreksi selama simulasi.')
          : t('masteryNote')}</p>
        <div className="eval-actions">
          <button className="secondary-btn" onClick={() => dismiss()}>{lang === 'en' ? 'Back to home' : 'Kembali ke beranda'}</button>
          <button className="secondary-btn rematch-btn" onClick={() => dismiss(onRematch)}><PixelIcon name="retry" size={15} /><span>{t('rematch')}</span></button>
          {nextLevel && <button className="primary-btn" onClick={() => dismiss(() => onNext(nextLevel))}>{t('nextChapter')} →</button>}
        </div>
      </div>
    </div>
  );
}
