const express = require('express');
const game = require('../singlePlayerGame');

const router = express.Router();

router.post('/questions', (req, res) => {
  const chapterId = Number(req.body?.chapterId);
  const lang = req.body?.lang === 'en' ? 'en' : 'id';
  const questions = game.getChapterQuestions(chapterId, lang, req.body?.count);
  if (!questions) return res.status(400).json({ ok: false, message: 'Chapter tidak valid' });
  res.json({ ok: true, chapterId, lang, totalQuestions: questions.length, questions });
});

router.post('/answer', (req, res) => {
  const result = game.evaluateAttempt({
    questionId: req.body?.questionId,
    answer: req.body?.answer,
    attempt: req.body?.attempt,
    lang: req.body?.lang,
  });
  if (!result) return res.status(400).json({ ok: false, message: 'Soal atau jawaban tidak valid' });
  res.json({ ok: true, ...result });
});

module.exports = router;
