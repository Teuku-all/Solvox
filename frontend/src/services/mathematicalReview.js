import { SIMULATIONS, operationLabel } from '../data/algebraSimulation';

const FOCUS = {
  id: {
    1: 'Kesetaraan kedua ruas, operasi kebalikan tambah/kurang, serta tanda bilangan negatif dan pecahan.',
    2: 'Koefisien variabel, pembagian menjadi kelompok sama besar, kebalikan pecahan, serta aturan tanda perkalian/pembagian.',
    3: 'Urutan operasi invers, distribusi ke setiap suku dalam kurung, dan isolasi variabel dengan koefisien negatif atau pecahan.',
    4: 'Pengumpulan suku sejenis dari kedua ruas, distribusi tanda minus, dan penghilangan koefisien pecahan.',
    5: 'Makna variabel, hubungan antarbesaran, tanda kurung pada model cerita, serta satuan dan pemeriksaan jawaban dalam konteks.',
  },
  en: {
    1: 'Equality on both sides, inverse addition/subtraction, and signs of negative numbers and fractions.',
    2: 'Variable coefficients, division into equal groups, reciprocal fractions, and multiplication/division sign rules.',
    3: 'Inverse-operation order, distribution to every term in parentheses, and isolating variables with negative or fractional coefficients.',
    4: 'Collecting like terms from both sides, distributing a minus sign, and removing fractional coefficients.',
    5: 'Variable meaning, relationships between quantities, parentheses in a story model, units, and checking the answer in context.',
  },
};

export function getChapterMathFocus(chapterId, lang = 'id') {
  return FOCUS[lang === 'en' ? 'en' : 'id'][Number(chapterId)] || '';
}

function conceptFor(kind, chapterId, en) {
  if (kind.includes('parentheses') || kind.includes('like-term')) return en
    ? 'Distribute the outside factor, including its sign, to every term: −2(x + 3) = −2x − 6.'
    : 'Distribusikan faktor beserta tandanya ke setiap suku: −2(x + 3) = −2x − 6.';
  if (kind.includes('fraction')) return en
    ? 'Use equal fraction parts and preserve the sign. For (2/3)y = 12, one third is 6, so y = 18; equivalently multiply both sides by 3/2.'
    : 'Gunakan bagian pecahan yang sama besar dan pertahankan tandanya. Pada (2/3)y = 12, sepertiga y bernilai 6, jadi y = 18; setara dengan mengalikan kedua ruas dengan 3/2.';
  if (kind.includes('group') || kind === 'chapter2-wrong-side') return en
    ? 'Divide both sides into the same number of equal groups: 4x = 28 gives x = 28 ÷ 4 = 7. A negative coefficient also requires the sign rule: −3y = 21 gives y = −7.'
    : 'Bagi kedua ruas menjadi jumlah kelompok sama besar yang sama: 4x = 28 memberi x = 28 ÷ 4 = 7. Untuk koefisien negatif, sertakan aturan tanda: −3y = 21 memberi y = −7.';
  if (kind === 'incorrect-tile-transfer' || kind === 'unbalanced-tile-operation') return en
    ? 'Check the inverse value and its sign: cancel +a with −a and −a with +a on both sides. Adding number tiles cannot cancel a multiplying or dividing coefficient.'
    : 'Periksa nilai invers dan tandanya: hilangkan +a dengan −a dan −a dengan +a pada kedua ruas. Penambahan ubin bilangan tidak dapat menghilangkan koefisien pengali atau pembagi.';
  if (kind === 'sign-changed-without-operation') return en
    ? 'A sign changes through a valid operation. For x − 9 = 4, add 9 to both sides to obtain x = 13.'
    : 'Tanda berubah melalui operasi yang sah. Pada x − 9 = 4, tambahkan 9 pada kedua ruas agar x = 13.';
  if (kind === 'one-side-only-operation' || kind === 'different-operation-on-each-side') return en
    ? 'Preserve equality by applying the same operation and value to both sides. Finish the matching side before starting another operation.'
    : 'Pertahankan kesetaraan dengan operasi dan nilai yang sama pada kedua ruas. Selesaikan pasangan operasi sebelum memulai operasi berikutnya.';
  if (chapterId === 4) return en
    ? 'Collect like variable terms with an equivalent operation on both sides, remove the constant, then divide by the remaining coefficient.'
    : 'Kumpulkan suku variabel sejenis dengan operasi setara pada kedua ruas, hilangkan konstanta, lalu bagi dengan koefisien yang tersisa.';
  return en
    ? 'Choose the inverse operation in the required order. Undo addition with subtraction, and multiplication with division; keep the divisor’s sign.'
    : 'Pilih operasi invers sesuai urutan. Batalkan penjumlahan dengan pengurangan, dan perkalian dengan pembagian; pertahankan tanda pembaginya.';
}

export function getMathematicalReview(result = {}, lang = 'id') {
  const en = lang === 'en';
  const chapterId = Number(result.chapterId);
  const logs = Array.isArray(result.questionLogs) ? result.questionLogs : [];
  const advice = [];
  const seen = new Set();
  for (const log of logs) {
    const questionId = Number(log.questionId ?? ((chapterId - 1) * 10 + (Number(log.idx) || 0) + 1));
    const simulation = log.simulation || {};
    if (simulation.modelErrors > 0 && !seen.has('model')) {
      seen.add('model');
      advice.push(en
        ? 'Define x as the requested quantity and distinguish a total discount from a discount per item: 3x − 20,000 differs from 3(x − 20,000). Check the result with the original units and total.'
        : 'Tetapkan x sebagai besaran yang ditanyakan dan bedakan potongan total dengan potongan per barang: 3x − 20.000 berbeda dengan 3(x − 20.000). Cek hasil memakai satuan dan total pada cerita.');
    }
    for (const error of Array.isArray(simulation.stepErrorHistory) ? simulation.stepErrorHistory : []) {
      const key = `${error.kind}:${error.operation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const route = SIMULATIONS[questionId];
      const stepIndex = Math.max(0, Number(error.step || 1) - 1);
      const step = route?.steps[stepIndex];
      const before = error.equation || (stepIndex ? route?.steps[stepIndex - 1]?.after : route?.equation);
      const example = step ? ` ${en ? 'Question' : 'Soal'} ${((questionId - 1) % 10) + 1}: ${before}. ${operationLabel(step.operation, lang)} → ${step.after}.` : '';
      advice.push(conceptFor(error.kind || '', chapterId, en) + example);
    }
  }
  if (!advice.length) {
    const errors = logs.reduce((sum, log) => sum + (Number(log.simulation?.stepErrors) || 0), 0);
    advice.push((en ? (errors ? 'Review these mathematical skills: ' : 'Mathematical focus: ') : (errors ? 'Tinjau kembali kemampuan matematika berikut: ' : 'Fokus matematika: ')) + getChapterMathFocus(chapterId, lang));
  }
  return advice.slice(0, 3);
}
