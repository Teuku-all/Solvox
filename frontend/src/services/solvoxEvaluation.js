/**
 * SOLVOX chapter evaluation rules.
 *
 * These messages are intentionally kept close to the source document so the
 * chapter report remains traceable to the supplied evaluation framework.
 */
const SIGN_SWITCH = [3, 4, 8, 9, 10];
const INVERSE_OPERATION = [13, 14, 15, 19];
const SIGN_RULES = [12, 16, 19, 20];
const ORDER_OF_OPERATIONS = [21, 22, 23, 25, 26, 27, 28];
const DISTRIBUTIVE = [24, 29, 30];
const GROUPING = [31, 32, 33, 34, 35, 36, 38, 40];
const MINUS_PARENTHESES = [39];
const FRACTION_CONFUSION = [37];
const CONTEXT_OVERLOAD = [41, 43, 47];
const SPECIAL_FORMULA = [44, 49];

const CHAPTER_RULES = {
  1: {
    title: 'Penjumlahan dan Pengurangan',
    master: 'Tidak ada kesalahan langkah persamaan yang tercatat pada permainan ini.',
    signSwitch: 'Kamu masih sering tertukar tanda saat memindahkan angka melewati tanda sama dengan (=). Ingat aturan emas: Positif (+) berpindah menjadi Negatif (-), dan Negatif (-) berpindah menjadi Positif (+).',
    remedial: 'Kamu masih kesulitan memisahkan angka dari variabel. Ulangi Level 1-1 sampai 1-5 dan periksa perubahan tanda pada setiap langkah.',
  },
  2: {
    title: 'Perkalian dan Pembagian',
    master: 'Semua langkah perkalian dan pembagian selesai tanpa koreksi.',
    inverse: 'Perhatikan bentuk perkalian dan pembagian! Jika variabel dibagi oleh suatu angka (misal x/a), maka untuk memindahkannya kamu harus mengalikannya, bukan menguranginya.',
    signs: 'Perhitungannya sudah hampir benar, tapi tandanya keliru! Ingat: Pembagian/perkalian dengan tanda sama menghasilkan positif (+ × + = +, - × - = +), sedangkan tanda berbeda menghasilkan negatif (+ × - = -, - × + = -).',
    remedial: 'Kamu perlu melatih kembali konsep perkalian/pembagian aljabar. Coba ingat kembali bahwa 4x artinya 4 × x, sehingga untuk mencari x angkanya harus dibagi!',
  },
  3: {
    title: 'Operasi Campuran',
    master: 'Semua langkah operasi campuran selesai tanpa koreksi.',
    order: 'Urutan langkahmu kurang tepat! Aturan Operasi Campuran: Selesaikan penjumlahan/pengurangan di luar kurung terlebih dahulu, baru lakukan perkalian/pembagian untuk melepaskan variabel.',
    distributive: 'Hati-hati saat membuka tanda kurung! Angka di depan kurung harus dikalikan ke semua suku di dalam kurung. Contoh: -2(x + 3) menjadi -2x - 6 (bukan +6).',
  },
  4: {
    title: 'Variabel di Kedua Ruas',
    master: 'Semua langkah persamaan dua ruas selesai tanpa koreksi.',
    grouping: 'Ingat, kamu hanya bisa mengoperasikan suku sejenis! Kumpulkan semua yang punya variabel x di ruas kiri, dan semua angka tanpa x di ruas kanan sebelum dihitung.',
    minusParentheses: 'Waspada dengan tanda negatif di depan kurung! Tanda minus sebelum kurung akan membalikkan semua tanda suku di dalam kurung: -(2x + 5) berubah menjadi -2x - 5.',
    fractions: 'Saat menghadapi variabel berbentuk pecahan di kedua ruas, samakan penyebutnya terlebih dahulu sebelum dikurangkan, atau kalikan seluruh ruas dengan KPK penyebutnya!',
  },
  5: {
    title: 'Soal Cerita Etnomatematika',
    master: 'Model cerita dan langkah persamaan selesai tanpa koreksi.',
    modeling: 'Kemampuan aljabarmu bagus, tapi kamu perlu mengasah pemodelan soal cerita. Tentukan dulu apa yang menjadi variabel x (hal yang ditanyakan), lalu susun persamaannya kalimat demi kalimat!',
    context: 'Jangan fokus pada panjang cerita indahnya, fokuslah pada hubungan angka-angkanya! Cari kata kunci seperti \'lebih mahal\' (+), \'potongan/diskon\' (-), \'dua kali\' (2x), atau \'diberikan\' (-/+).',
    special: 'Ingat kembali rumus dasar pendukungnya! Untuk keliling persegipanjang rumusnya adalah 2(p+l), dan untuk piring cadangan gabungkan pecahan 1/4 x + x = 5/4 x.',
  },
};


