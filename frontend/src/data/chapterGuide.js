// Shared, short instructions shown before a chapter and beside its questions.
export const CHAPTER_GUIDE = {
  id: {
    1: {
      brief: 'Gunakan ubin untuk menjaga kedua ruas tetap setara. Materi mencakup bilangan positif, negatif, desimal, pecahan, dan persamaan dengan variabel di kiri atau kanan.',
      steps: ['Baca bentuk persamaan dan kenali suku variabel, bilangan, tanda, serta posisi ruasnya.', 'Untuk menghilangkan bilangan, gunakan operasi kebalikan: + menjadi − dan − menjadi +. Terapkan nilai yang sama pada kedua ruas.', 'Untuk desimal, pisahkan bilangan menjadi ubin satuan dan pecahan desimal. Contoh p − 6,5 = 3,5: ubin pada persamaan mewakili −1 enam kali dan −0,5 di kiri, serta +1 tiga kali dan +0,5 di kanan.', 'Untuk pecahan seperti 1/2, gunakan ubin pecahan yang sesuai. Periksa kembali tanda dan hasil operasi sebelum memastikan nilai variabel.', 'Jika variabel berada di ruas kanan, pertahankan kesetaraan saat memindahkan atau menambahkan ubin. Jangan mengubah tanda tanpa melakukan operasi yang sah.', 'Jika langkah tidak menjaga kesetaraan, monster menyerang dan HP berkurang. Gunakan Urungkan bila tersedia, lalu ulangi langkah dengan operasi yang sama pada kedua ruas.', 'Setelah variabel berdiri sendiri dan nilainya benar, simulasi selesai dan karakter menyerang otomatis.'],
    },
    2: {
      brief: 'Gunakan kelompok setara dan operasi kebalikan untuk persamaan perkalian, pembagian, tanda negatif, desimal, dan pecahan.',
      steps: ['Kenali koefisien atau pembagi yang melekat pada variabel.', 'Untuk ax = b, bagi kedua ruas dengan a. Untuk x/a = b, kalikan kedua ruas dengan a.', 'Pertahankan tanda: membagi atau mengalikan dengan bilangan negatif dapat mengubah tanda hasil.', 'Untuk koefisien desimal atau pecahan, gunakan nilai kebalikan yang sesuai dan sederhanakan dengan teliti.', 'Bentuk kelompok sama banyak pada kedua ruas bila simulasi memintanya. Pastikan tiap kelompok bernilai sama.', 'Jika memilih operasi atau kelompok yang keliru, periksa kembali operasi kebalikan dan nilai setiap kelompok. Setelah simulasi selesai, karakter menyerang otomatis.'],
    },
    3: {
      brief: 'Selesaikan persamaan bertahap dengan operasi campuran, koefisien, dan tanda kurung.',
      steps: ['Ikuti langkah yang ditampilkan: sederhanakan atau buka kurung terlebih dahulu bila diperlukan.', 'Saat membuka kurung, kalikan faktor di luar kurung dengan setiap suku di dalamnya. Tanda negatif di depan kurung berlaku untuk semua suku.', 'Gabungkan hanya suku sejenis, lalu hilangkan bilangan di samping variabel dengan operasi kebalikan pada kedua ruas.', 'Jika variabel memiliki koefisien, bagi kedua ruas dengan koefisien tersebut. Perhatikan koefisien negatif dan pecahan.', 'Jika langkah atau operasi tidak cocok, tinjau kembali distribusi tanda dan urutan operasi. Setelah variabel sendiri, karakter menyerang otomatis.'],
    },
    4: {
      brief: 'Kelompokkan variabel dan konstanta pada ruas berbeda, termasuk persamaan dengan kurung dan pecahan.',
      steps: ['Buka setiap tanda kurung dengan mengalikan faktor ke semua suku. Tanda minus di depan kurung membalik tanda seluruh suku di dalamnya.', 'Gabungkan suku sejenis saja. Pindahkan suku variabel dengan operasi yang sama pada kedua ruas.', 'Pindahkan konstanta menggunakan operasi kebalikan dan pertahankan kesetaraan.', 'Jika ada pecahan, samakan penyebut atau kalikan seluruh persamaan dengan faktor yang menghilangkan penyebut; jangan hanya mengalikan satu suku.', 'Setelah semua variabel terkumpul di satu ruas dan konstanta di ruas lain, sederhanakan lalu bagi dengan koefisien variabel.', 'Gunakan langkah sebelumnya bila pengelompokan atau tanda perlu diperbaiki. Karakter menyerang setelah simulasi selesai.'],
    },
    5: {
      brief: 'Ubah informasi cerita menjadi model aljabar, susun persamaan dengan kepingan, lalu selesaikan.',
      steps: ['Tentukan besaran yang ditanyakan dan tetapkan sebagai variabel. Jangan tertukar antara nilai satu benda dan nilai total beberapa benda.', 'Terjemahkan kata hubungan dengan cermat: selisih, diskon, pemberian, atau pengurangan mengikuti konteks; beberapa kelompok membentuk koefisien.', 'Untuk kuantitas berkelompok, bedakan x + 15 dari beberapa salinan (x + 15). Gunakan tanda kurung bila operasi berlaku pada seluruh kelompok.', 'Susun kepingan dari kiri ke kanan sesuai cerita. Kepingan tambahan adalah pengecoh dan tidak harus digunakan.', 'Periksa bahwa kedua ruas menyatakan jumlah yang dibandingkan atau total yang sama dengan cerita.', 'Selesaikan persamaan dengan langkah yang sama pada kedua ruas. Tinjau pemodelan bila variabel, relasi, atau persamaan tidak cocok; karakter menyerang setelah simulasi selesai.'],
    },
  },
  en: {
    1: {
      brief: 'Use tiles to keep both sides equivalent. Topics include positive and negative numbers, decimals, fractions, and variables on either side.',
      steps: ['Read the equation and identify the variable, constants, signs, and which side each term is on.', 'Use inverse operations to remove constants: + becomes − and − becomes +. Apply the same value to both sides.', 'For decimals, represent the value with unit and decimal tiles. For p − 6.5 = 3.5, the left side is −1 six times and −0.5; the right side is +1 three times and +0.5.', 'For fractions such as 1/2, use the matching fraction tile. Check the sign and calculation before confirming the variable value.', 'If the variable is on the right, preserve equality while moving or adding tiles. Never change a sign without a valid operation.', 'An invalid step that breaks equality makes the monster attack and reduces HP. Undo if available, then apply the same operation to both sides.', 'Once the variable stands alone and its value is correct, the simulation completes and your fighter attacks automatically.'],
    },
    2: {
      brief: 'Use equal groups and inverse operations for multiplication, division, negative values, decimals, and fractions.',
      steps: ['Identify the coefficient or divisor attached to the variable.', 'For ax = b, divide both sides by a. For x/a = b, multiply both sides by a.', 'Track signs carefully: multiplying or dividing by a negative value can change the result sign.', 'For decimal or fraction coefficients, use the matching inverse value and simplify carefully.', 'Build equal groups on both sides when the simulation asks for them. Check that every group has the same value.', 'If an operation or group is incorrect, review the inverse operation and each group value. Your fighter attacks when the simulation is complete.'],
    },
    3: {
      brief: 'Solve equations in stages, including mixed operations, coefficients, and parentheses.',
      steps: ['Follow the displayed sequence: simplify or expand parentheses first when needed.', 'When expanding parentheses, multiply the outside factor by every term inside. A negative factor applies to every term.', 'Combine like terms only, then remove constants with inverse operations on both sides.', 'If the variable has a coefficient, divide both sides by it. Watch negative and fractional coefficients.', 'If an operation or step is incorrect, review distribution signs and operation order. Your fighter attacks once the variable is isolated.'],
    },
    4: {
      brief: 'Group variables and constants on separate sides, including equations with parentheses and fractions.',
      steps: ['Expand every parenthesis by multiplying its outside factor by each term. A minus sign before parentheses flips every sign inside.', 'Combine like terms only. Move variable terms using the same operation on both sides.', 'Move constants with inverse operations while preserving equality.', 'For fractions, use a common denominator or multiply the entire equation by a factor that clears denominators; do not multiply only one term.', 'Once variables are on one side and constants on the other, simplify and divide by the variable coefficient.', 'Use the previous-step control to correct grouping or signs. Your fighter attacks after the simulation is complete.'],
    },
    5: {
      brief: 'Translate story information into an algebraic model, assemble it with tiles, and solve it.',
      steps: ['Identify the requested quantity and define it as the variable. Distinguish the value of one item from a total for several items.', 'Translate relationships carefully: a difference or discount subtracts as described; transfers depend on who gives and receives; repeated groups create a coefficient.', 'For grouped quantities, distinguish x + 15 from several copies of (x + 15). Use parentheses when an operation applies to the whole group.', 'Place equation tiles from left to right to match the story. Extra tiles are distractors and may remain unused.', 'Check that both sides represent the quantities or total stated in the story.', 'Solve with equivalent operations on both sides. Revisit the variable, relationship, or equation if the model does not match the story; your fighter attacks when the simulation is complete.'],
    },
  },
};

export function getChapterGuide(levelId, lang = 'id') {
  return CHAPTER_GUIDE[lang === 'en' ? 'en' : 'id'][Number(levelId)];
}
