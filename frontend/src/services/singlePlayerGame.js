import questionsId from '../../../backend/solvoxQuestions.json';
import questionsEn from '../../../backend/solvoxQuestions.en.json';
import feedbackId from '../../../backend/feedbackBank.id.json';
import feedbackEn from '../../../backend/feedbackBank.en.json';

// Single player uses the same source files as the server so a static deployment
// can load chapters and check answers without a running /api endpoint.
const questionsByLanguage = { id: questionsId, en: questionsEn };
const feedbackByLanguage = { id: feedbackId, en: feedbackEn };

const fallbackFeedback = {
  id: [
    'Coba periksa kembali langkah pengerjaanmu. Apakah ada operasi atau perhitungan yang keliru?',
    'Belum tepat. Masukkan jawabanmu ke persamaan dan periksa kembali kedua ruasnya.',
    'Jawaban masih belum tepat. Periksa kembali persamaan atau gunakan hint, lalu coba lagi.',
  ],
  en: [
    'Check your solution again. Is there an operation or calculation that is incorrect?',
    'Not quite. Substitute your answer into the equation and check both sides.',
    'That answer is still incorrect. Check the equation or use a hint, then try again.',
  ],
};

function normalizeAnswer(value) {
  return String(value ?? '').toLowerCase().normalize('NFKC')
    .replace(/[\u00d7\u00b7]/g, '*').replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/\u00b2/g, '^2').replace(/\u00b3/g, '^3')
    .replace(/^\s*(?:(?:jawaban|answer|ans)\s*[:=]\s*|[a-z]\s*=\s*)/i, '')
    .replace(/\s+/g, '').trim();
}

function parseNumber(raw) {
  let token = String(raw ?? '').trim().toLowerCase().normalize('NFKC')
    .replace(/^\s*(?:(?:jawaban|answer|ans)\s*[:=]\s*|[a-z]\s*=\s*)/i, '')
    .replace(/rp\.?\s*/g, '').replace(/\s+/g, '');
  const wrapped = token.match(/^\((.*)\)$/);
  if (wrapped) token = wrapped[1];
  if (!token) return null;
  if (/^[+-]?\d+(?:[.,]\d+)?\/[+-]?\d+(?:[.,]\d+)?$/.test(token)) {
    const [numerator, denominator] = token.split('/').map(parseNumber);
    return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0
      ? numerator / denominator : null;
  }
  if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(token) && !/^[+-]?\d{1,3}(?:[.,]\d{3})+$/.test(token)) return null;
  const dots = token.includes('.');
  const commas = token.includes(',');
  if (dots && commas) token = token.lastIndexOf('.') > token.lastIndexOf(',')
    ? token.replace(/,/g, '') : token.replace(/\./g, '').replace(',', '.');
  else if (commas && /^[+-]?\d{1,3}(?:,\d{3})+$/.test(token)) token = token.replace(/,/g, '');
  else if (commas) token = token.replace(',', '.');
  else if (dots && /^[+-]?\d{1,3}(?:\.\d{3})+$/.test(token)) token = token.replace(/\./g, '');
  else if ((token.match(/\./g) || []).length > 1) return null;
  const number = Number(token);
  return Number.isFinite(number) ? number : null;
}

function isSameAnswer(answer, expected) {
  if (Array.isArray(expected)) return expected.some((option) => isSameAnswer(answer, option));
  const left = normalizeAnswer(answer);
  const right = normalizeAnswer(expected);
  if (left === right) return true;
  const leftNumber = parseNumber(left);
  const rightNumber = parseNumber(right);
  return Number.isFinite(leftNumber) && Number.isFinite(rightNumber)
    && Math.abs(leftNumber - rightNumber) < 1e-7;
}

function feedbackMatch(questionId, answer, lang) {
  const numeric = parseNumber(answer);
  const normalized = numeric == null ? normalizeAnswer(answer) : `num:${Math.round(numeric * 1e6) / 1e6}`;
  const rows = feedbackByLanguage[lang].filter((row) => Number(row.id) === Number(questionId));
  for (const row of rows) {
    const variants = String(row.wrongAnswers || '').split(/\s+(?:atau|or)\s+/i);
    for (const variant of variants) {
      const number = parseNumber(variant);
      const candidate = number == null
        ? `text:${normalizeAnswer(variant)}` : `num:${Math.round(number * 1e6) / 1e6}`;
      if (candidate === normalized) {
        return { id: row.id, code: row.code, errorType: row.errorType, feedback: row.feedback };
      }
    }
  }
  return null;
}

export async function loadChapterQuestions(chapterId, lang = 'id') {
  const locale = lang === 'en' ? 'en' : 'id';
  const id = Number(chapterId);
  const questions = questionsByLanguage[locale]
    .filter((question) => question.chapterId === id)
    .slice(0, 10)
    .map(({ answer, source, ...question }) => question);
  if (!Number.isInteger(id) || questions.length !== 10) {
    throw new Error(locale === 'en' ? 'The chapter question bank is incomplete.' : 'Bank soal chapter tidak tersedia lengkap.');
  }
  return questions;
}

export async function validateChapterAnswer(questionId, answer, attempt, lang = 'id') {
  const locale = lang === 'en' ? 'en' : 'id';
  const question = questionsByLanguage[locale].find((item) => item.id === Number(questionId));
  const submittedAnswer = String(answer);
  if (!question || submittedAnswer.length > 160) {
    throw new Error(locale === 'en' ? 'Invalid question or answer.' : 'Soal atau jawaban tidak valid.');
  }

  const correct = isSameAnswer(submittedAnswer, question.answer);
  // Attempts are unlimited. Only cap the feedback index so later mistakes
  // continue using the final retry message without revealing the answer.
  const safeAttempt = Math.max(1, Math.min(3, Math.trunc(Number(attempt) || 1)));
  const match = correct ? null : feedbackMatch(question.id, submittedAnswer, locale);
  const result = {
    correct,
    feedback: correct ? question.feedback : match?.feedback || fallbackFeedback[locale][safeAttempt - 1],
    feedbackBankMatched: Boolean(match),
    feedbackBankCode: match?.code || null,
    feedbackBankRow: match?.id || null,
    errorType: match?.errorType || question.errorTag,
  };
  if (correct) result.correctAnswer = question.answer;
  return result;
}
