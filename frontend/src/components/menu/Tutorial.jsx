import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SolvoxUtilityArt from '../shared/SolvoxUtilityArt';
import PixelIcon from '../shared/PixelIcon';
import useAnimatedDismiss from '../shared/useAnimatedDismiss';
import { LEVELS } from '../../data/levels';

const GUIDE = {
  id: {
    tabs: { start: 'Mulai', practice: 'Coba latihan', battle: 'Saat bertarung', multi: 'Multiplayer' },
    tabLabel: 'Bagian panduan',
    heroBadge: 'PANDUAN PEMAIN',
    heroNote: 'Belajar dulu, serang dengan yakin.',
    overviewTitle: 'Jalur menuju pertarungan',
    overviewIntro: 'Ikuti urutan ini saat bermain Single Player. Setiap chapter memiliki 10 soal dan satu boss.',
    route: ['Main', 'Single Player', 'Pilih chapter', 'Pilih karakter di Chapter 1', 'Mulai Stage'],
    startSteps: [
      { icon: 'map', title: 'Pilih chapter', body: 'Mulai dari chapter yang terbuka. Chapter berikutnya terbuka setelah kamu menyelesaikan chapter sebelumnya.' },
      { icon: 'profile', title: 'Pilih karakter sekali', body: 'Saat pertama kali membuka Chapter 1, pilih karakter lalu tekan Mulai Stage. Karakter ini dipakai sepanjang perjalanan chapter.' },
      { icon: 'sword', title: 'Selesaikan 10 soal', body: 'Baca misi, selesaikan simulasi, lalu jawab. Setiap jawaban benar menyerang boss. Targetkan sedikitnya 7 jawaban benar.' },
      { icon: 'chart', title: 'Pelajari hasilnya', body: 'Setelah ronde berakhir, buka evaluasi untuk melihat akurasi, petunjuk yang dipakai, dan soal yang perlu diulang.' },
    ],
    chapterTitle: 'Perjalanan chapter',
    practiceTitle: 'Coba satu soal tanpa risiko',
    practiceIntro: 'Latihan ini mencontohkan cara memilih operasi pada simulasi. HP dan progres permainanmu tidak berubah.',
    practiceStep: 'Langkah',
    practicePrompt: ['Apa yang kamu lakukan pada 2x + 4 = 12?', 'Sekarang bagaimana membuat x sendiri?', 'Nilai x sudah ditemukan. Masukkan hanya angkanya.'],
    practiceChoices: [
      [
        { label: 'Kurangi 4 pada ruas kiri saja', correct: false },
        { label: 'Kurangi 4 pada kedua ruas', correct: true },
        { label: 'Ubah +4 menjadi −4 begitu saja', correct: false },
      ],
      [
        { label: 'Bagi ruas kiri saja dengan 2', correct: false },
        { label: 'Langsung ubah 2x menjadi x', correct: false },
        { label: 'Bagi kedua ruas dengan 2', correct: true },
      ],
    ],
    practiceGood: 'Benar! Kedua ruas tetap setara. Lanjutkan langkah berikutnya.',
    practiceWrong: 'Belum tepat. Operasi yang sama harus diterapkan pada kedua ruas agar persamaan tetap setara.',
    practiceAnswerWrong: 'Coba lagi. Jika x = 4, ketik angka 4 saja pada kolom jawaban.',
    practiceAnswerPlaceholder: 'Nilai x',
    practiceAttack: 'Jawab & Serang',
    practiceDoneTitle: 'Serangan berhasil!',
    practiceDoneBody: 'Kamu menjaga persamaan tetap setara dan menemukan x = 4. Di arena, jawaban benar mengurangi HP boss.',
    practiceReset: 'Ulangi latihan',
    battleTitle: 'Kenali bagian arena',
    battleIntro: 'Urutannya selalu: baca soal → pilih langkah pada simulasi → isi jawaban → serang.',
    battleCards: [
      { icon: 'book', title: 'Baca misi dan konsep', body: 'Perhatikan cerita, pertanyaan, dan konsep pada panel soal. Pada Chapter 5, pilih model cerita yang benar sebelum menyelesaikan persamaan.' },
      { icon: 'shield', title: 'Jaga kedua ruas setara', body: 'Pilih operasi yang berlaku pada kedua ruas. Tombol Urungkan mengembalikan langkah sebelumnya. Jawaban baru aktif setelah simulasi selesai.' },
      { icon: 'keyboard', title: 'Isi nilai variabel', body: 'Ketik nilainya saja, misalnya 4. Kamu bisa memakai keyboard perangkat atau tombol Tampilkan keypad, lalu tekan Jawab & Serang.' },
      { icon: 'hint', title: 'Gunakan petunjuk saat buntu', body: 'Ada maksimal 3 petunjuk per soal. Biayanya berturut-turut 5, 10, dan 15 HP. Lihat sisa HP sebelum memakainya.' },
      { icon: 'retry', title: 'Salah? Baca umpan balik', body: 'Pilihan langkah atau jawaban yang keliru menampilkan penjelasan. Kesalahan itu tidak langsung mengurangi HP; perbaiki langkah lalu coba lagi.' },
      { icon: 'trophy', title: 'Baca evaluasi', body: 'Setelah pertarungan, tinjau soal yang keliru dan saran belajar sebelum mencoba chapter berikutnya.' },
    ],
    battleCallout: 'Tombol jawaban masih terkunci? Selesaikan semua langkah simulasi di atas arena terlebih dahulu.',
    multiTitle: 'Bermain bersama atau melawan bot',
    multiIntro: 'Pilih Multiplayer dari menu Main. Kamu bisa membuat room, membagikan kodenya, bergabung ke room teman, atau bermain melawan bot.',
    multiCards: [
      { icon: 'party', title: 'Buat atau gabung room', body: 'Pilih mode dan chapter saat membuat room. Bagikan kode room kepada teman; pemain yang bergabung memasukkan kode tersebut.' },
      { icon: 'check', title: 'Pilih karakter dan Ready', body: 'Setiap pemain memilih karakter sendiri. Pertandingan dimulai setelah kedua pemain menekan Ready. Melawan bot bisa dimulai tanpa menunggu teman.' },
      { icon: 'heart', title: 'Turn-Based Battle', body: 'Jawab secara bergiliran. Saat giliranmu, kamu mendapat 45 detik untuk menyelesaikan soal. Petunjuk dapat dipakai dengan biaya HP.' },
      { icon: 'chart', title: 'Score Duel', body: 'Kedua pemain menjawab soal yang sama dalam waktu yang sama. Pemenang ditentukan oleh skor jawaban, bukan siapa yang paling cepat mengetuk tombol.' },
    ],
    multiTip: 'Jika koneksi sempat terputus, kembali ke room yang sama untuk melanjutkan pertandingan selama sesi masih tersedia.',
    close: 'Tutup panduan',
    play: 'Mulai bermain',
  },
  en: {
    tabs: { start: 'Getting started', practice: 'Try a question', battle: 'In battle', multi: 'Multiplayer' },
    tabLabel: 'Guide sections',
    heroBadge: 'PLAYER GUIDE',
    heroNote: 'Learn the steps, then attack with confidence.',
    overviewTitle: 'Your path to the arena',
    overviewIntro: 'Follow these steps in Single Player. Each chapter has 10 questions and a boss.',
    route: ['Play', 'Single Player', 'Choose chapter', 'Choose fighter in Chapter 1', 'Start Stage'],
    startSteps: [
      { icon: 'map', title: 'Choose a chapter', body: 'Start with an unlocked chapter. The next chapter opens after you clear the previous one.' },
      { icon: 'profile', title: 'Choose your fighter once', body: 'The first time you open Chapter 1, choose a fighter and press Start Stage. You keep that fighter throughout the campaign.' },
      { icon: 'sword', title: 'Solve 10 questions', body: 'Read the mission, complete the simulation, then answer. Every correct answer attacks the boss. Aim for at least 7 correct answers.' },
      { icon: 'chart', title: 'Review your result', body: 'After the round, open the evaluation to see accuracy, hints used, and questions to revisit.' },
    ],
    chapterTitle: 'Chapter journey',
    practiceTitle: 'Try a question without risk',
    practiceIntro: 'This practice shows how to choose an operation in the simulation. It does not change your HP or game progress.',
    practiceStep: 'Step',
    practicePrompt: ['What should you do to 2x + 4 = 12?', 'How do you leave x on its own?', 'You have found x. Enter only its value.'],
    practiceChoices: [
      [
        { label: 'Subtract 4 from the left side only', correct: false },
        { label: 'Subtract 4 from both sides', correct: true },
        { label: 'Just change +4 into −4', correct: false },
      ],
      [
        { label: 'Divide the left side only by 2', correct: false },
        { label: 'Simply turn 2x into x', correct: false },
        { label: 'Divide both sides by 2', correct: true },
      ],
    ],
    practiceGood: 'Correct! Both sides stay equal. Continue to the next step.',
    practiceWrong: 'Not quite. Apply the same operation to both sides to keep the equation equal.',
    practiceAnswerWrong: 'Try again. When x = 4, type only 4 in the answer field.',
    practiceAnswerPlaceholder: 'Value of x',
    practiceAttack: 'Answer & Attack',
    practiceDoneTitle: 'Attack successful!',
    practiceDoneBody: 'You kept the equation balanced and found x = 4. In the arena, a correct answer reduces the boss HP.',
    practiceReset: 'Repeat practice',
    battleTitle: 'Know your arena',
    battleIntro: 'The flow is always: read the question → choose simulation steps → enter the answer → attack.',
    battleCards: [
      { icon: 'book', title: 'Read the mission and concept', body: 'Check the story, question, and concept in the question panel. In Chapter 5, choose the correct story model before solving the equation.' },
      { icon: 'shield', title: 'Keep both sides equal', body: 'Choose an operation that applies to both sides. Undo returns to the previous step. The answer field unlocks after the simulation is complete.' },
      { icon: 'keyboard', title: 'Enter the variable value', body: 'Type only the value, such as 4. Use your device keyboard or Show keypad, then press Answer & Attack.' },
      { icon: 'hint', title: 'Use hints when stuck', body: 'You can reveal up to 3 hints per question. They cost 5, 10, and 15 HP in order. Check your remaining HP first.' },
      { icon: 'retry', title: 'Wrong? Read the feedback', body: 'An incorrect step or answer gives an explanation. It does not immediately cost HP; correct your work and try again.' },
      { icon: 'trophy', title: 'Read the evaluation', body: 'After battle, review missed questions and learning suggestions before trying the next chapter.' },
    ],
    battleCallout: 'Answer field still locked? Complete every simulation step above the arena first.',
    multiTitle: 'Play with a friend or a bot',
    multiIntro: 'Choose Multiplayer from Play. Create a room and share its code, join a friend’s room, or play against a bot.',
    multiCards: [
      { icon: 'party', title: 'Create or join a room', body: 'Choose a mode and chapter when creating a room. Share its code with a friend; the joining player enters that code.' },
      { icon: 'check', title: 'Choose a fighter and Ready', body: 'Each player chooses a fighter. The match begins once both players press Ready. A bot match does not require waiting for a friend.' },
      { icon: 'heart', title: 'Turn-Based Battle', body: 'Players answer in turns. You get 45 seconds to solve the question on your turn. Hints are available at an HP cost.' },
      { icon: 'chart', title: 'Score Duel', body: 'Both players answer the same questions with the same time limit. The winner is decided by answer score, not who taps first.' },
    ],
    multiTip: 'If your connection drops, return to the same room to resume while the session is still available.',
    close: 'Close guide',
    play: 'Start playing',
  },
};

