import { getPlayerAsset } from '../../data/playerAssets';
import React, { useEffect, useRef, useState } from 'react';
import ArenaBackground from './ArenaBackground';
import BattleQuestionPanel from './BattleQuestionPanel';
import MathSimulation from './MathSimulation';
import { SIMULATIONS } from '../../data/algebraSimulation';
import CombatStage from './CombatStage';
import HitEffect from './HitEffect';
import { loadChapterQuestions, validateChapterAnswer } from '../../services/singlePlayerGame';
import { evaluateSolvoxChapter } from '../../services/solvoxEvaluation';
import { LEVELS } from '../../data/levels';
import { PLAYER } from '../../data/player';
import { getBoss } from '../../data/bosses';
import { getBossImpactMs, getBossPreviewSrc, getBossSequenceDurationMs } from '../../data/bossAssets';
import PixelIcon from '../shared/PixelIcon';
import { SolvoxUtilityArt } from '../shared/SolvoxUtilityArt';
import { playBossAttack, playSound } from '../../services/sound';

export default function Battle({ levelId, playerId = 'traveler', lang, t, onComplete, onBack }) {
  const boss = getBoss(levelId);
  const bossAttackImpactMs = getBossImpactMs(boss.spriteId, 'attack', 360);
  const bossDieDurationMs = getBossSequenceDurationMs(boss.spriteId, 'die');
  const damagePerQuestion = Math.ceil(boss.hp / 10);
  const playerAsset = getPlayerAsset(playerId);
  const meta = LEVELS.find((entry) => entry.id === levelId) || LEVELS[0];

  /* ----------------------------- Battle state ----------------------------- */
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [questionRequest, setQuestionRequest] = useState(0);
  const [devQuestionIndex, setDevQuestionIndex] = useState('0');
  const [actionError, setActionError] = useState('');
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [hp, setHp] = useState(PLAYER.stats.hp);
  const [enemyHp, setEnemyHp] = useState(boss.hp);
    const [currentHints, setCurrentHints] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [round, setRound] = useState(1);
  const [impact, setImpact] = useState(null);
  const [impactAmount, setImpactAmount] = useState(0);
  const [impactTheme, setImpactTheme] = useState('player');
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());
  const [startedAt, setStartedAt] = useState(Date.now());
  const [questionLogs, setQuestionLogs] = useState([]);
  const [simulation, setSimulation] = useState({ ready: false, modelCorrect: false, modelErrors: 0, stepErrors: 0, stepsCompleted: 0, stepsTotal: 0 });
  const [balanceSolvedQuestionId, setBalanceSolvedQuestionId] = useState(null);
  const [keypadVisible, setKeypadVisible] = useState(() => {
    const value = localStorage.getItem('solvox.keypad');
    const legacy = localStorage.getItem('numericore.keypad');
    return value !== null
      ? value !== '0'
      : legacy !== null
        ? legacy !== '0'
        : localStorage.getItem('aljabarmaster.keypad') !== '0';
  });

  const combatRef = useRef(null);
  const endedRef = useRef(false);
  const timersRef = useRef(new Set());
  const questionAttemptRef = useRef({
    wrongAttempts: 0,
    answers: [],
    feedbackBankHistory: [],
    startedAt: Date.now(),
  });

  /* ----------------------------- Small helpers ---------------------------- */
  const later = (callback, delay) => {
    const timerId = window.setTimeout(() => {
      timersRef.current.delete(timerId);
      callback();
    }, delay);

    timersRef.current.add(timerId);
    return timerId;
  };

  const finish = (result) => {
    if (endedRef.current) return;

    endedRef.current = true;
    onComplete({
      ...result,
      chapterId: levelId,
      questionLogs: result.questionLogs || questionLogs,
      questionSource: 'local',
      totalQuestions: questions.length || 10,
      maxHp: PLAYER.stats.hp,
      playerCharacter: playerAsset.id,
      nextHp: result.nextHp ?? hp,
    });
  };

  const showImpact = (side, amount, theme) => {
    setImpact(side);
    setImpactAmount(amount);
    setImpactTheme(theme);
    later(() => setImpact(null), 650);
  };

  const devJumpToQuestion = () => {
    if (!import.meta.env.DEV || busy) return;
    const targetIndex = Number(devQuestionIndex);
    if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= questions.length || targetIndex === idx) return;
    setFeedback(null);
    setAnswer('');
    setSimulation({ ready: false, modelCorrect: false, modelErrors: 0, stepErrors: 0, stepsCompleted: 0, stepsTotal: 0 });
    setBalanceSolvedQuestionId(null);
    setRound(targetIndex + 1);
    setIdx(targetIndex);
  };

  /* --------------------------- Reset on chapter --------------------------- */
  useEffect(() => {
    const now = Date.now();

    endedRef.current = false;
    setIdx(0);
    setAnswer('');
    setBusy(false);
    setHp(PLAYER.stats.hp);
    setEnemyHp(boss.hp);
        setCurrentHints(0);
    setAttempts(0);
    setCorrect(0);
    setFeedback(null);
    setRound(1);
    setImpact(null);
    setImpactAmount(0);
    setImpactTheme('player');
    setQuestionStartedAt(now);
    setStartedAt(now);
    setQuestionLogs([]);
    setSimulation({ ready: false, modelCorrect: false, modelErrors: 0, stepErrors: 0, stepsCompleted: 0, stepsTotal: 0 });
    setBalanceSolvedQuestionId(null);
    setLoadError('');
    questionAttemptRef.current = {
      wrongAttempts: 0,
      answers: [],
      feedbackBankHistory: [],
      startedAt: now,
    };
  }, [levelId, boss.hp]);

  /* ---------------------------- Question loading ------------------------- */
  useEffect(() => {
    let alive = true;

    setLoading(true);
    setLoadError('');

    loadChapterQuestions(levelId, lang)
      .then((chapterQuestions) => { if (alive) setQuestions(chapterQuestions); })
      .catch((error) => {
        console.error('[Battle] server question load failed', error);
        if (alive) { setQuestions([]); setLoadError(error.message || t('questionFallback')); }
      })
      .finally(() => { if (alive) setLoading(false); });

    return () => {
      alive = false;
    };
  }, [levelId, lang, questionRequest]);

  /* ---------------------------- Persistence / UI -------------------------- */
  useEffect(() => {
    localStorage.setItem('solvox.keypad', keypadVisible ? '1' : '0');
  }, [keypadVisible]);

  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    },
    [],
  );

  useEffect(() => {
    const now = Date.now();

    setAnswer('');
    setFeedback(null);
    setBusy(false);
    setAttempts(0);
    setCurrentHints(0);
    setQuestionStartedAt(now);
    questionAttemptRef.current = {
      wrongAttempts: 0,
      answers: [],
      feedbackBankHistory: [],
      startedAt: now,
    };

    window.requestAnimationFrame(() => {
      document.querySelector('.battle-answer-input')?.focus();
    });
  }, [idx]);

  /* ------------------------------- Hint ----------------------------------- */
  const useHint = () => {
    const hintCost = [5, 10, 15][currentHints] ?? 15;
    if (busy || currentHints >= 3 || hp <= hintCost) return;

    setBusy(true);
    setCurrentHints((value) => value + 1);
    setHp((value) => Math.max(1, value - hintCost));
    playSound('hint');
    combatRef.current?.bossAttack();
    playBossAttack(levelId);
    later(() => {
      showImpact('player', hintCost, 'boss');
      combatRef.current?.playerHurt();
      setBusy(false);
    }, bossAttackImpactMs);

    // A hint retains its existing HP cost; unsuccessful steps and answers do not.
  };

  /* ----------------------------- Answer flow ------------------------------ */
  const submit = async () => {
    if (busy || !simulation.ready || simulation.questionId !== q?.id || !answer.trim() || endedRef.current) return;

    const now = Date.now();
    const elapsed = Math.max(1, Math.round((now - questionStartedAt) / 1000));
    const tracker = questionAttemptRef.current;
    const attemptNow = attempts + 1;
    const history = [...(tracker.answers || []), answer];
    setActionError('');
    let verdict;
    try {
      setBusy(true);
      verdict = await validateChapterAnswer(q.id, answer, attemptNow, lang);
    } catch (error) {
      setActionError(error.message || t('questionFallback'));
      setBusy(false);
      return;
    }
    const isCorrect = Boolean(verdict.correct);
    const correctAnswer = verdict.correctAnswer || '';
    const bankMatch = verdict.feedbackBankMatched ? { id: verdict.feedbackBankRow, code: verdict.feedbackBankCode, errorType: verdict.errorType, feedback: verdict.feedback } : null;

    tracker.answers = history;
    tracker.wrongAttempts = (tracker.wrongAttempts || 0) + (isCorrect ? 0 : 1);

    setAttempts(attemptNow);
    const bankAwareFeedback = String(verdict.feedback || q.feedback || t('tryAgain')).trim();

    if (!isCorrect) {
      tracker.feedbackBankHistory = [
        ...(tracker.feedbackBankHistory || []),
        {
          answer,
          matched: !!bankMatch,
          row: bankMatch?.id ?? null,
          code: bankMatch?.code ?? null,
          errorType: bankMatch?.errorType ?? null,
        },
      ];
    }

    const baseFeedback = {
      type: isCorrect ? 'correct' : 'wrong',
      title: isCorrect ? t('correct') : t('wrong'),
      message: isCorrect ? t('attackReady') : bankAwareFeedback,
      errorTag: isCorrect ? null : (bankMatch?.errorType || verdict.errorType || q.errorTag),
      explanation: bankAwareFeedback || `${correctAnswer}`,
      nextStep: isCorrect
        ? t('feedbackNextStep')
        : t('feedbackRetryPrompt'),
      feedbackBankMatched: !!bankMatch,
      feedbackBankCode: bankMatch?.code || null,
      feedbackBankRow: bankMatch?.id || null,
    };
    setFeedback(baseFeedback);
    playSound(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      handleCorrectAnswer({ elapsed, attemptNow, history, tracker, verdict });
      return;
    }

    handleWrongAnswer({ elapsed, attemptNow, history, tracker, bankAwareFeedback });
  };

  const handleCorrectAnswer = ({ elapsed, attemptNow, history, tracker, verdict }) => {
    const correctNow = correct + 1;

    setCorrect(correctNow);
    setBusy(true);
    combatRef.current?.playerAttack();
    playSound('playerAttack');

    later(() => {
      const nextEnemyHp = Math.max(0, enemyHp - damagePerQuestion);
      const log = {
        idx,
        questionId: q.id ?? idx + 1,
        text: q.text,
        concept: q.concept,
        errorTag: q.errorTag,
        feedback: q.feedback,
        correct: true,
        answer,
        correctAnswer: verdict.correctAnswer,
        attempts: attemptNow,
        wrongAttempts: tracker.wrongAttempts,
        timeSec: elapsed,
        hintsUsed: currentHints,
        hintMaxUsed: currentHints,
        answerHistory: history,
        feedbackBankHistory: [...(tracker.feedbackBankHistory || [])],
        feedbackBankMatched: (tracker.feedbackBankHistory || []).some((entry) => entry.matched),
        firstAttemptCorrect: tracker.wrongAttempts === 0,
        explanation: q.feedback,
        simulation: { ...simulation },
      };
      const logs = [...questionLogs, log];

      setEnemyHp(nextEnemyHp);
      setQuestionLogs(logs);
      combatRef.current?.bossHurt();

      const last = idx === questions.length - 1;
      const won = nextEnemyHp <= 0 || (last && correctNow >= 7 && hp > 0);

      later(() => {
        if (nextEnemyHp <= 0) combatRef.current?.bossDie();

        if (nextEnemyHp <= 0 || last) {
          playSound(won ? 'victory' : 'defeat');
          finish({
            accuracy: questions.length
              ? Math.round((correctNow / questions.length) * 100)
              : 0,
            attempts: logs.reduce((sum, item) => sum + item.attempts, 0),
            hints: logs.reduce((sum, item) => sum + item.hintsUsed, 0),
            timeSec: Math.round((Date.now() - startedAt) / 1000),
            correct: correctNow,
            won,
            nextEnemyHp,
            nextHp: hp,
            completionReason: nextEnemyHp <= 0 ? 'boss-defeated' : 'chapter-complete',
            questionLogs: logs,
            chapterEvaluation: evaluateSolvoxChapter({ chapterId: levelId, totalQuestions: questions.length, questionLogs: logs, won, nextHp: hp, nextEnemyHp: nextEnemyHp, lang }),
          });
          return;
        }

        setIdx((value) => value + 1);
        setRound((value) => value + 1);
        setBusy(false);
      }, nextEnemyHp <= 0 ? bossDieDurationMs + 140 : 220);
    }, 380);
  };

  const handleWrongAnswer = ({ elapsed, attemptNow, history, tracker, bankAwareFeedback }) => {
    const shouldBossAttack = tracker.wrongAttempts > 0 && tracker.wrongAttempts % 3 === 0;
    setAnswer('');

    if (!shouldBossAttack) {
      setBusy(false);
      window.requestAnimationFrame(() => document.querySelector('.battle-answer-input')?.focus());
      return;
    }

    setBusy(true);
    combatRef.current?.bossAttack();
    playBossAttack(levelId);
    later(() => {
      const nextHp = Math.max(0, hp - boss.damage);
      setHp(nextHp);
      showImpact('player', boss.damage, 'boss');
      combatRef.current?.playerHurt();

      if (nextHp > 0) {
        setBusy(false);
        window.requestAnimationFrame(() => document.querySelector('.battle-answer-input')?.focus());
        return;
      }

      const log = {
        idx,
        questionId: q.id ?? idx + 1,
        text: q.text,
        concept: q.concept,
        errorTag: q.errorTag,
        feedback: q.feedback,
        correct: false,
        answer,
        attempts: attemptNow,
        wrongAttempts: tracker.wrongAttempts,
        timeSec: elapsed,
        hintsUsed: currentHints,
        hintMaxUsed: currentHints,
        answerHistory: history,
        feedbackBankHistory: [...(tracker.feedbackBankHistory || [])],
        feedbackBankMatched: (tracker.feedbackBankHistory || []).some((entry) => entry.matched),
        firstAttemptCorrect: false,
        explanation: bankAwareFeedback || q.feedback,
        simulation: { ...simulation },
      };
      const logs = [...questionLogs, log];
      combatRef.current?.playerDie();
      playSound('defeat');
      later(() => finish({
        accuracy: questions.length ? Math.round((correct / questions.length) * 100) : 0,
        attempts: logs.reduce((sum, item) => sum + item.attempts, 0),
        hints: logs.reduce((sum, item) => sum + item.hintsUsed, 0),
        timeSec: Math.round((Date.now() - startedAt) / 1000),
        correct,
        won: false,
        nextEnemyHp: enemyHp,
        nextHp,
        completionReason: 'player-defeated',
        questionLogs: logs,
        chapterEvaluation: evaluateSolvoxChapter({ chapterId: levelId, totalQuestions: questions.length, questionLogs: logs, won: false, nextHp, nextEnemyHp: enemyHp, lang }),
      }), 500);
    }, bossAttackImpactMs);
  };

  const q = questions[idx];
  const maxEnemy = boss.hp;
  const isBalanceQuestion = Boolean(SIMULATIONS[Number(q?.id)]);
  const hideBalancePopup = isBalanceQuestion && (
    balanceSolvedQuestionId === Number(q?.id)
    || (simulation.ready && simulation.questionId === Number(q?.id))
    || feedback?.type === 'correct'
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <h2>{t('generatingQuestions')}</h2>
        <p>{t('freshPack')}</p>
        </div>
    );
  }

  if (loadError || !q) {
    return <div className="loading-screen battle-load-error"><PixelIcon name="warning" size={24}/><h2>{t('questionFallback')}</h2><p>{loadError}</p><div><button type="button" onClick={()=>{setLoadError('');setQuestionRequest(value=>value+1);}}>{lang==='en'?'Try again':'Coba lagi'}</button><button type="button" onClick={onBack}>{t('backToMap')}</button></div></div>;
  }

  return (
    <div className={`battle-page battle-reference ${isBalanceQuestion && !hideBalancePopup ? 'has-balance-overlay' : ''}`}>
      <div className="battle-world">
        <ArenaBackground levelId={levelId} paused={isBalanceQuestion && !hideBalancePopup} />

        <div className={`battle-ui${feedback?.type === 'wrong' ? ' has-feedback' : ''}`}> 
          {/* Top HUD */}
          <div className="battle-top-rail">
            <button
              className="battle-home-back"
              onClick={onBack}
              aria-label={t('backToMap')}
              title={t('backToMap')}
            >
              <SolvoxUtilityArt name="back" size={28} className="solvox-back-art" />
            </button>

            <div className="hp-card hp-player">
              <div className="hp-card-head">
                <span className="hp-avatar">
                  <img src={playerAsset.portrait} alt="" loading="eager" decoding="async" fetchPriority="high" />
                </span>
                <span className="hp-copy">
                  <small>{t('player')}</small>
                  <b>{hp} / {PLAYER.stats.hp}</b>
                </span>
                <span className="hp-percent">
                  {Math.max(0, Math.round((hp / PLAYER.stats.hp) * 100))}%
                </span>
              </div>
              <div className="hp-track" aria-label={`${hp}/${PLAYER.stats.hp} HP`}>
                <span style={{ width: `${Math.max(0, (hp / PLAYER.stats.hp) * 100)}%` }} />
              </div>
              <div className="hp-footer">
                <span>{hp <= 0 ? t('defeated') : t('readyStatus')}</span>
                <span><img src="/assets/ui/reference/heart-icon.png" alt="" /> HP</span>
              </div>
            </div>

            <div className="stage-crown">
              <span>
                <PixelIcon name="crown" size={12} />
                {lang === 'en' ? meta.chapterEn : meta.chapter} - {t('stage')} 1
              </span>
              <b>{lang === 'en' ? meta.titleEn : meta.title}</b>
            </div>

            <div className="hp-card hp-boss">
              <div className="hp-card-head">
                <span className="hp-avatar boss">
                  {boss.renderer === 'webp' ? (
                    <img src={getBossPreviewSrc(boss.spriteId)} alt="" loading="eager" decoding="async" fetchPriority="high" />
                  ) : (
                    <span className="hp-skull"><PixelIcon name="skull" size={17} /></span>
                  )}
                </span>
                <span className="hp-copy">
                  <small>{lang === 'en' ? boss.nameEn : boss.name}</small>
                  <b>{enemyHp} / {maxEnemy}</b>
                </span>
                <span className="hp-percent">
                  {Math.max(0, Math.round((enemyHp / maxEnemy) * 100))}%
                </span>
              </div>
              <div className="hp-track" aria-label={`${enemyHp}/${maxEnemy} HP`}>
                <span style={{ width: `${Math.max(0, (enemyHp / maxEnemy) * 100)}%` }} />
              </div>
              <div className="hp-footer">
                <span>{enemyHp <= 0 ? t('defeated') : t('boss')}</span>
                <span>ENEMY HP</span>
              </div>
            </div>
          </div>

          {loadError && (
            <div className="question-fallback-banner">
              <PixelIcon name="warning" size={14} />
              <span>{loadError}</span>
            </div>
          )}
          {actionError && <div className="question-fallback-banner" role="alert"><PixelIcon name="warning" size={14}/><span>{actionError}</span></div>}

          {import.meta.env.DEV && <div className="battle-dev-question-jump">
            <label htmlFor="battle-dev-question">DEV · {lang === 'en' ? 'Jump to question' : 'Lompat ke soal'}</label>
            <select id="battle-dev-question" value={devQuestionIndex} onChange={(event) => setDevQuestionIndex(event.target.value)} disabled={busy}>
              {questions.map((question, index) => <option key={`${question.id}-${index}`} value={index}>{lang === 'en' ? 'Question' : 'Soal'} {question.id ?? index + 1}</option>)}
            </select>
            <button type="button" onClick={devJumpToQuestion} disabled={busy || Number(devQuestionIndex) === idx}>{lang === 'en' ? 'Jump' : 'Lompat'}</button>
          </div>}

          {feedback?.type === 'wrong' && (
            <aside className="battle-mistake-banner" role="alert" aria-live="polite">
              <span className="battle-mistake-icon" aria-hidden="true">
                <PixelIcon name="warning" size={15} />
              </span>
              <div className="battle-mistake-copy">
                <div className="battle-mistake-heading">
                  <b>{feedback.title}</b>
                  <span>{t('questionNumber')} {q.id ?? idx + 1}</span>
                </div>
                <p>{feedback.message}</p>
              </div>
              {feedback.errorTag && <em className="battle-mistake-tag">{feedback.errorTag}</em>}
            </aside>
          )}

          {/* The arena stays separate so fighter animations never affect the deck layout. */}
          <div className={`battle-reference-arena ${isBalanceQuestion && !hideBalancePopup ? 'is-balance-open' : ''}`}>
            <CombatStage
              ref={combatRef}
              levelId={levelId}
              playerId={playerId}
              paused={isBalanceQuestion && !hideBalancePopup}
              onHit={() => showImpact('boss', damagePerQuestion, 'player')}
            />
            {!hideBalancePopup && <MathSimulation key={q.id} questionId={q.id} lang={lang} hintsUsed={currentHints} busy={busy} onProgress={setSimulation} onBalanceSolved={(result) => { setBalanceSolvedQuestionId(result.questionId); setSimulation(result); }} />}
          </div>

          <BattleQuestionPanel
            q={{ ...q, attempts }}
            levelId={levelId}
            meta={meta}
            lang={lang}
            t={t}
            round={round}
            totalRounds={questions.length}
            idx={idx}
            answer={answer}
            setAnswer={setAnswer}
            busy={busy}
            simulationReady={simulation.ready && simulation.questionId === q.id}
            submit={submit}
            hintsUsed={currentHints}
            hintsLeft={Math.max(0, 3 - currentHints)}
            hintCost={[5, 10, 15][currentHints] ?? 15}
            currentHp={hp}
            useHint={useHint}
            keypadVisible={keypadVisible}
            onToggleKeypad={() => setKeypadVisible((value) => !value)}
          />

          <div className="battle-reference-footer" aria-hidden="true" />
          <HitEffect side={impact} amount={impactAmount} theme={impactTheme} />
        </div>
      </div>
    </div>
  );
}
