const questionsByLanguage = {
  id: require('./solvoxQuestions.json'),
  en: require('./solvoxQuestions.en.json'),
};
const feedbackByLanguage = {
  id: require('./feedbackBank.id.json'),
  en: require('./feedbackBank.en.json'),
};

const FALLBACK_FEEDBACK = {
  id: [
    'Coba periksa kembali langkah pengerjaanmu. Apakah ada operasi atau perhitungan yang keliru?',
    'Belum tepat. Masukkan jawabanmu ke persamaan dan periksa kembali kedua ruasnya.',
    'Jawaban masih belum tepat. Lihat pembahasan soal ini sebelum melanjutkan.',
  ],
  en: [
    'Check your solution again. Is there an operation or calculation that is incorrect?',
    'Not quite. Substitute your answer into the equation and check both sides.',
    'That answer is still incorrect. Review the solution before continuing.',
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
  const dots = token.includes('.'); const commas = token.includes(',');
  if (dots && commas) token = token.lastIndexOf('.') > token.lastIndexOf(',') ? token.replace(/,/g, '') : token.replace(/\./g, '').replace(',', '.');
  else if (commas && /^[+-]?\d{1,3}(?:,\d{3})+$/.test(token)) token = token.replace(/,/g, '');
  else if (commas) token = token.replace(',', '.');
  else if (dots && /^[+-]?\d{1,3}(?:\.\d{3})+$/.test(token)) token = token.replace(/\./g, '');
  else if ((token.match(/\./g) || []).length > 1) return null;
  const number = Number(token);
  return Number.isFinite(number) ? number : null;
}

function isSameAnswer(a, b) {
  if (Array.isArray(b)) return b.some(option => isSameAnswer(a, option));
  const left = normalizeAnswer(a); const right = normalizeAnswer(b);
  if (left === right) return true;
  const ln = parseNumber(left); const rn = parseNumber(right);
  return Number.isFinite(ln) && Number.isFinite(rn) && Math.abs(ln - rn) < 1e-7;
}

function feedbackMatch(questionId, answer, lang) {
  const numeric = parseNumber(answer);
  const normalized = numeric == null ? normalizeAnswer(answer) : `num:${Math.round(numeric * 1e6) / 1e6}`;
  const rows = feedbackByLanguage[lang].filter(row => Number(row.id) === Number(questionId));
  for (const row of rows) {
    const variants = String(row.wrongAnswers || '').split(/\s+(?:atau|or)\s+/i);
    for (const variant of variants) {
      const number = parseNumber(variant);
      const candidate = number == null ? `text:${normalizeAnswer(variant)}` : `num:${Math.round(number * 1e6) / 1e6}`;
      if (candidate === normalized) return { id: row.id, code: row.code, errorType: row.errorType, feedback: row.feedback };
    }
  }
  return null;
}

function getChapterQuestions(chapterId, lang = 'id', count = 10) {
  const id = Number(chapterId);
  if (!Number.isInteger(id) || !questionsByLanguage.id.some(question => question.chapterId === id)) return null;
  const source = questionsByLanguage[lang === 'en' ? 'en' : 'id'];
  return source.filter(question => question.chapterId === id).slice(0, Math.max(1, Math.min(20, Number(count) || 10)))
    .map(({ answer, source: _source, ...question }) => question);
}

function evaluateAttempt({ questionId, answer, attempt = 1, lang = 'id' }) {
  const locale = lang === 'en' ? 'en' : 'id';
  const id = Number(questionId);
  const question = questionsByLanguage[locale].find(item => item.id === id);
  if (!question || typeof answer !== 'string' || answer.length > 160) return null;
  const correct = isSameAnswer(answer, question.answer);
  const safeAttempt = Math.max(1, Math.min(3, Math.trunc(Number(attempt) || 1)));
  const match = correct ? null : feedbackMatch(id, answer, locale);
  const result = {
    correct,
    feedback: correct ? question.feedback : match?.feedback || FALLBACK_FEEDBACK[locale][safeAttempt - 1],
    feedbackBankMatched: Boolean(match),
    feedbackBankCode: match?.code || null,
    feedbackBankRow: match?.id || null,
    errorType: match?.errorType || question.errorTag,
  };
  if (correct || safeAttempt >= 3) result.correctAnswer = question.answer;
  return result;
}

module.exports = { getChapterQuestions, evaluateAttempt, isSameAnswer };
