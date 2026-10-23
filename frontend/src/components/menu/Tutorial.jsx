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
    overviewIntro: 'Ikuti lima langkah ini: buka Main, pilih Single Player, lalu pilih chapter yang terbuka. Jawab soal untuk menyerang boss dan lihat hasilmu setelah ronde.',
    route: ['Main', 'Single Player', 'Pilih chapter', 'Pilih karakter di Chapter 1', 'Mulai Stage'],
    startSteps: [
      { icon: 'map', title: 'Pilih chapter yang terbuka', body: 'Mulai dari Chapter 1. Selesaikan satu chapter untuk membuka chapter berikutnya.' },
      { icon: 'profile', title: 'Pilih karaktermu', body: 'Pilih Kazura atau Asuna di Chapter 1, lalu tekan Mulai Stage. Pilihan ini menemanimu sepanjang campaign.' },
      { icon: 'sword', title: 'Jawab soal untuk menyerang', body: 'Baca soal dan selesaikan langkah simulasinya. Masukkan nilai x, lalu tekan Jawab & Serang. Jawaban benar mengurangi HP boss.' },
      { icon: 'chart', title: 'Lihat hasil dan lanjutkan', body: 'Evaluasi menunjukkan jawaban, petunjuk yang dipakai, dan materi untuk diulang. Kalahkan boss untuk membuka chapter berikutnya.' },
    ],
    chapterTitle: 'Perjalanan chapter',
    practiceTitle: 'Coba timbangan dan ubin',
    practiceIntro: 'Seret ubin dari kotak opsi ke piring. Ubin dalam timbangan hanya bisa digeser ke ruas lain. Ubin −1 akan meniadakan satu ubin +1 pada piring yang sama. Latihan ini tidak mengubah HP atau progres.',
    practicePanLeft: 'Ruas kiri',
    practicePanRight: 'Ruas kanan',
    practiceTileTray: 'Kotak opsi · seret +1 atau −1 ke piring',
    practiceDragHint: 'Seret −1 ke tiap piring. Setiap −1 meniadakan satu +1. Ubin di piring hanya bisa digeser ke ruas lain.',
    practiceBalance: 'Seimbang',
    practiceLeftHeavy: 'Ruas kiri lebih berat',
    practiceRightHeavy: 'Ruas kanan lebih berat',
    practiceAddLeft: 'Tambah kiri',
    practiceAddRight: 'Tambah kanan',
    practiceUndo: 'Urungkan',
    practiceDragWrong: 'Jatuhkan ubin dari kotak opsi ke salah satu piring.',
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
    practiceAnswerWrong: 'Tambahkan −1 pada kedua ruas sampai tersisa x = 7, lalu masukkan angka 7.',
    practiceAnswerPlaceholder: 'Nilai x',
    practiceAttack: 'Jawab & Serang',
    practiceDoneTitle: 'Serangan berhasil!',
    practiceDoneBody: 'Kamu menjaga persamaan tetap setara dan menemukan x = 7. Di arena, jawaban benar mengurangi HP boss.',
    practiceReset: 'Ulangi latihan',
    battleTitle: 'Kenali bagian arena',
    battleIntro: 'Selesaikan langkah simulasi sampai kolom jawaban terbuka. Masukkan nilai variabel, pilih Jawab & Serang, lalu gunakan umpan balik untuk memperbaiki jawaban.',
    battleCards: [
      { icon: 'book', title: 'Baca misi dan konsep', body: 'Perhatikan cerita, pertanyaan, dan konsep pada panel soal. Pada Chapter 5, pilih model cerita yang benar sebelum menyelesaikan persamaan.' },
      { icon: 'shield', title: 'Jaga kedua ruas setara', body: 'Terapkan operasi yang sama pada kedua ruas. Tombol Urungkan memulihkan langkah sebelumnya. Jawaban aktif setelah simulasi selesai.' },
      { icon: 'spark', title: 'Seret dan jatuhkan ubin', body: 'Pada mode timbangan, seret ubin dari kotak opsi ke piring. Pasangkan ubin bernilai lawan pada piring yang sama agar keduanya hilang; lakukan operasi setara pada ruas lain.' },
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
      { icon: 'heart', title: 'Turn-Based Battle', body: 'Jawab secara bergiliran. Waktu tiap giliran bertambah sesuai chapter: 45, 60, 75, 90, lalu 105 detik. Petunjuk dapat dipakai dengan biaya HP.' },
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
    overviewIntro: 'Follow these five steps: open Play, choose Single Player, then choose an unlocked chapter. Solve questions to attack the boss and review your result after the round.',
    route: ['Play', 'Single Player', 'Choose chapter', 'Choose fighter in Chapter 1', 'Start Stage'],
    startSteps: [
      { icon: 'map', title: 'Choose an unlocked chapter', body: 'Start with Chapter 1. Clear a chapter to unlock the next one.' },
      { icon: 'profile', title: 'Choose your fighter', body: 'Choose Kazura or Asuna in Chapter 1, then press Start Stage. Your choice stays with you throughout the campaign.' },
      { icon: 'sword', title: 'Solve questions to attack', body: 'Read the question and finish its simulation. Enter the value of x, then press Answer & Attack. Correct answers reduce the boss HP.' },
      { icon: 'chart', title: 'Review and continue', body: 'The evaluation shows your answers, hints used, and topics to revisit. Defeat the boss to unlock the next chapter.' },
    ],
    chapterTitle: 'Chapter journey',
    practiceTitle: 'Try the scale and tiles',
    practiceIntro: 'Drag a tile from the tray onto a pan. Tiles on a pan can only move to the other side. A −1 tile cancels one +1 tile on the same pan. This practice does not change your HP or progress.',
    practicePanLeft: 'Left side',
    practicePanRight: 'Right side',
    practiceTileTray: 'Tile tray · drag +1 or −1 to a pan',
    practiceDragHint: 'Drag −1 onto each pan. Each −1 cancels a +1. Tiles on a pan can only move to the other side.',
    practiceBalance: 'Balanced',
    practiceLeftHeavy: 'Left side is heavier',
    practiceRightHeavy: 'Right side is heavier',
    practiceAddLeft: 'Add to left',
    practiceAddRight: 'Add to right',
    practiceUndo: 'Undo',
    practiceDragWrong: 'Drop a tile from the tray onto either pan.',
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
    practiceAnswerWrong: 'Add −1 to both sides until the equation is x = 7, then enter 7.',
    practiceAnswerPlaceholder: 'Value of x',
    practiceAttack: 'Answer & Attack',
    practiceDoneTitle: 'Attack successful!',
    practiceDoneBody: 'You kept the equation balanced and found x = 7. In the arena, a correct answer reduces the boss HP.',
    practiceReset: 'Repeat practice',
    battleTitle: 'Know your arena',
    battleIntro: 'Complete the simulation steps to unlock the answer field. Enter the variable value, choose Answer & Attack, then use the feedback to improve your answer.',
    battleCards: [
      { icon: 'book', title: 'Read the mission and concept', body: 'Check the story, question, and concept in the question panel. In Chapter 5, choose the correct story model before solving the equation.' },
      { icon: 'shield', title: 'Keep both sides equal', body: 'Apply the same operation to both sides. Undo restores the previous step. The answer field unlocks after the simulation is complete.' },
      { icon: 'spark', title: 'Drag and drop tiles', body: 'In balance mode, drag a tile from the tray onto a pan. Opposite values on the same pan cancel each other; apply an equal operation to the other side.' },
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
      { icon: 'heart', title: 'Turn-Based Battle', body: 'Players answer in turns. The time per turn increases by chapter: 45, 60, 75, 90, then 105 seconds. Hints are available at an HP cost.' },
      { icon: 'chart', title: 'Score Duel', body: 'Both players answer the same questions with the same time limit. The winner is decided by answer score, not who taps first.' },
    ],
    multiTip: 'If your connection drops, return to the same room to resume while the session is still available.',
    close: 'Close guide',
    play: 'Start playing',
  },
};

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
  const [leftUnits, setLeftUnits] = useState(3);
  const [rightUnits, setRightUnits] = useState(10);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [practiceDrag, setPracticeDrag] = useState(null);
  const [practiceSelectedTile, setPracticeSelectedTile] = useState(-1);
  const practiceDragRef = useRef(null);
  const cardRef = useRef(null);
  const bodyRef = useRef(null);
  const onCloseRef = useRef(dismiss);

  useEffect(() => { onCloseRef.current = dismiss; }, [dismiss]);
  useEffect(() => () => practiceDragRef.current?.cleanup?.(), []);
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
  const submitPractice = (event) => {
    event.preventDefault();
    if (!practiceSolved || practiceAnswer.trim() !== '7') { setPracticeMessage({ good: false, text: c.practiceAnswerWrong }); return; }
    setPracticeStep(3);
    setPracticeMessage(null);
  };
  const rememberPracticeBoard = () => setPracticeHistory((history) => [...history, { leftUnits, rightUnits }]);
  const addPracticeUnit = (side, value) => {
    rememberPracticeBoard();
    if (side === 'left') setLeftUnits((count) => count + value);
    else setRightUnits((count) => count + value);
    setPracticeMessage(null);
  };
  const movePracticeUnit = (from, to, value) => {
    rememberPracticeBoard();
    if (from === 'left') setLeftUnits((count) => count - value);
    else setRightUnits((count) => count - value);
    if (to === 'left') setLeftUnits((count) => count + value);
    else setRightUnits((count) => count + value);
    setPracticeMessage(null);
  };
  const undoPractice = () => {
    const previous = practiceHistory[practiceHistory.length - 1];
    if (!previous) return;
    setLeftUnits(previous.leftUnits);
    setRightUnits(previous.rightUnits);
    setPracticeHistory((history) => history.slice(0, -1));
    setPracticeMessage(null);
  };
  const handlePracticePointerDown = (event, value, source = 'tray', fromSide = null) => {
    event.preventDefault();
    practiceDragRef.current?.cleanup?.();
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    const drag = { pointerId, startX, startY, moved: false, source, fromSide, cleanup: null };
    practiceDragRef.current = drag;
    setPracticeDrag({ label: value < 0 ? '−1' : '+1', x: startX, y: startY });
    const move = (moveEvent) => {
      if (moveEvent.pointerId !== pointerId || practiceDragRef.current !== drag) return;
      if (Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) > 7) drag.moved = true;
      setPracticeDrag({ label: value < 0 ? '−1' : '+1', x: moveEvent.clientX, y: moveEvent.clientY });
    };
    const finish = (upEvent) => {
      if (upEvent.pointerId !== pointerId || practiceDragRef.current !== drag) return;
      const pan = document.elementFromPoint(upEvent.clientX, upEvent.clientY)?.closest('[data-tutorial-pan]')?.dataset.tutorialPan;
      drag.cleanup();
      practiceDragRef.current = null;
      setPracticeDrag(null);
      if (!drag.moved) return;
      if (source === 'tray' && pan) addPracticeUnit(pan, value);
      else if (source === 'pan' && pan && pan !== fromSide) movePracticeUnit(fromSide, pan, value);
      else if (source === 'tray') setPracticeMessage({ good: false, text: c.practiceDragWrong });
    };
    const cancel = () => {
      drag.cleanup();
      practiceDragRef.current = null;
      setPracticeDrag(null);
    };
    drag.cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', cancel);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', cancel);
  };
  const resetPractice = () => {
    setPracticeStep(0);
    setPracticeAnswer('');
    setPracticeMessage(null);
    setLeftUnits(3);
    setRightUnits(10);
    setPracticeHistory([]);
    setPracticeSelectedTile(-1);
  };
  const balanceDelta = 7 + leftUnits - rightUnits;
  const practiceSolved = leftUnits === 0 && rightUnits === 7;
  const pairedRemovals = Math.max(0, Math.min(3, 3 - leftUnits, 10 - rightUnits));
  const practiceLeftExpression = leftUnits > 0 ? `x + ${leftUnits}` : leftUnits < 0 ? `x − ${Math.abs(leftUnits)}` : 'x';

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
          <div className="tutorial-hero-art" aria-hidden="true"><small>{c.heroBadge}</small><div><span>x + 3</span><b>=</b><span>10</span></div><i/><em>x = 7</em></div>
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
              <div className="tutorial-practice-top"><span>{c.practiceStep} {practiceSolved ? 3 : Math.min(2, pairedRemovals + 1)} / 3</span><div aria-label={`${pairedRemovals}/3`}>{[0, 1, 2].map((step) => <i key={step} className={3 - leftUnits > step && 10 - rightUnits > step ? 'done' : 3 - leftUnits === step || 10 - rightUnits === step ? 'current' : ''}/>)}</div></div>
              {practiceStep < 3 ? <>
                <div className="tutorial-practice-equation" aria-label={`${practiceLeftExpression} = ${rightUnits}`}><span>{practiceLeftExpression}</span><b>=</b><span>{rightUnits}</span></div>
                <p className="tutorial-practice-prompt">{c.practiceDragHint}</p>
                <div className={`tutorial-balance-stage ${balanceDelta > 0 ? 'is-left-heavy' : balanceDelta < 0 ? 'is-right-heavy' : 'is-level'}`}>
                  <div className="tutorial-balance-beam" aria-hidden="true"><i/></div>
                  <div className="tutorial-balance-pans">
                    <div className="tutorial-balance-pan" data-tutorial-pan="left">
                      <small>{c.practicePanLeft}</small>
                      <div className="tutorial-balance-tiles"><span className="tutorial-x-tile">x</span>{Array.from({ length: Math.abs(leftUnits) }, (_, index) => <button key={`left-${index}`} type="button" className={`tutorial-unit-tile ${leftUnits < 0 ? 'is-negative' : ''}`} aria-label={leftUnits < 0 ? '−1, geser ke ruas lain' : '+1, geser ke ruas lain'} onPointerDown={(event) => handlePracticePointerDown(event, leftUnits < 0 ? -1 : 1, 'pan', 'left')}>{leftUnits < 0 ? '−1' : '+1'}</button>)}</div>
                      <strong>{practiceLeftExpression}</strong>
                    </div>
                    <span className="tutorial-balance-equals" aria-hidden="true">=</span>
                    <div className="tutorial-balance-pan" data-tutorial-pan="right">
                      <small>{c.practicePanRight}</small>
                      <div className="tutorial-balance-tiles">{Array.from({ length: Math.abs(rightUnits) }, (_, index) => <button key={`right-${index}`} type="button" className={`tutorial-unit-tile ${rightUnits < 0 ? 'is-negative' : ''}`} aria-label={rightUnits < 0 ? '−1, geser ke ruas lain' : '+1, geser ke ruas lain'} onPointerDown={(event) => handlePracticePointerDown(event, rightUnits < 0 ? -1 : 1, 'pan', 'right')}>{rightUnits < 0 ? '−1' : '+1'}</button>)}</div>
                      <strong>{rightUnits}</strong>
                    </div>
                  </div>
                  <div className="tutorial-balance-meter" role="status" aria-live="polite"><span className={balanceDelta > 0 ? 'left' : balanceDelta < 0 ? 'right' : 'center'}/><small>{balanceDelta > 0 ? c.practiceLeftHeavy : balanceDelta < 0 ? c.practiceRightHeavy : c.practiceBalance}</small></div>
                </div>
                <div className="tutorial-tile-tray"><strong>{c.practiceTileTray}</strong><div>{[1, -1].map((value) => <button key={value} type="button" className={`tutorial-unit-tile is-tray ${value < 0 ? 'is-negative' : ''} ${practiceSelectedTile === value ? 'is-selected' : ''}`} onPointerDown={(event) => handlePracticePointerDown(event, value)} onClick={() => setPracticeSelectedTile(value)} aria-label={`${value < 0 ? '−1' : '+1'} ${c.practiceTileTray}`}>{value < 0 ? '−1' : '+1'}</button>)}<button type="button" onClick={() => addPracticeUnit('left', practiceSelectedTile)}>{c.practiceAddLeft} {practiceSelectedTile < 0 ? '−1' : '+1'}</button><button type="button" onClick={() => addPracticeUnit('right', practiceSelectedTile)}>{c.practiceAddRight} {practiceSelectedTile < 0 ? '−1' : '+1'}</button></div></div>
                <div className="tutorial-practice-actions"><button type="button" onClick={undoPractice} disabled={!practiceHistory.length}><PixelIcon name="retry" size={15}/>{c.practiceUndo}</button>{practiceSolved && <form className="tutorial-practice-answer" onSubmit={submitPractice}><label><PixelIcon name="keyboard" size={17}/><input value={practiceAnswer} onChange={(event) => setPracticeAnswer(event.target.value)} inputMode="numeric" autoComplete="off" aria-label={c.practiceAnswerPlaceholder} placeholder={c.practiceAnswerPlaceholder}/></label><button type="submit" disabled={!practiceAnswer.trim()}><PixelIcon name="sword" size={17}/>{c.practiceAttack}</button></form>}</div>
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
          {practiceDrag && <span className="tutorial-drag-ghost" style={{ left: practiceDrag.x, top: practiceDrag.y }}>{practiceDrag.label}</span>}
        </div>

        <footer className="tutorial-footer"><span><PixelIcon name="spark" size={18}/>{c.heroNote}</span><div><button type="button" className="tutorial-dismiss" onClick={() => dismiss()} aria-label={c.close}>{t('tutorialGotIt')}</button><button type="button" className="tutorial-action" onClick={() => dismiss(onPlay)}><PixelIcon name="play" size={16}/>{c.play}</button></div></footer>
      </section>
    </div>,
    document.body,
  );
}
