import { apiJson } from './api';

export async function loadChapterQuestions(chapterId, lang = 'id') {
  const result = await apiJson('/api/single-player/questions', {
    method: 'POST',
    body: JSON.stringify({ chapterId: Number(chapterId), lang: lang === 'en' ? 'en' : 'id', count: 10 }),
  });
  if (!Array.isArray(result.questions) || result.questions.length !== 10) {
    throw new Error('Bank soal chapter tidak tersedia lengkap.');
  }
  return result.questions;
}

export function validateChapterAnswer(questionId, answer, attempt, lang = 'id') {
  return apiJson('/api/single-player/answer', {
    method: 'POST',
    body: JSON.stringify({ questionId: Number(questionId), answer: String(answer), attempt, lang: lang === 'en' ? 'en' : 'id' }),
  });
}
