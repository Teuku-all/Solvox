// Shared, short instructions shown before a chapter and beside its questions.
export const CHAPTER_GUIDE = {
  id: {
    1: {
      brief: 'Seret ubin ke kedua ruas agar timbangan seimbang. Serangan terjadi otomatis saat x ditemukan.',
      steps: ['Baca persamaan pada soal.', 'Tambah atau pindahkan ubin dengan operasi yang sama pada kedua ruas.', 'Saat variabel tinggal sendiri, serangan berjalan otomatis.'],
    },
    2: {
      brief: 'Bentuk kelompok yang sama pada kedua ruas, termasuk untuk pecahan dan desimal.',
      steps: ['Lihat berapa kelompok yang dibutuhkan.', 'Seret bagian bilangan dan variabel ke kelompok yang sesuai.', 'Selesaikan pembagian, lalu isi nilai variabel dan tekan Jawab & Serang.'],
    },
    3: {
      brief: 'Selesaikan persamaan dua langkah; terapkan setiap operasi pada kedua ruas.',
      steps: ['Hilangkan bilangan yang menempel pada suku variabel.', 'Pilih operasi berikutnya dan terapkan di kiri serta kanan.', 'Setelah variabel sendiri, karakter menyerang otomatis.'],
    },
    4: {
      brief: 'Kumpulkan variabel pada satu ruas, lalu sederhanakan dan bagi kedua ruas.',
      steps: ['Buka kurung jika ada, lalu gabungkan suku sejenis.', 'Pindahkan variabel dan bilangan dengan operasi setara di kedua ruas.', 'Gunakan kelompok pembagian bila muncul, lalu isi jawaban untuk menyerang.'],
    },
    5: {
      brief: 'Ubah cerita menjadi persamaan dengan kepingan, lalu selesaikan di timbangan.',
      steps: ['Baca cerita: tentukan apa yang diwakili x dan hubungan jumlahnya.', 'Seret kepingan ke slot persamaan sesuai urutan cerita.', 'Selesaikan persamaan pada kedua ruas, lalu isi nilai x untuk menyerang.'],
    },
  },
  en: {
    1: {
      brief: 'Drag tiles to balance both sides. Your fighter attacks automatically when x is found.',
      steps: ['Read the equation.', 'Add or move tiles using the same operation on both sides.', 'Once the variable is alone, your fighter attacks automatically.'],
    },
    2: {
      brief: 'Make equal groups on both sides, including fractions and decimals.',
      steps: ['Check how many groups are needed.', 'Drag number and variable parts into the matching groups.', 'Finish the division, enter the variable value, and press Answer & Attack.'],
    },
    3: {
      brief: 'Solve the two-step equation by applying each operation to both sides.',
      steps: ['Remove the number attached to the variable term.', 'Choose the next operation and apply it to both sides.', 'Your fighter attacks automatically when the variable is alone.'],
    },
    4: {
      brief: 'Collect variables on one side, simplify, and divide both sides.',
      steps: ['Expand brackets if needed, then combine like terms.', 'Move variables and numbers using equal operations on both sides.', 'Complete any division groups, then enter your answer to attack.'],
    },
    5: {
      brief: 'Turn the story into an equation with tiles, then solve it on the balance.',
      steps: ['Read the story: decide what x means and how the quantities relate.', 'Drag tiles into equation slots in story order.', 'Solve both sides of the equation, then enter x to attack.'],
    },
  },
};

export function getChapterGuide(levelId, lang = 'id') {
  return CHAPTER_GUIDE[lang === 'en' ? 'en' : 'id'][Number(levelId)];
}