const CHAPTER_RULES_EN = {
  1: {
    title: 'Addition and Subtraction',
    master: 'No incorrect equation steps were recorded in this run.',
    signSwitch: 'You still mix up signs when moving numbers across the equals sign (=). Remember: Positive (+) becomes Negative (-), and Negative (-) becomes Positive (+).',
    remedial: 'You are still having trouble separating constants from variables. Review Chapter 1 and check each sign change.',
  },
  2: {
    title: 'Multiplication and Division',
    master: 'All multiplication and division steps were completed without corrections.',
    inverse: 'Watch the multiplication and division forms. If a variable is divided by a number (for example x/a), moving it requires multiplication, not subtraction.',
    signs: 'Your calculation is close, but the sign is wrong. Remember: matching signs give a positive result, while different signs give a negative result.',
    remedial: 'Practice algebraic multiplication and division again. Remember that 4x means 4 × x, so finding x requires division.',
  },
  3: {
    title: 'Mixed Operations',
    master: 'All mixed-operation steps were completed without corrections.',
    order: 'Your step order needs attention. Solve addition/subtraction around the variable first, then use multiplication/division to isolate it.',
    distributive: 'Be careful when opening parentheses! The number in front must be multiplied by every term inside. Example: -2(x + 3) becomes -2x - 6.',
  },
  4: {
    title: 'Variables on Both Sides',
    master: 'All equation steps with variables on both sides were completed without corrections.',
    grouping: 'Remember to combine like terms only. Put all x-terms on one side and constants on the other before calculating.',
    minusParentheses: 'Watch the negative sign before parentheses. A minus sign flips every sign inside: -(2x + 5) becomes -2x - 5.',
    fractions: 'When variables appear as fractions on both sides, use a common denominator first or multiply the whole equation by the least common multiple.',
  },
  5: {
    title: 'Ethnomathematics Story Problems',
    master: 'The story model and equation steps were completed without corrections.',
    modeling: 'Your algebra is good, but strengthen your story-problem modeling. First identify what x represents, then build the equation step by step.',
    context: 'Do not get distracted by the length of the story. Focus on the relationships between the numbers. Look for clues such as “more expensive,” “discount,” “twice,” or “given away.”',
    special: 'Review the supporting formulas. For a rectangle, the perimeter formula is 2(p+l), and for the spare-plate problem combine 1/4x + x = 5/4x.',
  },
};

