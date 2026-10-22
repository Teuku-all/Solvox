# SolvoX — Naskah Cerita (Story Script)

> **Judul kerja:** *Dua Jalan, Satu Solusi* — Two Roads, One Solution
> **Tagline:** *Sharp your logic, conquer the world.*
> **Bahasa:** Dwibahasa — Indonesia (ID) lalu Inggris (EN) per beat. Teks EN ditulis siap dipakai sistem `i18n` (`solvox.lang`).

Dokumen ini **hanya berisi naskah + catatan penempatan (implementasi)**. Tidak ada kode di sini. Kode integrasi dibahas di **Bagian 0** sebagai panduan lokasi, bukan sebagai instruksi menulis file baru.

---

## Daftar Isi
- [Bagian 0 — Panduan Implementasi (Penempatan Naskah)](#bagian-0--panduan-implementasi-penempatan-naskah)
- [Bagian 1 — Dunia & Premis](#bagian-1--dunia--premis)
- [Bagian 2 — Background Karakter](#bagian-2--background-karakter)
- [Bagian 3 — Background Boss](#bagian-3--background-boss)
- [Bagian 4 — Naskah Rute KAZURA (Bab 1–5 + Epilog)](#bagian-4--naskah-rute-kazura)
- [Bagian 5 — Naskah Rute ASUNA (Bab 1–5 + Epilog)](#bagian-5--naskah-rute-asuna)
- [Bagian 6 — Epilog (Identik Kedua Rute)](#bagian-6--epilog-identik-kedua-rute)
- [Bagian 7 — Lampiran (Teks Siap-Tempel)](#bagian-7--lampiran-teks-siap-tempel)

---

## Bagian 0 — Panduan Implementasi (Penempatan Naskah)

### 0.1 Prinsip Dasar
- Pemain memilih **satu karakter sampai tamat** (`traveler` = KAZURA, `asuka` = ASUNA, lihat `frontend/src/data/characterSelection.js`). Rute paralel karena ganti karakter butuh **reset progress** (storage `solvox.singlePlayer.characterLocked.v1`).
- Naskah dibagi menjadi **segmen**: `intro`, `win`, `lose` per bab, dan `epilogue` di akhir Bab 5.
- **Kanon peristiwa & ending identik** untuk kedua rute; yang berbeda hanya **POV & penafsiran**.
- Karakter yang tidak dipilih tetap hadir sebagai **NPC pendamping**: bertemu di Gerbang (Bab 1), berpapasan di tengah (Bab 3), bersatu sebelum Axiom (Bab 5).

### 0.2 Tabel Penempatan

| Segmen naskah | Momen di alur | Pemicu | Titik integrasi yang ada di kode |
|---|---|---|---|
| `intro` (splash karakter + splash boss) | Setiap kali sebelum battle dimulai | Semua kunjungan, termasuk rematch dan mulai ulang kampanye | Setelah `selectChapter(id)` → sebelum `launchBattle` (`frontend/src/App.jsx`) |
| `win` | Setelah boss kalah | `onComplete` dari `Battle` (hasil menang) | `complete(result)` di `frontend/src/App.jsx` |
| `lose` | Setelah karakter gugur | `onComplete` dari `Battle` (HP pemain 0) | `complete(result)` di `frontend/src/App.jsx` |
| `epilogue` | Setelah Bab 5 selesai | `win` terakhir Bab 5 | Sebelum layar `Evaluation` |
| `Evaluation` (bukan naskah) | Setelah epilog | Tombol lanjut | `frontend/src/components/Evaluation.jsx` (`onClose` → `'chapters'`, `onNext` → bab berikutnya, `onRematch`) |

### 0.3 Aturan Alur
1. **Intro + splash karakter dan boss diputar pada setiap kunjungan**, termasuk rematch dan mulai ulang kampanye.
2. **Skip panjang dinonaktifkan sebelum pemain memulai battle pertamanya.** Setelah battle dimulai, Skip tersedia pada cutscene berikutnya. Riwayat ini bertahan saat progress kampanye di-reset.
3. **Kontrol beat dialog:** **Next** + **Lewati (Skip panjang)** + **Auto**. `Auto` memajukan beat otomatis dengan jeda tetap.
4. **`win` menggantikan `lose`** pada hasil yang sesuai — hanya satu yang diputar per battle.
5. `Battle.jsx` tetap memanggil `onComplete`; `Evaluation` tetap overlay dengan `onClose`/`onNext`/`onRematch`. Cutscene kampanye hanya dipakai single-player; roster multiplayer tetap bebas memilih karakter dan monster.

### 0.4 Tempat Background
- **Splash karakter terpilih** → tampil di sisi karakter pemain selama cutscene.
- **Splash boss** → tampil di sisi lawan selama `intro` bab masing-masing.

---

## Bagian 1 — Dunia & Premis

### 1.1 Dunia SolvoX

**ID**
Dunia SolvoX bukan dunia biasa: ia dibangun dari aturan. Setiap hukum aljabar—suku sejenis, pangkat, persamaan, pecahan—adalah tiang yang menopang realitas. Selama aturannya utuh, dunia berdiri. Selama jawabannya bisa ditemukan, dunia bernafas.

**EN**
The world of SolvoX is no ordinary world: it is built out of rules. Every algebraic law—like terms, powers, equations, fractions—is a pillar that holds reality up. As long as the rules hold, the world stands. As long as an answer can be found, the world breathes.

### 1.2 Sihir = Logika

**ID**
Di SolvoX, sihir bukan mantra—sihir adalah logika yang diucapkan dengan benar. Sebuah jawaban yang tepat menjadi serangan; satu langkah keliru adalah satu luka bagi si penjawab.

**EN**
In SolvoX, magic is not a chant—magic is logic spoken correctly. A correct answer becomes a strike; one wrong step is a wound to the one who answers.

### 1.3 Void — Nilai Tak Terdefinisi

**ID**
Musuh sejati bukan makhluk. Ia adalah **Void**: kekosongan bernama "nilai tak terdefinisi". Di mana Void menyentuh, aturan membusuk—bilangan lupa identitasnya, persamaan tak lagi bisa diseimbangkan, pecahan menganga tak terselesaikan. Mereka yang terlalu lama di dalamnya berhenti percaya bahwa jawaban masih ada.

**EN**
The true enemy is not a creature. It is the **Void**: an emptiness called "undefined value." Where the Void touches, rules rot—numbers forget their identity, equations can no longer be balanced, fractions gape unfinished. Those who stay too long inside it stop believing an answer still exists.

### 1.4 Axiom — Dalang

**ID**
Di dasar semua ini berdiri **Axiom**, penjaga terakhir dunia. Ia dahulu menjunjung hukum tertinggi; tetapi setelah melihat dunia gagal berulang kali, ia menyimpulkan satu hal: *lebih baik kosong daripada salah selamanya*. Ia menarik semua aturan ke dalam bentengnya—dan menunggu seseorang membuktikan ia salah.

**EN**
At the bottom of all of this stands **Axiom**, the world's final guardian. He once upheld the highest law; but after watching the world fail again and again, he concluded one thing: *better empty than forever wrong.* He drew every rule into his fortress—and waits for someone to prove him wrong.

### 1.5 Struktur Naratif — "Dua Jalan, Satu Solusi"

**ID**
Ada dua penyelesai, dua jalan, satu solusi. KAZURA berjalan dengan pedang: menebas masalah sampai tersisa jawabannya. ASUNA berjalan dengan nalar: membedah masalah sampai jawabannya menunjukkan diri. Keduanya sampai di tempat yang sama—hanya cara membaca jalannya yang berbeda.

**EN**
There are two solvers, two roads, one solution. KAZURA walks with a blade: cutting a problem down until only the answer remains. ASUNA walks with reason: dissecting a problem until the answer reveals itself. Both arrive at the same place—only the way they read the road differs.

---

## Bagian 2 — Background Karakter

### 2.1 KAZURA — Azure Knight

**ID**
Kazura tumbuh di desa perbatasan yang lebih dulu dilahap Void. Yang ia ingat dari malam itu hanyalah suara seseorang menanyakan sebuah persamaan, dan dirinya menjawab benar—lalu cahaya. Pedang kristalnya, **Aletheia**, bukan tempaan pandai besi: ia membeku dari "jawaban pertama" yang pernah ia ucapkan. Sejak itu Kazura percaya satu hal dengan seluruh tubuhnya: *setiap masalah punya solusi; kalau belum ketemu, berarti belum cukup berjuang.*

Ia tegas, hemat bicara, dan cenderung memikul semuanya sendiri—sebuah kelemahan yang baru ia sadari di ujung perjalanan. Tujuannya sederhana dan berat sekaligus: memulihkan aturan dunia, dan mencari tahu mengapa Void mengenal namanya.

**EN**
Kazura grew up in a border village that the Void devoured before any other. All he remembers of that night is a voice asking an equation, and himself answering correctly—then light. His crystal sword, **Aletheia**, was not forged by any smith: it froze out of the first answer he ever spoke. Ever since, Kazura has believed one thing with his whole body: *every problem has a solution; if it isn't found yet, then you haven't fought hard enough.*

He is firm, sparing with words, and prone to carrying everything alone—a weakness he only recognizes at the end of the road. His goal is simple and heavy at once: to restore the world's rules, and to learn why the Void knows his name.

**Arc:** dari "pedang bisa menyelesaikan segalanya" → menyadari bahwa sebagian jawaban hanya bisa ditemukan bersama orang lain.
**Arc:** from "the blade can solve everything" → realizing some answers can only be found together with someone else.

### 2.2 ASUNA — Royal Spellblade

**ID**
Asuna berasal dari kerajaan yang menjaga **Perpustakaan Aturan**. Ia bukan sekadar penjaga—ia adalah pembaca terakhir tablet hukum kerajaan sebelum Void meliputinya. Kristal di tubuh dan busananya adalah pecahan tablet itu, yang menempel padanya saat ia kabur. Ia selamat justru karena lari; dan itulah luka yang tak pernah ia akui.

Asuna tenang, teliti, dan sopan—terlalu sopan untuk seseorang yang menyimpan rasa bersalah sebesar itu. Ia percaya jawaban harus **dipahami**, bukan dihafal; dan bahwa aturan yang rusak lebih baik diperbaiki daripada ditinggalkan. Tujuannya: menyelamatkan sisa kerajaannya, dan membuktikan bahwa memperbaiki masih mungkin.

**EN**
Asuna comes from a kingdom that guarded the **Library of Rules**. She was no mere keeper—she was the last reader of the kingdom's tablet of laws before the Void engulfed it. The crystals on her body and attire are fragments of that tablet, clinging to her as she fled. She survived precisely because she ran; and that is the wound she never admits.

Asuna is calm, meticulous, and courteous—too courteous for someone carrying guilt that large. She believes an answer must be *understood*, not memorized; and that a broken rule is better repaired than abandoned. Her goal: to save what remains of her kingdom, and to prove that repair is still possible.

**Arc:** dari lari dari tanggung jawab → menerima bahwa memperbaiki lebih penting daripada sempurna.
**Arc:** from fleeing responsibility → accepting that repairing matters more than being perfect.

### 2.3 Pertemuan Pertama (Kanon)

**ID**
Kazura dan Asuna pertama kali bertemu **di Gerbang Bab 1**, sama-sama menuju pintu yang menuju dalam. Mereka sempat bentrok singkat—bukan karena permusuhan, tapi karena cara mereka berlawanan: Kazura ingin menebas lewat, Asuna ingin memahami dulu. Keduanya berpisah ke jalan masing-masing dengan rasa ingin tahu yang tak selesai. Inilah sebabnya pertemuan kembali di Bab 5 tidak mendadak: benihnya sudah ditanam di awal.

**EN**
Kazura and Asuna first meet **at the Gate in Chapter 1**, both heading for the same inner door. They clash briefly—not from hostility, but because their methods are opposite: Kazura wants to cut through, Asuna wants to understand first. They part onto their own roads with an unfinished curiosity. This is why the reunion in Chapter 5 is not sudden: the seed was planted at the very start.

---

## Bagian 3 — Background Boss

> Prinsip: **tidak ada boss yang "jahat"**. Setiap boss adalah penjaga aturan yang mengeras atau membusuk karena Void. Yang pemain lakukan bukan membunuh mereka—melainkan **memulihkan fungsi mereka**.

### 3.1 Wolf — Penjaga Gerbang (`wolf`, Shadow)

**ID**
Dahulu Wolf adalah roh penjaga Gerbang Suku Sejenis: tugasnya memisahkan yang sejenis dari yang tidak, dengan mata yang tak pernah salah. Void membuatnya kehilangan kemampuan membedakan—kini ia menganggap *semua* yang mendekat sebagai "tak sejenis", dan karena itu menyerang tanpa ampun. Ia tidak marah; ia hanya tidak lagi bisa mengenali. Skill: *Claw Strike, Dark Howl, Shadow Dash.*

**EN**
Wolf was once the guardian spirit of the Like-Term Gate: its task was to separate like from unlike, with an eye that never erred. The Void stole its ability to tell the difference—now it regards everyone who approaches as "unlike", and therefore strikes without mercy. It is not angry; it simply can no longer recognize. Skills: *Claw Strike, Dark Howl, Shadow Dash.*

### 3.2 Wraith — Penjaga Pabrik Pangkat (`wraith`, Shadow / Arc)

**ID**
Wraith menjaga Pabrik Pangkat, tempat bilangan dilipatgandakan oleh pangkatnya. Void membuat pangkat "meluber" tanpa kendali, dan Wraith pun terbelah menjadi bayangan yang melipatgandakan dirinya—mengulang satu operasi yang sama tanpa pernah berhenti, karena takut berhenti berarti aturan benar-benar hilang. Skill: *Spectral Claw, Void Surge, Wraith Step.*

**EN**
Wraith guards the Power Factory, where numbers are multiplied by their powers. The Void made powers spill out of control, and Wraith split into a shadow that multiplies itself—repeating the same single operation without ever stopping, afraid that stopping means the rule is truly gone. Skills: *Spectral Claw, Void Surge, Wraith Step.*

### 3.3 Naga Persamaan — Equation Drake (`equation-drake`, Arc / Lightning)

**ID**
Naga Persamaan menjaga keseimbangan Ruang Persamaan: menahan sisi kiri dan sisi kanan agar selalu setara. Ketika Void membuat kedua sisi tak pernah bisa diseimbangkan, Naga menahan keduanya dengan tubuhnya sendiri—dan menganggap siapa pun yang mengubah satu sisi sebagai perusak keseimbangan. Skill: *Arc Breath, Equation Surge, Vector Rush.*

**EN**
The Equation Drake guards the balance of the Equation Chamber: holding the left side and the right side always equal. When the Void made the two sides impossible to balance, the Drake holds both with its own body—and regards anyone who alters one side as a destroyer of balance. Skills: *Arc Breath, Equation Surge, Vector Rush.*

### 3.4 Titan — Penghancur Kuil Pecahan (`titan`, Bone / Earth)

**ID**
Titan dahulu arsitek Kuil Pecahan, yang menyatukan potongan menjadi utuh. Void membuat pecahan-pecahan tak lagi bisa disatukan; alih-alih menyerah, Titan memilih menghancurkan apa pun yang mencoba menggabungkan—karena ia percaya keutuhan kini mustahil, dan harapan hanya memperpanjang penderitaan. Skill: *Rib Crush, Bone Roar, Tomb Rush.*

**EN**
Titan was once the architect of the Fraction Temple, unifying pieces into a whole. The Void made the fragments impossible to rejoin; rather than surrender, Titan chose to destroy anything that tries to combine—because it believes wholeness is now impossible, and hope only prolongs the suffering. Skills: *Rib Crush, Bone Roar, Tomb Rush.*

### 3.5 Axiom — Penguasa Benteng Bayangan (`axiom`, Arc / Void)

**ID**
Axiom adalah penjaga terakhir dan dalang di balik semuanya. Dahulu ia menjunjung hukum tertinggi dunia tanpa keraguan. Setelah menyaksikan dunia gagal—berulang kali, selama mungkin lebih lama dari yang bisa dihitung siapa pun—ia sampai pada kesimpulan yang ia yakini sebagai belas kasih: *lebih baik dunia kosong daripada salah selamanya.* Ia menarik semua aturan ke dalam Benteng Bayangan, dan menunggu seseorang membuktikan bahwa jawaban masih ada. Skill: *Axiom Break, Void Equation, Null Collapse.*

**EN**
Axiom is the final guardian and the mastermind behind everything. He once upheld the world's highest law without doubt. After witnessing the world fail—again and again, for perhaps longer than anyone could count—he arrived at a conclusion he believed to be mercy: *better an empty world than one forever wrong.* He drew all rules into the Shadow Fortress, and waits for someone to prove that an answer still exists. Skills: *Axiom Break, Void Equation, Null Collapse.*

---

## Bagian 4 — Naskah Rute KAZURA

> **Judul rute:** "Pedang yang Menjawab" — *The Blade That Answers*
> Format beat: **ID** lalu **EN**. Label segmen: `intro` / `win` / `lose`.
> Kontrol: Next · Lewati · Auto (lihat Bagian 0.3).

### Bab 1 — Gerbang Suku Sejenis (`Like-Term Gate`)

#### `intro` — Beat 1 · Gerbang
- **ID · Narasi:** Gerbang itu berdiri di tengah padang yang laut—bukan terbuat dari batu, melainkan dari dua baris bilangan yang seharusnya sama. Yang kiri bergetar. Yang kanan memudar.
- **EN · Narration:** The Gate stands in a plain that is a sea—made not of stone, but of two rows of numbers that should be the same. The left trembles. The right fades.

#### `intro` — Beat 2 · KAZURA (background)
- **ID · KAZURA:** Namaku Kazura. Pedang ini—Aletheia—bukan dibuat, tapi membeku dari jawaban pertamaku. Kata orang, aku lahir dari desa yang dihapus Void. Aku tidak ingat wajah mereka. Aku ingat suara yang bertanya. Dan aku ingat aku menjawab benar.
- **EN · KAZURA:** My name is Kazura. This blade—Aletheia—was not made; it froze from my first answer. They say I was born in a village erased by the Void. I don't remember their faces. I remember a voice asking. And I remember answering correctly.

#### `intro` — Beat 3 · Bertemu ASUNA
- **ID · Narasi:** Di depan gerbang, seseorang berdiri membelakangi. Ornamen kristal di pundaknya menangkap cahaya. Ia tidak menoleh, tapi jelas ia mendengar langkah Kazura.
- **EN · Narration:** At the gate stands someone with their back turned. Crystal ornaments on her shoulders catch the light. She doesn't turn, but she clearly hears Kazura's steps.
- **ID · ASUNA:** Jangan sentuh gerbangnya. Kau tidak tahu aturan mana yang menahannya.
- **EN · ASUNA:** Don't touch the gate. You don't know which rule is holding it.
- **ID · KAZURA:** Aku tahu satu aturan: yang menghalangi, ditebas.
- **EN · KAZURA:** I know one rule: what blocks the way gets cut.
- **ID · ASUNA:** *(akhirnya menoleh)* Tipikal. Kau bahkan tidak tahu apa yang kautebas.
- **EN · ASUNA:** *(finally turning)* Typical. You don't even know what you're cutting.
- **ID · Narasi:** Sesaat, pedang Kazura dan kristal Asuna bersentuhan—percikan, bukan luka. Lalu keduanya menarik diri, sama-sama enggan menuntaskan. Asuna melangkah lebih dulu, menembus celah gerbang.
- **EN · Narration:** For a moment Kazura's blade and Asuna's crystal meet—sparks, not wounds. Then both withdraw, equally unwilling to finish. Asuna steps first, slipping through a gap in the gate.
- **ID · KAZURA:** ...Aneh. Dia tahu banyak. Dan dia tetap lari.
- **EN · KAZURA:** ...Strange. She knows so much. And still she runs.

#### `intro` — Beat 4 · Wolf (background)
- **ID · Narasi:** Gerbang menganga. Dari baliknya, sesuatu merangkak keluar—empat kaki, mata yang mencoba mengelompokkan Kazura dan gagal berkali-kali dalam satu detik.
- **EN · Narration:** The gate gapes. From behind it, something crawls out—four legs, an eye trying to classify Kazura and failing again and again within a single second.
- **ID · Wolf:** Sejenis... tidak... sejenis... **tidak.** Kau semua tidak sejenis. Kau semua harus lenyap.
- **EN · Wolf:** Like... no... like... **no.** None of you are alike. All of you must vanish.
- **ID · KAZURA:** (Kata-katanya rusak. Ia tidak menyerang karena benci.) Dengar. Aku akan menunjukkan padamu mana yang sejenis.
- **EN · KAZURA:** (Its words are broken. It doesn't attack from hate.) Listen. I'll show you which ones are alike.
- **ID · Narasi:** Aletheia menyala. Each wrong answer a wound—Kazura tahu itu. Ia menarik nafas.
- **EN · Narration:** Aletheia ignites. Every wrong answer a wound—Kazura knows it. He draws a breath.

#### `win` — Bab 1
- **ID · Narasi:** Wolf ambruk, bukan hancur—ia meringkuk, dan matanya untuk pertama kali dalam waktu lama **mengenali** sesuatu. Dua baris bilangan di gerbang perlahan menjadi sama, lalu menyatu.
- **EN · Narration:** Wolf collapses—not shattered, but curling up, and for the first time in a long while its eye *recognizes* something. The two rows of numbers at the gate slowly become the same, then merge.
- **ID · Wolf:** ...Sejenis. Kau... sejenis dengan yang kucari.
- **EN · Wolf:** ...Alike. You... are like the one I was looking for.
- **ID · KAZURA:** Beristirahatlah. Aturanmu kembali.
- **EN · KAZURA:** Rest. Your rule is back.
- **ID · Narasi:** Gerbang terbuka. Di ujung koridor, samar, kilau kristal menghilang di tikungan. Kazura menatap lama.
- **EN · Narration:** The gate opens. At the end of the corridor, faintly, a crystal glimmer vanishes around the bend. Kazura stares for a long time.

#### `lose` — Bab 1
- **ID · Narasi:** Aletheia terlepas dari tangan Kazura. Gerbang tak bergerak—dua baris bilangan itu tetap menolak menyatu, dan Wolf kembali menyerang tanpa mengenali.
- **EN · Narration:** Aletheia slips from Kazura's hand. The gate does not move—the two rows still refuse to merge, and Wolf strikes again without recognizing.
- **ID · Wolf:** Tidak sejenis. Tidak sejenis. Tidak—
- **EN · Wolf:** Unlike. Unlike. Un—
- **ID · Narasi:** Kazura menutup mata, dan satu hal terakhir terlintas: *jawabannya belum benar.* Bukan pedangnya yang lemah—jawabannya. Ada satu operasi yang ia lewatkan.
- **EN · Narration:** Kazura closes his eyes, and one last thing crosses his mind: *the answer wasn't right yet.* Not his blade that was weak—the answer. There was one operation he skipped.
- **ID · KAZURA:** ...Sekali lagi. Aku belum selesai menjawab.
- **EN · KAZURA:** ...Once more. I'm not done answering.

### Bab 2 — Pabrik Pangkat (`Power Factory`)

#### `intro` — Beat 1 · Pabrik
- **ID · Narasi:** Pabrik itu bernafas. Setiap pipa menyemburkan angka yang tumbuh membesar—2 menjadi 4, 4 menjadi 16—lalu pecah sebelum sempat selesai.
- **EN · Narration:** The factory breathes. Every pipe spurts numbers that grow larger—2 into 4, 4 into 16—then burst before they can finish.
- **ID · KAZURA:** (Pangkat yang salah, dipaksa terus. Seperti sesuatu yang menolak berhenti menghitung.)
- **EN · KAZURA:** (The wrong power, forced onward. Like something refusing to stop counting.)

#### `intro` — Beat 2 · Wraith (background)
- **ID · Narasi:** Di tengah pabrik, sebuah bayangan berlipat—satu menjadi dua, dua menjadi empat, tak berujung, dan setiap salinan mengulang gerakan yang persis sama.
- **EN · Narration:** At the factory's heart, a shadow folds—one into two, two into four, endlessly, and every copy repeats the exact same motion.
- **ID · Wraith:** Kalikan... kalikan... kalikan... kalau berhenti, aturan hilang. Kalau aturan hilang, salahku.
- **EN · Wraith:** Multiply... multiply... multiply... if I stop, the rule is gone. If the rule is gone, it's my fault.
- **ID · KAZURA:** Kau tidak bersalah. Kau hanya belum pernah diberi izin berhenti.
- **EN · KAZURA:** You are not at fault. You were only never given permission to stop.

#### `win` — Bab 2
- **ID · Narasi:** Salinan-salinan Wraith mengendur menjadi satu. Pipa-pipa berhenti memaksa; angka keluar dengan laju yang benar.
- **EN · Narration:** Wraith's copies slacken into one. The pipes stop forcing; numbers leave at the right pace.
- **ID · Wraith:** ...Aku boleh... berhenti sekarang?
- **EN · Wraith:** ...I may... stop now?
- **ID · KAZURA:** Boleh. Pabrik ini akan melanjutkan untukmu.
- **EN · KAZURA:** You may. This factory will carry on for you.

#### `lose` — Bab 2
- **ID · Narasi:** Salinan Wraith menelan Kazura dalam tumpukan angka yang sama, berulang. Terlalu banyak—terlalu cepat. Ia kewalahan bukan oleh kekuatan, tapi oleh **jumlah**.
- **EN · Narration:** Wraith's copies swallow Kazura in the same stacked numbers, over and over. Too many—too fast. He is overwhelmed not by strength, but by *quantity*.
- **ID · KAZURA:** (Bukan kekuatan yang mengalahkanku. Aku hanya belum menyederhanakannya.)
- **EN · KAZURA:** (Not strength that beat me. I just haven't simplified it yet.)

### Bab 3 — Ruang Persamaan (`Equation Chamber`)

#### `intro` — Beat 1 · Ruang
- **ID · Narasi:** Ruang ini miring. Lantai adalah garis sama-dengan. Sisi kiri terangkat, sisi kanan terbenam, dan sebuah tanda tanya raksasa menggantung di tengah, tak pernah terjawab.
- **EN · Narration:** This chamber tilts. The floor is an equals sign. The left side rises, the right side sinks, and a giant question mark hangs in the middle, never answered.
- **ID · Narasi:** Di kejauhan, Kazura melihat kilau kristal lagi—kali ini lebih dekat. Samar-samar, seseorang menahan sisi kanan ruang dengan tubuhnya.
- **EN · Narration:** In the distance, Kazura sees the crystal glimmer again—closer this time. Faintly, someone holds the chamber's right side up with her body.
- **ID · ASUNA (dari jauh):** Tahan sisi itu! Jangan ubah sebelum kau tahu nilainya!
- **EN · ASUNA (from afar):** Hold that side! Don't change it before you know its value!
- **ID · KAZURA:** (Dia lagi. Dia menahannya—sendirian.)
- **EN · KAZURA:** (Her again. She's holding it—alone.)

#### `intro` — Beat 2 · Naga Persamaan (background)
- **ID · Narasi:** Naga itu membelit kedua sisi ruang seperti rantai hidup, sisiknya berkilat di antara tanda sama-dengan dan tanda tanya. Ia menahan keseimbangan dengan seluruh tubuhnya.
- **EN · Narration:** The Drake coils around both sides of the chamber like a living chain, its scales flashing between the equals sign and the question mark. It holds the balance with its entire body.
- **ID · Naga Persamaan:** Kau mengubah satu sisi. Pemain selalu mengubah satu sisi. Keseimbangan akan hancur.
- **EN · Equation Drake:** You alter one side. Players always alter one side. The balance will collapse.
- **ID · KAZURA:** Keseimbangan yang tidak bergerak bukan keseimbangan. Itu mati.
- **EN · KAZURA:** A balance that never moves is not balance. It is death.

#### `win` — Bab 3
- **ID · Narasi:** Naga melepaskan belitannya, dan ruang kembali rata—sisi kiri dan kanan akhirnya beristirahat sejajar. Tanda tanya memudar, digantikan tanda sama-dengan yang tenang.
- **EN · Narration:** The Drake releases its coils, and the chamber levels—left and right finally resting even. The question mark fades, replaced by a calm equals sign.
- **ID · Naga Persamaan:** ...Seimbang. Benar-benar seimbang.
- **EN · Equation Drake:** ...Balanced. Truly balanced.
- **ID · Narasi:** Kazura menoleh mencari kilau kristal itu. Asuna sudah pergi lagi—tapi di lantai, ada jejak rumus, ditulis tergesa, yang menuntun ke arah berikutnya.
- **EN · Narration:** Kazura turns to look for the crystal glimmer. Asuna is gone again—but on the floor, there is a trail of formula, written hastily, leading to the next direction.

#### `lose` — Bab 3
- **ID · Narasi:** Ruang miring lebih jauh. Kazura terpeleset dari tanda sama-dengan, dan Naga menahannya sebagai "perusak keseimbangan".
- **EN · Narration:** The chamber tilts further. Kazura slips off the equals sign, and the Drake holds him as a "destroyer of balance".
- **ID · KAZURA:** (Aku mengubah sisi yang salah. Urutan operasinya—aku lupa urutannya.)
- **EN · KAZURA:** (I changed the wrong side. The order of operations—I forgot the order.)

### Bab 4 — Kuil Pecahan (`Fraction Temple`)

#### `intro` — Beat 1 · Kuil
- **ID · Narasi:** Kuil itu pecah berkeping—serpihan batu melayang di udara, masing-masing membawa sebagian dari satu keseluruhan yang dulu utuh. Rumput tumbuh di celah-celahnya, mencoba menyatukan.
- **EN · Narration:** The temple lies in shards—stone fragments float in the air, each carrying part of a whole that was once complete. Grass grows in the cracks, trying to unite them.
- **ID · KAZURA:** (Kepingan-kepingan ini... seperti pecahan yang tidak pernah punya penyebut yang sama.)
- **EN · KAZURA:** (These shards... like fractions that never share a denominator.)

#### `intro` — Beat 2 · Titan (background)
- **ID · Narasi:** Dari reruntuhan, sebuah sosok tulang setinggi menara berdiri. Setiap gerakannya menghancurkan serpihan yang mencoba mendekat satu sama lain.
- **EN · Narration:** From the ruins, a figure of bone as tall as a tower stands. Every motion destroys the shards that try to draw near each other.
- **ID · Titan:** Jangan susun. Kau hanya memperpanjang harapan. Keutuhan sudah mati bersama kuil ini.
- **EN · Titan:** Don't assemble. You only prolong hope. Wholeness died with this temple.
- **ID · KAZURA:** Kalau begitu kenapa kau masih di sini, menjaga pecahannya? Orang yang benar-benar menyerah tidak menjaga apa pun.
- **EN · KAZURA:** Then why are you still here, guarding the shards? Someone who truly gives up guards nothing.

#### `win` — Bab 4
- **ID · Narasi:** Titan berlutut, dan untuk pertama kali serpihan-serpihan itu tidak dihancurkan—mereka **mendekat**, menemukan penyebut yang sama, dan mengunci diri menjadi satu dinding utuh.
- **EN · Narration:** Titan kneels, and for the first time the shards are not destroyed—they *draw close*, find a common denominator, and lock themselves into one whole wall.
- **ID · Titan:** ...Ternyata masih bisa.
- **EN · Titan:** ...So it still can be done.

#### `lose` — Bab 4
- **ID · Narasi:** Titan meremukkan serpihan berikut Kazura di dalamnya. Ia kalah karena mencoba menyatukan sebelum menyamakan penyebutnya.
- **EN · Narration:** Titan crushes the shard with Kazura inside. He lost because he tried to unite before equalizing the denominators.
- **ID · KAZURA:** (Penyebut dulu. Aku menyusun sebelum menyamakan. Kesalahanku sendiri.)

### Bab 5 — Benteng Bayangan (`Shadow Fortress — FINAL BOSS`)

#### `intro` — Beat 1 · Benteng
- **ID · Narasi:** Benteng itu tidak berdiri di atas tanah—ia menggantung, tersusun dari aturan-aturan yang dicabut dari dunia. Setiap langkah menuju pintunya terasa seperti menaiki persamaan yang sisinya tidak seimbang.
- **EN · Narration:** The fortress does not stand on ground—it hangs, built from rules pulled out of the world. Every step toward its door feels like climbing an equation whose sides don't balance.
- **ID · Narasi:** Di kakinya, Asuna menunggu. Kristalnya kini menyala terang—bukan lagi menjauh, tapi sengaja.
- **EN · Narration:** At its foot, Asuna waits. Her crystals now glow bright—no longer retreating, but deliberately.

#### `intro` — Beat 2 · Bersatu
- **ID · ASUNA:** Kau lambat.
- **EN · ASUNA:** You're slow.
- **ID · KAZURA:** Kau yang menunggu.
- **EN · KAZURA:** You waited.
- **ID · ASUNA:** Aku membaca aturannya. Kau menebas jalannya. Sepertinya kali ini kita butuh keduanya.
- **EN · ASUNA:** I read the rule. You cut the path. Seems this time we need both.
- **ID · KAZURA:** ...Sepakat. Untuk sekali ini.
- **EN · KAZURA:** ...Agreed. For once.
- **ID · Narasi:** Pedang dan kristal akhirnya sejajar—bukan karena sihir, tapi karena mereka berhenti berlawanan arah.
- **EN · Narration:** Blade and crystal finally align—not by magic, but because they stopped pulling in opposite directions.

#### `intro` — Beat 3 · Axiom (background)
- **ID · Narasi:** Pintu benteng terbuka tanpa suara. Di dalamnya, seorang penjaga duduk di atas singgasana yang terbuat dari hukum-hukum yang ia kumpulkan. Ia tidak menyerang. Ia bahkan tidak berdiri.
- **EN · Narration:** The fortress door opens without sound. Inside, a guardian sits on a throne made of the laws he has gathered. He does not attack. He does not even stand.
- **ID · Axiom:** Kalian datang menjawab. Semua orang datang menjawab. Dan semuanya salah—lalu aku harus melihat dunia runtuh lagi.
- **EN · Axiom:** You come to answer. Everyone comes to answer. And everyone is wrong—then I must watch the world collapse again.
- **ID · Axiom:** Aku tidak menghancurkan dunia. Aku **menyelamatkannya** dari dirinya sendiri. Kosong lebih baik daripada salah selamanya.
- **EN · Axiom:** I did not destroy the world. I *saved* it from itself. Empty is better than forever wrong.
- **ID · KAZURA:** Dunia tidak butuh kau selamatkan dari jawaban. Dunia cuma butuh kau percaya jawaban masih ada.
- **EN · KAZURA:** The world doesn't need you to save it from answers. The world only needs you to believe an answer still exists.

#### `win` — Bab 5
- **ID · Narasi:** Axiom tidak hancur. Singgasananya yang hancur—hukum-hukum yang ia tahan selama ini lolos kembali ke langit, mencari tempatnya masing-masing. Dan Axiom akhirnya **berdiri**.
- **EN · Narration:** Axiom is not destroyed. It is his throne that shatters—the laws he held for so long escape back into the sky, each seeking its place. And Axiom finally *stands*.
- **ID · Axiom:** ...Aku lupa bagaimana rasanya percaya. Kalian berdua... menjawabnya. Bersama.
- **EN · Axiom:** ...I forgot what it felt like to believe. You two... answered it. Together.
- **ID · ASUNA:** Bukan karena jawabannya sempurna.
- **EN · ASUNA:** Not because the answer was perfect.
- **ID · KAZURA:** Tapi karena kami tidak berhenti sampai jawabannya ada.
- **EN · KAZURA:** But because we didn't stop until the answer existed.
- **ID · Narasi:** Benteng meruntuh bukan sebagai kehancuran, tapi sebagai pembebasan. Di kejauhan, satu per satu, gerbang-gerbang dunia terbuka kembali.
- **EN · Narration:** The fortress collapses not as destruction, but as release. In the distance, one by one, the world's gates open again.

---

## Bagian 5 — Naskah Rute ASUNA

> **Judul rute:** "Nalar yang Tak Pernah Diam" — *The Reason That Never Falls Silent*
> **Cermin penuh** dari Rute Kazura: kanon peristiwa & ending **identik**; yang berbeda hanya POV, urutan penemuan, dan penafsiran. Epilog **sama persis** (Bagian 6).

### Bab 1 — Gerbang Suku Sejenis (`Like-Term Gate`)

#### `intro` — Beat 1 · Gerbang
- **ID · Narasi:** Gerbang itu berdiri di tengah padang yang laut—dua baris bilangan yang seharusnya sama. Yang kiri bergetar. Yang kanan memudar. Asuna berhenti tiga langkah darinya.
- **EN · Narration:** The Gate stands in a plain that is a sea—two rows of numbers that should be the same. The left trembles. The right fades. Asuna stops three steps away.

#### `intro` — Beat 2 · ASUNA (background)
- **ID · ASUNA:** Namaku Asuna. Kristal ini bukan perhiasan—ia pecahan tablet hukum kerajaanku, yang menempel saat aku lari. Aku pembaca terakhirnya. Dan aku satu-satunya yang selamat justru karena pergi.

> **EN · ASUNA:** My name is Asuna. These crystals are not jewelry—they are fragments of my kingdom's tablet of laws, clinging to me as I fled. I am its last reader. And I am the only one who survived precisely because I left.
- **ID · ASUNA:** Aku tidak akan berlari lagi sebelum tahu mengapa aturan ini rusak.
- **EN · ASUNA:** I will not run again before I know why this rule broke.

#### `intro` — Beat 3 · Bertemu KAZURA
- **ID · Narasi:** Seorang ksatria berbaju biru mendekat, pedang kristal di punggungnya, tanpa ragu sedikit pun. Asuna menahan langkahnya.
- **EN · Narration:** A knight in blue approaches, a crystal sword on his back, without a hint of hesitation. Asuna halts his steps.
- **ID · ASUNA:** Jangan sentuh gerbangnya. Kau tidak tahu aturan mana yang menahannya.
- **EN · ASUNA:** Don't touch the gate. You don't know which rule is holding it.
- **ID · KAZURA:** Aku tahu satu aturan: yang menghalangi, ditebas.
- **EN · KAZURA:** I know one rule: what blocks the way gets cut.
- **ID · ASUNA:** *(menatap pedangnya)* Pedang yang tidak bertanya dulu. Selamat datang di dunia yang runtuh karena itu.
- **EN · ASUNA:** *(eyeing his blade)* A blade that doesn't ask first. Welcome to a world that collapsed from exactly that.
- **ID · Narasi:** Sesaat pedang dan kristal bersentuhan—percikan, bukan luka. Asuna melangkah mundur lebih dulu, lalu menembus celah gerbang. Ia sempat menoleh sekali.
- **EN · Narration:** For a moment blade and crystal meet—sparks, not wounds. Asuna steps back first, then slips through a gap in the gate. She glances back once.
- **ID · ASUNA:** *(dalam hati)* Dia menjawab tanpa ragu. Aku takut pada orang yang tidak pernah ragu.
- **EN · ASUNA:** *(to herself)* He answers without doubt. I'm afraid of people who never doubt.

#### `intro` — Beat 4 · Wolf (background)
- **ID · Narasi:** Gerbang menganga. Sesuatu merangkak keluar—empat kaki, satu mata yang mencoba mengelompokkan Asuna dan gagal berkali-kali dalam satu detik.
- **EN · Narration:** The gate gapes. Something crawls out—four legs, one eye trying to classify Asuna and failing again and again within a second.
- **ID · Wolf:** Sejenis... tidak... sejenis... **tidak.**
- **EN · Wolf:** Like... no... like... **no.**
- **ID · ASUNA:** (Matanya tidak rusak. Cara ia **membaca** yang rusak.) Tunggu. Biar kutunjukkan padamu cara membacanya.
- **EN · ASUNA:** (Its eye isn't broken. The way it *reads* is.) Wait. Let me show you how to read it.

#### `win` — Bab 1
- **ID · Narasi:** Wolf meringkuk, dan matanya mengenali sesuatu. Dua baris bilangan di gerbang menyatu.
- **EN · Narration:** Wolf curls up, and its eye recognizes something. The two rows at the gate merge.
- **ID · Wolf:** ...Sejenis. Kau... sejenis dengan yang kucari.
- **EN · Wolf:** ...Alike. You... are like the one I was looking for.
- **ID · ASUNA:** Aturanmu pulang. Maafkan kami yang mengubahnya sebelum memahaminya.
- **EN · ASUNA:** Your rule has come home. Forgive us for changing it before we understood it.
- **ID · Narasi:** Gerbang terbuka. Di ujung koridor, samar, sebuah bahu berbaju biru menghilang di tikungan. Asuna menatap lama—lalu mencatat satu baris di tablet lengan bajunya.
- **EN · Narration:** The gate opens. At the corridor's end, faintly, a blue-armored shoulder vanishes around the bend. Asuna stares a long time—then writes one line on the tablet on her sleeve.

#### `lose` — Bab 1
- **ID · Narasi:** Asuna terjatuh, napasnya terputus. Gerbang tak bergerak—dua baris bilangan tetap menolak menyatu, dan Wolf menyerang tanpa mengenali.
- **EN · Narration:** Asuna falls, her breath cut short. The gate does not move—the two rows still refuse to merge, and Wolf strikes without recognizing.
- **ID · ASUNA:** (Aku membaca aturannya... tapi aku salah membaca *diriku*. Aku menahan yang seharusnya kulepas.) Bukan gerbangnya. Aku.
- **EN · ASUNA:** (I read the rule... but I misread *myself*. I held what I should have released.) Not the gate. Me.

### Bab 2 — Pabrik Pangkat (`Power Factory`)

#### `intro` — Beat 1 · Pabrik
- **ID · Narasi:** Pabrik itu bernafas. Angka tumbuh membesar di tiap pipa—2 menjadi 4, 4 menjadi 16—lalu pecah sebelum selesai.
- **EN · Narration:** The factory breathes. Numbers grow larger in every pipe—2 into 4, 4 into 16—then burst before finishing.
- **ID · ASUNA:** (Pangkat yang salah, dipaksa terus-menerus. Ini bukan pertumbuhan—ini kepanikan.)
- **EN · ASUNA:** (The wrong power, forced on and on. This is not growth—this is panic.)

#### `intro` — Beat 2 · Wraith (background)
- **ID · Narasi:** Sebuah bayangan berlipat tak berujung, tiap salinan mengulang gerakan yang persis sama.
- **EN · Narration:** A shadow folds endlessly, every copy repeating the exact same motion.
- **ID · Wraith:** Kalikan... kalikan... kalau berhenti, aturan hilang. Kalau aturan hilang, salahku.
- **EN · Wraith:** Multiply... multiply... if I stop, the rule is gone. If the rule is gone, it's my fault.
- **ID · ASUNA:** Kau menjaga sesuatu yang seharusnya bisa kau percayakan. Berhenti bukan berarti menyerah.
- **EN · ASUNA:** You guard something you should be able to entrust. Stopping is not surrender.

#### `win` — Bab 2
- **ID · Narasi:** Salinan-salinan mengendur menjadi satu. Pipa berhenti memaksa.
- **EN · Narration:** The copies slacken into one. The pipes stop forcing.
- **ID · ASUNA:** Kau boleh berhenti. Aku akan membaca aturan ini untukmu—agar kau tak perlu mengulangnya.
- **EN · ASUNA:** You may stop. I will read this rule for you—so you never have to repeat it.

#### `lose` — Bab 2
- **ID · Narasi:** Tumpukan angka menelan Asuna dalam pengulangan yang sama. Terlalu banyak untuk dibaca—terlalu cepat untuk dipahami.
- **EN · Narration:** A stack of numbers swallows Asuna in the same repetition. Too many to read—too fast to understand.
- **ID · ASUNA:** (Aku mencoba memahami semuanya sekaligus. Kau tidak bisa membaca tak berhingga. Satu suku dulu.)

### Bab 3 — Ruang Persamaan (`Equation Chamber`)

#### `intro` — Beat 1 · Ruang
- **ID · Narasi:** Ruang ini miring. Lantainya tanda sama-dengan; tanda tanya raksasa menggantung tak terjawab. Asuna meletakkan tangannya dan menahan sisi kanan dengan tubuhnya.
- **EN · Narration:** This chamber tilts. Its floor is an equals sign; a giant question mark hangs unanswered. Asuna lays her hand and holds the right side up with her body.
- **ID · ASUNA:** (Aku pernah berada di ruang seperti ini. Di kerajaanku. Saat aku lari.) Tidak. Kali ini aku tahan.
- **EN · ASUNA:** (I have been in a room like this. In my kingdom. When I fled.) No. This time I hold.
- **ID · ASUNA (berseru jauh):** Tahan sisi itu! Jangan ubah sebelum kau tahu nilainya!
- **EN · ASUNA (calling far):** Hold that side! Don't change it before you know its value!
- **ID · Narasi:** Sebuah bayangan berbaju biru muncul di ambang. Untuk sekali ini, orang itu—untuk pertama kalinya—berhenti sebelum menebas.
- **EN · Narration:** A blue-armored figure appears at the threshold. For once, that one—for the first time—stops before cutting.

#### `intro` — Beat 2 · Naga Persamaan (background)
- **ID · Narasi:** Naga membelit kedua sisi ruang seperti rantai hidup, menahan keseimbangan dengan seluruh tubuhnya.
- **EN · Narration:** The Drake coils around both sides like a living chain, holding balance with its whole body.
- **ID · Naga Persamaan:** Kau mengubah satu sisi. Keseimbangan akan hancur.
- **EN · Equation Drake:** You alter one side. The balance will collapse.
- **ID · ASUNA:** Aku tidak mengubahnya. Aku **memahaminya**. Keseimbangan yang tak boleh disentuh bukan keseimbangan—itu penjara.
- **EN · ASUNA:** I am not altering it. I am *understanding* it. A balance that must not be touched is not balance—it is a prison.

#### `win` — Bab 3
- **ID · Narasi:** Naga melepas belitannya. Ruang rata. Di lantai, jejak rumus Kazura tertulis tergesa—dan Asuna tersenyum tipis: *ternyata ia belajar bertanya.*
- **EN · Narration:** The Drake releases its coils. The chamber levels. On the floor, Kazura's formula trail is scrawled hastily—and Asuna smiles faintly: *so he learned to ask.*
- **ID · ASUNA:** (Kau mulai membaca. Bagus.)
- **EN · ASUNA:** (You're starting to read. Good.)

#### `lose` — Bab 3
- **ID · Narasi:** Ruang miring lebih jauh. Naga menahan Asuna sebagai "perusak keseimbangan". Ia kalah karena menahan terlalu lama, bukan karena salah membaca.
- **EN · Narration:** The chamber tilts further. The Drake holds Asuna as a "destroyer of balance". She lost from holding too long, not from misreading.
- **ID · ASUNA:** (Aku menahan keseimbangan orang lain sampai melupakan milikku sendiri.)

### Bab 4 — Kuil Pecahan (`Fraction Temple`)

#### `intro` — Beat 1 · Kuil
- **ID · Narasi:** Kuil pecah berkeping—serpihan batu melayang, masing-masing membawa sebagian dari satu keseluruhan. Rumput tumbuh di celah, mencoba menyatukan.
- **EN · Narration:** The temple lies in shards—stone fragments float, each carrying part of a whole. Grass grows in the cracks, trying to unite.
- **ID · ASUNA:** (Kerajaanku pernah seperti ini. Kepingan yang tak punya penyebut yang sama. Aku pergi sebelum mencoba menyamakannya.)
- **EN · ASUNA:** (My kingdom was once like this. Shards with no common denominator. I left before trying to equalize them.)

#### `intro` — Beat 2 · Titan (background)
- **ID · Narasi:** Sosok tulang setinggi menara berdiri, menghancurkan tiap serpihan yang mencoba mendekat.
- **EN · Narration:** A bone figure tower-tall stands, destroying every shard that tries to draw near.
- **ID · Titan:** Jangan susun. Keutuhan sudah mati bersama kuil ini.
- **EN · Titan:** Don't assemble. Wholeness died with this temple.
- **ID · ASUNA:** Aku tahu perasaan itu. Aku juga pernah yakin keutuhan mati. Tetapi merawat pecahan pun tetap menghubungkan. Kau sudah menyatukan mereka caramu sendiri.
- **EN · ASUNA:** I know that feeling. I too was once sure wholeness died. But tending the shards still connects them. You have been uniting them in your own way.

#### `win` — Bab 4
- **ID · Narasi:** Titan berlutut. Serpihan-serpihan mendekat, menemukan penyebut yang sama, dan mengunci diri menjadi satu dinding utuh.
- **EN · Narration:** Titan kneels. The shards draw close, find a common denominator, and lock into one whole wall.
- **ID · ASUNA:** (Jadi ini yang seharusnya kulakukan dulu. Bukan lari. Menyamakan.)
- **EN · ASUNA:** (So this is what I should have done back then. Not flee. Equalize.)

#### `lose` — Bab 4
- **ID · Narasi:** Titan meremukkan serpihan berikut Asuna di dalamnya. Ia menyusun sebelum menyamakan penyebut.
- **EN · Narration:** Titan crushes the shard with Asuna inside. She assembled before equalizing the denominators.
- **ID · ASUNA:** (Penyebut dulu. Selalu penyebut dulu. Aku tahu itu—kenapa aku melupakannya?)

### Bab 5 — Benteng Bayangan (`Shadow Fortress — FINAL BOSS`)

#### `intro` — Beat 1 · Benteng
- **ID · Narasi:** Benteng menggantung, tersusun dari aturan yang dicabut dari dunia. Di kakinya, seorang ksatria berbaju biru menunggu—dan kali ini, ia tidak menebas apa pun.
- **EN · Narration:** The fortress hangs, built from rules pulled from the world. At its foot, a blue-armored knight waits—and this time, he cuts nothing.

#### `intro` — Beat 2 · Bersatu
- **ID · KAZURA:** Kau lambat.
- **EN · KAZURA:** You're slow.
- **ID · ASUNA:** Kau yang menunggu.
- **EN · ASUNA:** You waited.
- **ID · KAZURA:** Aku membaca jejak rumusmu di tiga ruangan. Sepertinya kau yang mengajariku bertanya.
- **EN · KAZURA:** I read your formula trail in three rooms. Seems you're the one who taught me to ask.
- **ID · ASUNA:** Dan kau mengajariku berhenti ragu. Ayo. Kita baca pintu ini bersama.
- **EN · ASUNA:** And you taught me to stop hesitating. Come. We read this door together.
- **ID · Narasi:** Pedang dan kristal akhirnya sejajar.
- **EN · Narration:** Blade and crystal finally align.

#### `intro` — Beat 3 · Axiom (background)
- **ID · Narasi:** Pintu terbuka tanpa suara. Seorang penjaga duduk di atas singgasana dari hukum-hukum yang ia kumpulkan. Ia tidak berdiri.
- **EN · Narration:** The door opens without sound. A guardian sits on a throne of the laws he has gathered. He does not stand.
- **ID · Axiom:** Kalian datang menjawab. Dan semuanya salah—lalu aku harus melihat dunia runtuh lagi. Kosong lebih baik daripada salah selamanya.
- **EN · Axiom:** You come to answer. And everyone is wrong—then I must watch the world collapse again. Empty is better than forever wrong.
- **ID · ASUNA:** Aku pernah percaya itu. Hampir. Aku hampir meninggalkan kerajaanku karena menganggapnya sudah mati. Bacaanmu benar tentang masa lalu—dan salah tentang hari ini.
- **EN · ASUNA:** I once believed that. Almost. I almost abandoned my kingdom for thinking it was already dead. Your reading is right about the past—and wrong about today.

#### `win` — Bab 5
- **ID · Narasi:** Singgasana hancur—hukum-hukum yang ditahan lolos kembali ke langit, mencari tempatnya. Axiom akhirnya berdiri.
- **EN · Narration:** The throne shatters—the held laws escape back into the sky, seeking their place. Axiom finally stands.
- **ID · Axiom:** ...Aku lupa bagaimana rasanya percaya. Kalian berdua... menjawabnya. Bersama.
- **EN · Axiom:** ...I forgot what it felt like to believe. You two... answered it. Together.
- **ID · ASUNA:** Bukan karena jawabannya sempurna.
- **EN · ASUNA:** Not because the answer was perfect.
- **ID · KAZURA:** Tapi karena kami tidak berhenti sampai jawabannya ada.
- **EN · KAZURA:** But because we didn't stop until the answer existed.
- **ID · Narasi:** Di kejauhan, satu per satu, gerbang dunia terbuka kembali. Asuna menoleh ke tablet lengan bajunya—dan menulis baris terakhir.
- **EN · Narration:** In the distance, one by one, the world's gates open again. Asuna turns to the tablet on her sleeve—and writes the final line.

---

## Bagian 6 — Epilog (Identik Kedua Rute)

> **Judul:** "Lima `x`" — *Five x's*
> Diputar **setelah kontribusi Bab 5 selesai** (setelah `win` Bab 5), **sebelum** layar `Evaluation`. **Teks identik** untuk Rute Kazura dan Rute Asuna; hanya nama karakter yang tampil sebagai "aku" yang berbeda di kalimat pembuka (ditandai `{POV}`).

#### `epilogue` — Beat 1 · Langit
- **ID · Narasi:** Ketika benteng akhirnya jatuh, langit tidak kembali seperti semula. Ia menjadi lebih baik—bertambah satu baris yang sebelumnya tak ada: sebuah tanda sama-dengan yang tenang, tergantung jauh di atas.
- **EN · Narration:** When the fortress finally fell, the sky did not return as it was. It became better—one line added that hadn't been there before: a calm equals sign, hanging high above.

#### `epilogue` — Beat 2 · {POV}
- **ID · {POV}:** Namaku dikenal dunia sebagai {KAZURA/ASUNA}. Tapi yang kuingat dari akhir ini bukan namaku.
- **EN · {POV}:** The world knows me as {KAZURA/ASUNA}. But what I remember from this ending isn't my name.

#### `epilogue` — Beat 3 · Bersama
- **ID · Narasi:** Mereka berdiri berdampingan—pedang dan kristal—bukan karena takdir, tapi karena sebuah pilihan yang masing-masing buat berkali-kali: untuk tidak berhenti sebelum jawabannya ada.
- **EN · Narration:** They stand side by side—blade and crystal—not by fate, but by a choice each made again and again: not to stop before the answer existed.

#### `epilogue` — Beat 4 · Lima x
- **ID · ASUNA:** Kau tahu, di lima ruangan itu... kita menjawab lima hal yang berbeda. Suku sejenis. Pangkat. Persamaan. Pecahan. Dan aturan yang menahannya semua.
- **EN · ASUNA:** You know, in those five rooms... we answered five different things. Like terms. Powers. Equations. Fractions. And the rule that held them all.
- **ID · KAZURA:** Lima `x` yang berbeda. Tapi satu jawaban yang sama.
- **EN · KAZURA:** Five different `x`. But one and the same answer.
- **ID · ASUNA:** Jawabannya bukan angka.
- **EN · ASUNA:** The answer isn't a number.
- **ID · KAZURA:** Jawabannya adalah kita tidak berhenti.
- **EN · KAZURA:** The answer is that we didn't stop.

#### `epilogue` — Beat 5 · Penutup
- **ID · Narasi:** Di bawah langit yang kini penuh aturan yang pulang, dua jalan yang dulu berlawanan berjalan searah. Bukan karena keduanya menjadi sama—tapi karena keduanya akhirnya saling melengkapi.
- **EN · Narration:** Under a sky now full of rules come home, two roads that once opposed now walk the same way. Not because they became the same—but because they finally completed each other.
- **ID · Narasi:** **Dua jalan. Satu solusi.**
- **EN · Narration:** **Two roads. One solution.**
- **ID · Narasi:** *(Layar narasi menutup. Lanjut ke Evaluation.)*
- **EN · Narration:** *(Narrative screen closes. Proceeds to Evaluation.)*

---

## Bagian 7 — Lampiran (Teks Siap-Tempel)

### 7.1 `characterSelection.js` — blok `lore` (baris 22-35)

Ganti placeholder "*...masih menunggu untuk ditulis* / *...yet to be written*" dengan teks berikut.

**KAZURA (id: `traveler`)**
- **id:** `Seorang ksatria berbaju zirah biru dengan pedang kristal bernama Aletheia, yang membeku dari jawaban pertama yang pernah ia ucapkan. Selamat dari desa yang dihapus Void, ia memikul seluruh bebannya sendiri dan percaya bahwa setiap masalah pasti punya solusi.`
- **en:** `A knight in azure armor carrying a crystal sword named Aletheia, frozen from the first answer he ever spoke. Having survived a village erased by the Void, he carries every burden alone and believes every problem must have a solution.`

**ASUNA (id: `asuka`)**
- **id:** `Seorang pendekar dengan ornamen kristal dan busana kerajaan, pembaca terakhir tablet hukum kerajaannya sebelum Void meliputinya. Selamat justru karena melarikan diri, ia membawa rasa bersalah itu diam-diam dan percaya bahwa aturan yang rusak lebih baik diperbaiki daripada ditinggalkan.`
- **en:** `A spellblade adorned with crystals and royal attire, the last reader of her kingdom's tablet of laws before the Void engulfed it. Having survived precisely by fleeing, she carries that guilt quietly and believes a broken rule is better repaired than abandoned.`

### 7.2 Ringkasan Boss (rujukan cepat)

| Bab | Boss | Role | Element | HP | DMG | Skills |
|---|---|---|---|---|---|---|
| 1 | Wolf | Penjaga Gerbang | Shadow | 150 | 18 | Claw Strike · Dark Howl · Shadow Dash |
| 2 | Wraith | Penjaga Pabrik Pangkat | Shadow / Arc | 165 | 19 | Spectral Claw · Void Surge · Wraith Step |
| 3 | Naga Persamaan (Equation Drake) | Penjaga Ruang Persamaan | Arc / Lightning | 180 | 22 | Arc Breath · Equation Surge · Vector Rush |
| 4 | Titan | Penghancur Kuil Pecahan | Bone / Earth | 185 | 21 | Rib Crush · Bone Roar · Tomb Rush |
| 5 | Axiom | Penguasa Benteng Bayangan | Arc / Void | 210 | 24 | Axiom Break · Void Equation · Null Collapse |

### 7.3 Checklist Integrasi (ringkas)

- [x] `intro` diputar pada setiap kunjungan, termasuk rematch dan mulai ulang kampanye.
- [x] Skip panjang nonaktif sebelum battle pertama dimulai, lalu aktif pada kunjungan berikutnya dan tetap aktif setelah reset progress.
- [x] `win` / `lose` dipilih sesuai hasil battle (hanya satu yang diputar).
- [x] `epilogue` diputar setelah `win` Bab 5, sebelum `Evaluation`.
- [x] Kontrol beat: **Next · Lewati · Auto**.
- [x] `BattleQuestionPanel.jsx` memakai tampilan cerita untuk seluruh chapter 1–5.
- [x] Cutscene kampanye tidak mengubah pilihan roster multiplayer.

---

*Naskah ini adalah sumber kebenaran cerita. Perubahan alur sebaiknya diperbarui di sini lebih dulu, lalu diimplementasikan di kode.*
