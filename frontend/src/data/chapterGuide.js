// Chapter instructions mirror the controls and learning steps used in battle.
export const CHAPTER_GUIDE = {
  id: {
    1: {
      brief: 'Gunakan ubin pada timbangan untuk mengisolasi variabel dengan operasi invers.',
      steps: [
        'Baca persamaan pada timbangan. Kenali variabel, bilangan, tanda, dan ruas tempat setiap suku berada.',
        'Pilih ubin yang sesuai untuk menambah atau menyeimbangkan ruas. Gunakan operasi kebalikan untuk menghilangkan bilangan di samping variabel.',
        'Seret ubin ke ruas yang diperlukan. Ubin bernilai berlawanan pada ruas yang sama saling menghapus, misalnya +1 dan −1.',
        'Jaga tanda dan nilai ubin. Jangan mengubah tanda suku tanpa melakukan langkah yang setara pada persamaan.',
        'Kalau salah memilih atau memindahkan ubin, monster bisa menyerang dan HP-mu berkurang. Gunakan tombol Langkah Sebelumnya untuk membatalkan jika tersedia. Setelah variabel berdiri sendiri, simulasi selesai dan karaktermu menyerang otomatis.',
      ],
    },
    2: {
      brief: 'Gunakan kelompok setara, potongan pecahan, dan operasi kebalikan untuk mengisolasi variabel.',
      steps: [
        'Periksa apakah variabel dikalikan koefisien, dibagi suatu bilangan, atau memiliki koefisien pecahan/desimal.',
        'Pada soal pembagian berkelompok, buat jumlah kelompok yang diminta pada kedua ruas, masukkan ubin ke kelompok, lalu cocokkan kelompok yang bersesuaian.',
        'Pada soal koefisien pecahan, ikuti bengkel pecahan: bagi bentuk menjadi bagian sama besar, pasangkan bagian pada kedua ruas, lalu susun bagian yang mewakili satu variabel.',
        'Pada soal lainnya, pilih operasi kebalikan dari pilihan yang tersedia. Terapkan pilihan operasi yang sama ke ruas kiri dan kanan dengan meletakkan kontrol operasi pada masing-masing ruas.',
        'Pertahankan tanda negatif dan nilai koefisien. Untuk ax = b, gunakan pembagian kedua ruas dengan a; untuk x/a = b, kalikan kedua ruas dengan a.',
        'Kelompok atau operasi yang keliru dicatat sebagai kesalahan dan dapat mengurangi HP. Selesaikan semua tahap hingga nilai variabel diperoleh; hasil simulasi kemudian menyerang lawan secara otomatis.',
      ],
    },
    3: {
      brief: 'Sederhanakan persamaan di timbangan, lalu terapkan operasi dan nilai yang sama pada kedua ruas.',
      steps: [
        'Baca urutan langkah pada panel operasi. Pada soal bertanda kurung, selesaikan tahap distribusi yang diminta sebelum menyeimbangkan persamaan.',
        'Pilih jenis operasi dan angkanya pada panel, misalnya mengurangi konstanta atau membagi koefisien.',
        'Terapkan operasi pada ruas kiri terlebih dahulu. Tampilan ruas kiri langsung berubah; lanjutkan dengan operasi yang sama pada ruas kanan agar persamaan tetap setara.',
        'Ikuti urutan yang ditampilkan sampai variabel berdiri sendiri. Perhatikan tanda negatif, pecahan, dan suku sejenis.',
        'Gunakan tombol langkah sebelumnya untuk kembali jika perlu. Langkah yang tidak sesuai dicatat dan dapat membuat monster menyerang serta mengurangi HP.',
        'Setelah semua langkah benar, simulasi menampilkan hasil akhir dan petarung menyerang otomatis.',
      ],
    },
    4: {
      brief: 'Selesaikan persamaan dengan variabel di kedua ruas memakai panel operasi pada timbangan.',
      steps: [
        'Perhatikan suku variabel dan konstanta yang berada pada ruas berbeda. Ubin di chapter ini tetap pada ruasnya; gunakan panel operasi untuk mengubah persamaan.',
        'Jika langkah meminta membuka kurung atau menyederhanakan suku sejenis, pilih tindakan tersebut pada panel sebelum melanjutkan operasi berikutnya.',
        'Pilih operasi dan nilainya. Terapkan terlebih dahulu pada satu ruas; ruas itu langsung diperbarui. Setelah itu terapkan operasi yang sama pada ruas lainnya.',
        'Pindahkan suku variabel dengan operasi yang setara pada kedua ruas, lalu lakukan hal yang sama untuk konstanta. Jangan sekadar mengganti tanda secara manual.',
        'Bagi kedua ruas dengan koefisien setelah variabel terkumpul di satu ruas. Contoh: dari 3x = 12, bagi kiri dan kanan dengan 3 untuk memperoleh x = 4.',
        'Gunakan tombol langkah sebelumnya untuk mengoreksi urutan. Kesalahan operasi dicatat dan dapat mengurangi HP; menyelesaikan seluruh langkah membuat petarung menyerang otomatis.',
      ],
    },
    5: {
      brief: 'Terjemahkan soal cerita menjadi persamaan dengan model ubin, lalu selesaikan di timbangan.',
      steps: [
        'Tentukan besaran yang ditanyakan. Pilih makna variabel yang cocok dengan pertanyaan, misalnya harga satu barang atau jumlah awal.',
        'Pilih relasi yang sesuai dengan cerita: jumlah, selisih, pemberian, perbandingan, atau banyak kelompok.',
        'Pilih persamaan yang mewakili cerita. Periksa tanda kurung dan pastikan setiap ruas menyatakan jumlah yang tepat.',
        'Pada pembangun model, seret ubin dari persediaan ke ruas yang sesuai. Kepingan pengecoh boleh tetap di luar model.',
        'Setelah model cocok, timbangan terbuka. Gunakan panel operasi untuk menerapkan operasi yang sama pada kedua ruas sampai variabel terisolasi.',
        'Kesalahan pada makna variabel, relasi, model, atau langkah aljabar dicatat untuk evaluasi dan dapat mengurangi HP. Setelah persamaan selesai, petarung menyerang otomatis.',
      ],
    },
  },
  en: {
    1: {
      brief: 'Use balance-scale tiles and inverse operations to isolate the variable.',
      steps: [
        'Read the equation on the scale. Identify the variable, numbers, signs, and the side containing each term.',
        'Choose the tile needed to change or balance a side. Use inverse operations to remove numbers next to the variable.',
        'Drag tiles to the needed side. Opposite values on the same side cancel, such as +1 and −1.',
        'Keep each tile’s sign and value correct. Do not change a term’s sign without making an equivalent change to the equation.',
        'If you choose or move the wrong tile, the monster may attack and reduce your HP. Use Previous Step to undo it when available. Once the variable stands alone, the simulation ends and your fighter attacks automatically.',
      ],
    },
    2: {
      brief: 'Use equal groups, fraction pieces, and inverse operations to isolate the variable.',
      steps: [
        'Check whether the variable is multiplied by a coefficient, divided by a number, or has a fractional or decimal coefficient.',
        'For equal-group questions, create the requested number of groups on both sides, place the tiles, and match corresponding groups.',
        'For fraction-coefficient questions, follow the fraction workshop: split into equal parts, match the parts on both sides, and combine the pieces that make one variable.',
        'For other questions, choose an inverse operation from the available options. Apply the same operation choice to the left and right sides using the controls on each side.',
        'Preserve negative signs and coefficient values. For ax = b, divide both sides by a; for x/a = b, multiply both sides by a.',
        'An incorrect group or operation is recorded and can cost HP. Complete every step to find the variable value; the finished simulation then attacks automatically.',
      ],
    },
    3: {
      brief: 'Simplify the equation on the scale, then apply the same operation and value to both sides.',
      steps: [
        'Follow the operation panel’s step order. On questions with parentheses, complete the requested distribution step before balancing the equation.',
        'Choose the operation and number in the panel, such as subtracting a constant or dividing by a coefficient.',
        'Apply the operation to the left side first. The left side updates immediately; apply the same operation to the right side to keep the equation equivalent.',
        'Continue in the displayed order until the variable stands alone. Watch negative signs, fractions, and like terms.',
        'Use Previous Step to go back when needed. An incorrect step is recorded and can trigger a monster attack that costs HP.',
        'When all steps are correct, the simulation shows the result and your fighter attacks automatically.',
      ],
    },
    4: {
      brief: 'Solve equations with variables on both sides using the scale’s operation panel.',
      steps: [
        'Notice which variables and constants appear on each side. Tiles stay on their current sides in this chapter; use the operation panel to change the equation.',
        'If a step asks you to expand parentheses or simplify like terms, choose that action in the panel before continuing.',
        'Choose an operation and its value. Apply it to one side first; that side updates immediately. Then apply the same operation to the other side.',
        'Move variable terms using equivalent operations on both sides, then do the same for constants. Do not just change a sign by hand.',
        'Once the variables are on one side, divide both sides by the coefficient. For example, from 3x = 12, divide left and right by 3 to get x = 4.',
        'Use Previous Step to correct the order. Operation errors are recorded and can cost HP; completing all steps makes your fighter attack automatically.',
      ],
    },
    5: {
      brief: 'Translate a word problem into an equation with tiles, then solve it on the balance scale.',
      steps: [
        'Identify the requested quantity. Choose what the variable represents, such as the price of one item or an initial amount.',
        'Choose the relationship that matches the story: a total, difference, transfer, comparison, or number of groups.',
        'Choose the equation that models the story. Check its signs and parentheses, and make sure each side represents the right quantity.',
        'In the model builder, drag tiles from the tray to the matching side. Distractor tiles may remain unused.',
        'When the model matches, the balance scale opens. Use the operation panel to apply equivalent operations to both sides until the variable is isolated.',
        'Errors in the variable meaning, relationship, equation model, or algebra steps are recorded for evaluation and can cost HP. When the equation is solved, your fighter attacks automatically.',
      ],
    },
  },
};

export function getChapterGuide(levelId, lang = 'id') {
  return CHAPTER_GUIDE[lang === 'en' ? 'en' : 'id'][Number(levelId)];
}