const CATEGORY_TITLES = {
  id: {
    master: 'Master',
    signSwitch: 'Perubahan Tanda',
    inverseOperation: 'Operasi Invers',
    signRules: 'Aturan Tanda',
    order: 'Urutan Operasi',
    distributive: 'Sifat Distributif',
    minusParentheses: 'Tanda Minus pada Kurung',
    fraction: 'Kebingungan Pecahan',
    grouping: 'Mengelompokkan Suku Sejenis',
    special: 'Kesalahan Rumus Khusus',
    context: 'Beban Informasi Soal Cerita',
    modeling: 'Pemodelan Matematika',
    remedial: 'Perlu Penguatan',
  },
  en: {
    master: 'Master',
    signSwitch: 'Sign Switch',
    inverseOperation: 'Inverse Operation',
    signRules: 'Sign Rules',
    order: 'Order of Operations',
    distributive: 'Distributive Property',
    minusParentheses: 'Minus Parentheses',
    fraction: 'Fraction Confusion',
    grouping: 'Grouping Like Terms',
    special: 'Special Formula',
    context: 'Story Context Overload',
    modeling: 'Mathematical Modeling',
    remedial: 'Needs Reinforcement',
  }
};

const idsOf = (logs, predicate) => logs.filter(predicate).map((log) => Number(log.questionId ?? log.idx + 1));
const hits = (ids, set) => ids.some((id) => set.includes(id));