const EQUATIONS = [['2x + 4', '12'], ['2x', '8'], ['x', '4']];
const TAB_ICONS = { start: 'map', practice: 'shield', battle: 'sword', multi: 'party' };

function GuideCards({ items }) {
  return <div className="tutorial-guide-grid">
    {items.map(({ icon, title, body }, index) => <article className="tutorial-guide-card" key={title}>
      <span className="tutorial-guide-icon"><PixelIcon name={icon} size={21}/></span>
      <div><small>{String(index + 1).padStart(2, '0')}</small><h4>{title}</h4><p>{body}</p></div>
    </article>)}
  </div>;
}

export default function Tutorial({ t, lang = 'id', onClose, onPlay }) {
  const { closing, dismiss } = useAnimatedDismiss(onClose);
  const c = GUIDE[lang === 'en' ? 'en' : 'id'];
  const [section, setSection] = useState('start');
  const [practiceStep, setPracticeStep] = useState(0);
  const [practiceAnswer, setPracticeAnswer] = useState('');
  const [practiceMessage, setPracticeMessage] = useState(null);
  const cardRef = useRef(null);
  const bodyRef = useRef(null);
  const onCloseRef = useRef(dismiss);

  useEffect(() => { onCloseRef.current = dismiss; }, [dismiss]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { onCloseRef.current?.(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...cardRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')];
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = 'hidden';
    cardRef.current?.querySelector('.tutorial-close')?.focus();
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.();
    };
  }, []);

  const openSection = (next) => {
    setSection(next);
    bodyRef.current?.scrollTo({ top: 0 });
  };
  const choosePractice = (choice) => {
    if (!choice.correct) { setPracticeMessage({ good: false, text: c.practiceWrong }); return; }
    setPracticeStep((step) => step + 1);
    setPracticeMessage({ good: true, text: c.practiceGood });
  };
  const submitPractice = (event) => {
    event.preventDefault();
    if (practiceAnswer.trim() !== '4') { setPracticeMessage({ good: false, text: c.practiceAnswerWrong }); return; }
    setPracticeStep(3);
    setPracticeMessage(null);
  };
  const resetPractice = () => { setPracticeStep(0); setPracticeAnswer(''); setPracticeMessage(null); };

  return createPortal(
    <div className={`tutorial-backdrop${closing ? ' is-closing' : ''}`} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) dismiss(); }}>
      <section className="tutorial-card" ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
        <header className="tutorial-head">
          <div className="tutorial-hero-copy">
            <span className="tutorial-kicker"><PixelIcon name="book" size={17}/>{t('tutorialKicker')}</span>
            <h2 id="tutorial-title">{t('tutorialTitle')}</h2>
            <p>{t('tutorialIntro')}</p>
            <span className="tutorial-hero-note">{c.heroNote}</span>
          </div>
          <div className="tutorial-hero-art" aria-hidden="true"><small>{c.heroBadge}</small><div><span>2x + 4</span><b>=</b><span>12</span></div><i/><em>x = 4</em></div>
          <button className="tutorial-close" type="button" onClick={() => dismiss()} aria-label={t('close')} title={t('close')}><SolvoxUtilityArt name="close" size={18}/></button>
        </header>

        <nav className="tutorial-tabs" aria-label={c.tabLabel}>
          {Object.entries(c.tabs).map(([key, label]) => <button key={key} type="button" className={section === key ? 'active' : ''} aria-pressed={section === key} onClick={() => openSection(key)}><PixelIcon name={TAB_ICONS[key]} size={17}/><span>{label}</span></button>)}
        </nav>

        <div className="tutorial-body" ref={bodyRef}>
          {section === 'start' && <section className="tutorial-section" aria-label={c.overviewTitle}>
            <div className="tutorial-section-heading"><span className="tutorial-section-symbol"><PixelIcon name="map" size={23}/></span><div><h3>{c.overviewTitle}</h3><p>{c.overviewIntro}</p></div></div>
            <div className="tutorial-route" aria-label={c.route.join(' → ')}>{c.route.map((label, index) => <React.Fragment key={label}><span>{label}</span>{index < c.route.length - 1 && <PixelIcon name="right" size={14}/>}</React.Fragment>)}</div>
            <GuideCards items={c.startSteps}/>
            <div className="tutorial-chapters"><b>{c.chapterTitle}</b><div>{LEVELS.map((level) => <span key={level.id}><small>{String(level.id).padStart(2, '0')}</small>{lang === 'en' ? level.titleEn : level.title}</span>)}</div></div>
          </section>}

          {section === 'practice' && <section className="tutorial-section" aria-label={c.practiceTitle}>
            <div className="tutorial-section-heading"><span className="tutorial-section-symbol"><PixelIcon name="shield" size={23}/></span><div><h3>{c.practiceTitle}</h3><p>{c.practiceIntro}</p></div></div>
            <div className="tutorial-practice">
              <div className="tutorial-practice-top"><span>{c.practiceStep} {Math.min(practiceStep + 1, 3)} / 3</span><div aria-label={`${Math.min(practiceStep, 3)}/3`}>{[0, 1, 2].map((step) => <i key={step} className={practiceStep > step ? 'done' : practiceStep === step ? 'current' : ''}/>)}</div></div>
              {practiceStep < 3 ? <>
                <div className="tutorial-equation" aria-label={EQUATIONS[practiceStep].join(' = ')}><span>{EQUATIONS[practiceStep][0]}</span><b>=</b><span>{EQUATIONS[practiceStep][1]}</span></div>
                <p className="tutorial-practice-prompt">{c.practicePrompt[practiceStep]}</p>
                {practiceStep < 2 ? <div className="tutorial-practice-choices">{c.practiceChoices[practiceStep].map((choice) => <button key={choice.label} type="button" onClick={() => choosePractice(choice)}>{choice.label}</button>)}</div> : <form className="tutorial-practice-answer" onSubmit={submitPractice}><label><PixelIcon name="keyboard" size={17}/><input value={practiceAnswer} onChange={(event) => setPracticeAnswer(event.target.value)} inputMode="numeric" autoComplete="off" aria-label={c.practiceAnswerPlaceholder} placeholder={c.practiceAnswerPlaceholder}/></label><button type="submit" disabled={!practiceAnswer.trim()}><PixelIcon name="sword" size={17}/>{c.practiceAttack}</button></form>}
                {practiceMessage && <p className={`tutorial-practice-feedback ${practiceMessage.good ? 'good' : 'bad'}`} role="status">{practiceMessage.text}</p>}
              </> : <div className="tutorial-practice-done"><span><PixelIcon name="trophy" size={32}/></span><h4>{c.practiceDoneTitle}</h4><p>{c.practiceDoneBody}</p><button type="button" onClick={resetPractice}><PixelIcon name="retry" size={16}/>{c.practiceReset}</button></div>}
            </div>
          </section>}

          {section === 'battle' && <section className="tutorial-section" aria-label={c.battleTitle}>
            <div className="tutorial-section-heading"><span className="tutorial-section-symbol"><PixelIcon name="sword" size={23}/></span><div><h3>{c.battleTitle}</h3><p>{c.battleIntro}</p></div></div>
            <GuideCards items={c.battleCards}/>
            <div className="tutorial-callout"><PixelIcon name="hint" size={19}/><p>{c.battleCallout}</p></div>
          </section>}

          {section === 'multi' && <section className="tutorial-section" aria-label={c.multiTitle}>
            <div className="tutorial-section-heading"><span className="tutorial-section-symbol"><PixelIcon name="party" size={23}/></span><div><h3>{c.multiTitle}</h3><p>{c.multiIntro}</p></div></div>
            <GuideCards items={c.multiCards}/>
            <div className="tutorial-callout"><PixelIcon name="hint" size={19}/><p>{c.multiTip}</p></div>
          </section>}
        </div>

        <footer className="tutorial-footer"><span><PixelIcon name="spark" size={18}/>{c.heroNote}</span><div><button type="button" className="tutorial-dismiss" onClick={() => dismiss()} aria-label={c.close}>{t('tutorialGotIt')}</button><button type="button" className="tutorial-action" onClick={() => dismiss(onPlay)}><PixelIcon name="play" size={16}/>{c.play}</button></div></footer>
      </section>
    </div>,
    document.body,
  );
}