export function evaluateSolvoxChapter(result = {}) {
  const chapterId = Number(result.chapterId);
  const lang = result.lang === 'en' ? 'en' : 'id';
  const rules = (lang === 'en' ? CHAPTER_RULES_EN : CHAPTER_RULES)[chapterId];
  if (!rules) return { category: 'unknown', title: '', message: '', source: 'Solvox learning rules' };

  const logs = Array.isArray(result.questionLogs) ? result.questionLogs : [];
  const total = Math.max(1, Number(result.totalQuestions) || 10);
  const answered = logs.length;
  const correct = logs.filter((item) => item.correct).length;
  const accuracy = Math.round((correct / total) * 100);
  const wrongIds = idsOf(logs, (item) => !item.correct || Number(item.wrongAttempts) > 0 || Number(item.simulation?.stepErrors) > 0 || Number(item.simulation?.modelErrors) > 0);
  const modelErrors = logs.reduce((sum, item) => sum + (Number(item.simulation?.modelErrors) || 0), 0);

  if (chapterId === 1) {
    const stepsCompleted = logs.reduce((sum, item) => sum + (Number(item.simulation?.stepsCompleted) || 0), 0);
    const stepsTotal = logs.reduce((sum, item) => sum + (Number(item.simulation?.stepsTotal) || 0), 0);
    const stepErrors = logs.reduce((sum, item) => sum + (Number(item.simulation?.stepErrors) || 0), 0);
    if (stepsTotal > 0 && stepsCompleted >= stepsTotal && stepErrors === 0 && answered >= total) {
      return { category: 'master', title: CATEGORY_TITLES[lang].master, message: rules.master, source: 'Solvox learning rules' };
    }
    const message = lang === 'en'
      ? (stepErrors > 0
        ? `${stepErrors} equation step correction(s) were needed. Review how the same operation is applied to both sides of an equation.`
        : `You completed ${stepsCompleted} of ${stepsTotal} equation steps. Finish the remaining simulations to complete this chapter.`)
      : (stepErrors > 0
        ? `Ada ${stepErrors} koreksi langkah persamaan. Tinjau kembali cara menerapkan operasi yang sama pada kedua ruas.`
        : `Kamu menyelesaikan ${stepsCompleted} dari ${stepsTotal} langkah persamaan. Selesaikan simulasi yang tersisa untuk menuntaskan chapter ini.`);
    return { category: stepErrors > 0 ? 'simulation-review' : 'simulation-progress', title: lang === 'en' ? (stepErrors > 0 ? 'Review equation steps' : 'Simulation progress') : (stepErrors > 0 ? 'Tinjau langkah persamaan' : 'Progres simulasi'), message, source: 'Solvox learning rules' };
  }

  if (wrongIds.length === 0 && accuracy === 100) {
    return { category: 'master', title: CATEGORY_TITLES[lang].master, message: rules.master, source: 'Solvox learning rules' };
  }

  if (chapterId === 5 && modelErrors > 0) {
    return { category: 'mathematical-modeling', title: CATEGORY_TITLES[lang].modeling, message: rules.modeling, source: 'Solvox learning rules' };
  }

  if (chapterId === 1 && hits(wrongIds, SIGN_SWITCH)) {
    return { category: 'sign-switch', title: CATEGORY_TITLES[lang].signSwitch, message: rules.signSwitch, source: 'Solvox learning rules' };
  }
  if (chapterId === 2 && hits(wrongIds, INVERSE_OPERATION)) {
    return { category: 'inverse-operation', title: CATEGORY_TITLES[lang].inverseOperation, message: rules.inverse, source: 'Solvox learning rules' };
  }
  if (chapterId === 2 && hits(wrongIds, SIGN_RULES)) {
    return { category: 'sign-rules', title: CATEGORY_TITLES[lang].signRules, message: rules.signs, source: 'Solvox learning rules' };
  }
  if (chapterId === 3 && hits(wrongIds, ORDER_OF_OPERATIONS)) {
    return { category: 'order-of-operations', title: CATEGORY_TITLES[lang].order, message: rules.order, source: 'Solvox learning rules' };
  }
  if (chapterId === 3 && hits(wrongIds, DISTRIBUTIVE)) {
    return { category: 'distributive-property', title: CATEGORY_TITLES[lang].distributive, message: rules.distributive, source: 'Solvox learning rules' };
  }
  if (chapterId === 4 && hits(wrongIds, MINUS_PARENTHESES)) {
    return { category: 'minus-parentheses', title: CATEGORY_TITLES[lang].minusParentheses, message: rules.minusParentheses, source: 'Solvox learning rules' };
  }
  if (chapterId === 4 && hits(wrongIds, FRACTION_CONFUSION)) {
    return { category: 'fraction-confusion', title: CATEGORY_TITLES[lang].fraction, message: rules.fractions, source: 'Solvox learning rules' };
  }
  if (chapterId === 4 && hits(wrongIds, GROUPING)) {
    return { category: 'grouping-like-terms', title: CATEGORY_TITLES[lang].grouping, message: rules.grouping, source: 'Solvox learning rules' };
  }
  if (chapterId === 5 && hits(wrongIds, SPECIAL_FORMULA)) {
    return { category: 'special-formula', title: CATEGORY_TITLES[lang].special, message: rules.special, source: 'Solvox learning rules' };
  }
  if (chapterId === 5 && hits(wrongIds, CONTEXT_OVERLOAD)) {
    return { category: 'context-overload', title: CATEGORY_TITLES[lang].context, message: rules.context, source: 'Solvox learning rules' };
  }
  if (chapterId === 5 && accuracy < 80) {
    return { category: 'mathematical-modeling', title: CATEGORY_TITLES[lang].modeling, message: rules.modeling, source: 'Solvox learning rules' };
  }
  if (accuracy < 60 && wrongIds.length > 0) {
    return { category: 'remedial', title: CATEGORY_TITLES[lang].remedial, message: rules.remedial || (lang === 'en' ? 'Review the questions answered incorrectly and check the relevant operation and sign rules.' : 'Ulangi soal yang masih salah dan periksa kembali aturan operasi serta tandanya.'), source: 'Solvox learning rules' };
  }

  return {
    category: result.won ? 'progress' : 'review',
    title: result.won ? (lang === 'en' ? 'Keep Improving' : 'Terus Berkembang') : (lang === 'en' ? 'Review Needed' : 'Perlu Ditinjau'),
    message: result.won ? (lang === 'en' ? 'Review any corrected simulation steps before the next chapter.' : 'Tinjau langkah simulasi yang sempat dikoreksi sebelum melanjutkan chapter.') : (lang === 'en' ? 'Review the unfinished simulation steps and check each operation on both sides.' : 'Tinjau langkah simulasi yang belum selesai dan periksa operasi pada kedua ruas.'),
    source: 'Solvox learning rules'
  };
}

export { CHAPTER_RULES };
