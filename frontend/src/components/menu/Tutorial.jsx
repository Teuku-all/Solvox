import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import SolvoxUtilityArt from '../shared/SolvoxUtilityArt';
import PixelIcon from '../shared/PixelIcon';
import BalanceScale from '../shared/BalanceScale';
import useAnimatedDismiss from '../shared/useAnimatedDismiss';
import { LEVELS } from '../../data/levels';
import { getChapterGuide } from '../../data/chapterGuide';

const GUIDE = {
  id: {
    tabs: { start: 'Mulai', practice: 'Coba latihan', battle: 'Saat bertarung', multi: 'Multiplayer' },
    tabNotes: { start: 'Kenali alur permainan', practice: 'Belajar lewat simulasi', battle: 'Pahami cara menyerang', multi: 'Tantang teman atau bot' },
    quickTitle: 'Baru pertama bermain?',
    quickBody: 'Coba latihan singkat untuk memahami timbangan. Bebas mencoba, tanpa kehilangan HP.',
    quickAction: 'Coba latihan sekarang',
    chapterHint: 'Pilih chapter untuk melihat langkah bermainnya.',
    next: 'Berikutnya',
    practiceStatus: ['Kurangi 1 di kedua ruas', 'Lanjutkan sampai x sendiri', 'Masukkan nilai x', 'Latihan selesai'],
    tabLabel: 'Bagian panduan',
    heroBadge: 'PANDUAN PEMAIN',
    heroNote: 'Belajar dulu, serang dengan yakin.',
    overviewTitle: 'Jalur menuju pertarungan',
    overviewIntro: 'Ikuti lima langkah ini: buka Main, pilih Single Player, lalu pilih chapter yang tersedia. Selesaikan simulasi untuk menyerang boss dan lihat evaluasi setelah bertarung.',
    route: ['Main', 'Single Player', 'Pilih chapter', 'Pilih karakter di Chapter 1', 'Mulai Stage'],
    startSteps: [
      { icon: 'map', title: 'Pilih chapter', body: 'Mulai dari Chapter 1 untuk belajar dasar. Di perangkat lokal, semua chapter dapat langsung dicoba.' },
      { icon: 'profile', title: 'Pilih karaktermu', body: 'Pilih Kazura atau Asuna di Chapter 1, lalu tekan Mulai Stage. Pilihan ini menemanimu sepanjang campaign.' },
      { icon: 'sword', title: 'Selesaikan soal untuk menyerang', body: 'Buka simulasi dan selesaikan semua langkah. Pada setiap chapter, karakter menyerang otomatis saat persamaan selesai.' },
      { icon: 'chart', title: 'Lihat hasil dan lanjutkan', body: 'Evaluasi merangkum langkah yang selesai, koreksi selama simulasi, dan materi untuk dilatih lagi.' },
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
    practiceDoneBody: 'Kamu menjaga persamaan tetap setara dan menemukan x = 7. Di arena, simulasi yang selesai membuat karaktermu menyerang otomatis.',
    practiceReset: 'Ulangi latihan',
    battleTitle: 'Kenali bagian arena',
    battleIntro: 'Baca soal, buka simulasi, lalu selesaikan persamaan. Chapter 1 sampai 5 menyerang otomatis setelah simulasi selesai.',
    battleCards: [
      { icon: 'book', title: 'Baca misi dan konsep', body: 'Perhatikan cerita, pertanyaan, dan petunjuk singkat pada panel soal. Pada Chapter 5, rakit persamaan dengan kepingan sebelum memakai timbangan.' },
      { icon: 'shield', title: 'Jaga kedua ruas setara', body: 'Terapkan operasi yang sama pada kedua ruas. Tombol Urungkan memulihkan langkah sebelumnya.' },
      { icon: 'spark', title: 'Seret dan jatuhkan ubin', body: 'Pada mode timbangan, seret ubin dari kotak opsi ke piring. Pasangkan ubin bernilai lawan pada piring yang sama agar keduanya hilang; lakukan operasi setara pada ruas lain.' },
      { icon: 'sword', title: 'Serang secara otomatis', body: 'Setelah persamaan selesai, hasil terisi otomatis dan karakter langsung menyerang monster.' },
      { icon: 'retry', title: 'Perbaiki langkah yang keliru', body: 'Jika langkah simulasi keliru, boss menyerang dan HP berkurang. Coba lagi dengan operasi yang tepat.' },
      { icon: 'trophy', title: 'Baca evaluasi', body: 'Setelah pertarungan, tinjau langkah yang perlu diperbaiki sebelum mencoba chapter berikutnya.' },
    ],
    battleCallout: 'Simulasi tertutup sebelum selesai? Ketuk tombol di bawah soal untuk membukanya kembali.',
    multiTitle: 'Bermain bersama atau melawan bot',
    multiIntro: 'Pilih Multiplayer dari menu Main. Kamu bisa membuat room, membagikan kodenya, bergabung ke room teman, atau bermain melawan bot.',
    multiCards: [
      { icon: 'party', title: 'Buat atau gabung room', body: 'Pilih mode dan chapter saat membuat room. Bagikan kode room kepada teman; pemain yang bergabung memasukkan kode tersebut.' },
      { icon: 'check', title: 'Pilih karakter dan Ready', body: 'Setiap pemain memilih karakter sendiri. Pertandingan dimulai setelah kedua pemain menekan Ready. Melawan bot bisa dimulai tanpa menunggu teman.' },
      { icon: 'heart', title: 'Turn-Based Battle', body: 'Jawab secara bergiliran melalui kolom jawaban. Waktu tiap giliran bertambah sesuai chapter: 45, 60, 75, 90, lalu 105 detik.' },
      { icon: 'chart', title: 'Score Duel', body: 'Kedua pemain menjawab soal yang sama dalam waktu yang sama. Pemenang ditentukan oleh skor jawaban, bukan siapa yang paling cepat mengetuk tombol.' },
    ],
    multiTip: 'Jika koneksi sempat terputus, kembali ke room yang sama untuk melanjutkan pertandingan selama sesi masih tersedia.',
    close: 'Tutup panduan',
    play: 'Mulai bermain',
  },
  en: {
    tabs: { start: 'Getting started', practice: 'Try a question', battle: 'In battle', multi: 'Multiplayer' },
    tabNotes: { start: 'Discover your adventure', practice: 'Learn with a simulation', battle: 'Understand your attacks', multi: 'Challenge a friend or bot' },
    quickTitle: 'Your first time playing?',
    quickBody: 'Try a short practice to understand the balance. Experiment freely without losing HP.',
    quickAction: 'Try the practice',
    chapterHint: 'Choose a chapter to see how to play it.',
    next: 'Up next',
    practiceStatus: ['Subtract 1 from both sides', 'Continue until x is alone', 'Enter the value of x', 'Practice complete'],
    tabLabel: 'Guide sections',
    heroBadge: 'PLAYER GUIDE',
    heroNote: 'Learn the steps, then attack with confidence.',
    overviewTitle: 'Your path to the arena',
    overviewIntro: 'Follow these five steps: open Play, choose Single Player, then choose an available chapter. Finish the simulation to attack the boss and review your evaluation after battle.',
    route: ['Play', 'Single Player', 'Choose chapter', 'Choose fighter in Chapter 1', 'Start Stage'],
    startSteps: [
      { icon: 'map', title: 'Choose a chapter', body: 'Start with Chapter 1 to learn the basics. On a local device, every chapter is available to try.' },
      { icon: 'profile', title: 'Choose your fighter', body: 'Choose Kazura or Asuna in Chapter 1, then press Start Stage. Your choice stays with you throughout the campaign.' },
      { icon: 'sword', title: 'Solve questions to attack', body: 'Open the simulation and finish every step. Your fighter attacks automatically in every chapter once the equation is solved.' },
      { icon: 'chart', title: 'Review and continue', body: 'The evaluation summarizes completed steps, corrections made in the simulation, and topics to practice.' },
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
    practiceDoneBody: 'You kept the equation balanced and found x = 7. In the arena, completing the simulation makes your fighter attack automatically.',
    practiceReset: 'Repeat practice',
    battleTitle: 'Know your arena',
    battleIntro: 'Read the question, open the simulation, and solve the equation. Chapters 1 to 5 attack automatically when the simulation is complete.',
    battleCards: [
      { icon: 'book', title: 'Read the mission and concept', body: 'Check the story, question, and short tip in the question panel. In Chapter 5, assemble the equation with tiles before using the balance.' },
      { icon: 'shield', title: 'Keep both sides equal', body: 'Apply the same operation to both sides. Undo restores the previous step.' },
      { icon: 'spark', title: 'Drag and drop tiles', body: 'In balance mode, drag a tile from the tray onto a pan. Opposite values on the same pan cancel each other; apply an equal operation to the other side.' },
      { icon: 'sword', title: 'Attack automatically', body: 'Once the equation is solved, the result fills in automatically and your fighter attacks the monster.' },
      { icon: 'retry', title: 'Correct a wrong step', body: 'An incorrect simulation step triggers a boss attack and costs HP. Try again with the right operation.' },
      { icon: 'trophy', title: 'Read the evaluation', body: 'After battle, review the steps that need work before trying the next chapter.' },
    ],
    battleCallout: 'Closed the simulation early? Tap the button below the question to reopen it.',
    multiTitle: 'Play with a friend or a bot',
    multiIntro: 'Choose Multiplayer from Play. Create a room and share its code, join a friend’s room, or play against a bot.',
    multiCards: [
      { icon: 'party', title: 'Create or join a room', body: 'Choose a mode and chapter when creating a room. Share its code with a friend; the joining player enters that code.' },
      { icon: 'check', title: 'Choose a fighter and Ready', body: 'Each player chooses a fighter. The match begins once both players press Ready. A bot match does not require waiting for a friend.' },
      { icon: 'heart', title: 'Turn-Based Battle', body: 'Players use the answer field in turns. The time per turn increases by chapter: 45, 60, 75, 90, then 105 seconds.' },
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
  const [openChapter, setOpenChapter] = useState(null);
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
      const pan = document.elementFromPoint(upEvent.clientX, upEvent.clientY)?.closest('[data-balance-side]')?.dataset.balanceSide;
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
  const tutorialUnitTiles = (value, prefix) => Array.from({ length: Math.abs(value) }, (_, index) => ({
    id: `${prefix}-${index}`,
    type: 'unit',
    value: Math.sign(value) || 1,
    label: value < 0 ? '−1' : '+1',
    shape: value < 0 ? 'triangle' : 'square',
  }));
  const tutorialLeftTiles = [
    { id: 'tutorial-x', type: 'variable', variable: 'x', value: 1, label: 'x', shape: 'diamond' },
    ...tutorialUnitTiles(leftUnits, 'tutorial-left'),
  ];
  const tutorialRightTiles = tutorialUnitTiles(rightUnits, 'tutorial-right');

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
          <span className="tutorial-nav-label">{c.tabLabel}</span>
          {Object.entries(c.tabs).map(([key, label], index) => <button key={key} type="button" className={section === key ? 'active' : ''} aria-pressed={section === key} aria-controls="tutorial-content" onClick={() => openSection(key)}><span className="tutorial-tab-icon"><PixelIcon name={TAB_ICONS[key]} size={19}/></span><span className="tutorial-tab-copy"><b>{label}</b><small>{c.tabNotes[key]}</small></span><i>{String(index + 1).padStart(2, '0')}</i></button>)}
          <div className="tutorial-nav-tip"><PixelIcon name="hint" size={22}/><p>{c.heroNote}</p></div>
        </nav>

        <div className="tutorial-body" id="tutorial-content" ref={bodyRef}>
          {section === 'start' && <section className="tutorial-section" aria-label={c.overviewTitle}>
            <div className="tutorial-quick-start"><span className="tutorial-quick-icon"><PixelIcon name="spark" size={26}/></span><div><h3>{c.quickTitle}</h3><p>{c.quickBody}</p></div><button type="button" onClick={() => openSection('practice')}>{c.quickAction}<PixelIcon name="right" size={17}/></button></div>
            <div className="tutorial-section-heading"><span className="tutorial-section-symbol"><PixelIcon name="map" size={23}/></span><div><h3>{c.overviewTitle}</h3><p>{c.overviewIntro}</p></div></div>
            <div className="tutorial-route" aria-label={c.route.join(' → ')}>{c.route.map((label, index) => <React.Fragment key={label}><span>{label}</span>{index < c.route.length - 1 && <PixelIcon name="right" size={14}/>}</React.Fragment>)}</div>
            <GuideCards items={c.startSteps}/>
            <div className="tutorial-chapters"><b>{c.chapterTitle}</b><p className="tutorial-chapter-hint">{c.chapterHint}</p><div>{LEVELS.map((level) => <article key={level.id} className={openChapter === level.id ? 'is-open' : ''}><button className="tutorial-chapter-toggle" type="button" aria-expanded={openChapter === level.id} aria-controls={`guide-chapter-${level.id}`} onClick={() => setOpenChapter(openChapter === level.id ? null : level.id)}><span>{String(level.id).padStart(2, '0')}</span><b>{lang === 'en' ? level.titleEn : level.title}</b><PixelIcon name={openChapter === level.id ? 'close' : 'right'} size={16}/></button>{openChapter === level.id && <div className="tutorial-chapter-detail" id={`guide-chapter-${level.id}`}><p>{getChapterGuide(level.id, lang).brief}</p><ol>{getChapterGuide(level.id, lang).steps.map((step) => <li key={step}>{step}</li>)}</ol></div>}</article>)}</div></div>
            <button className="tutorial-next-section" type="button" onClick={() => openSection('practice')}><span><small>{c.next}</small><b>{c.tabs.practice}</b></span><PixelIcon name="right" size={22}/></button>
          </section>}

          {section === 'practice' && <section className="tutorial-section" aria-label={c.practiceTitle}>
            <div className="tutorial-section-heading"><span className="tutorial-section-symbol"><PixelIcon name="shield" size={23}/></span><div><h3>{c.practiceTitle}</h3><p>{c.practiceIntro}</p></div></div>
            <div className="tutorial-practice">
              <div className="tutorial-practice-top"><span>{c.practiceStatus[practiceStep === 3 ? 3 : practiceSolved ? 2 : pairedRemovals ? 1 : 0]}</span><div aria-label={`${pairedRemovals}/3`}>{[0, 1, 2].map((step) => <i key={step} className={3 - leftUnits > step && 10 - rightUnits > step ? 'done' : 3 - leftUnits === step || 10 - rightUnits === step ? 'current' : ''}/>)}</div></div>
              {practiceStep < 3 ? <>
                <div className="tutorial-practice-equation" aria-label={`${practiceLeftExpression} = ${rightUnits}`}><span>{practiceLeftExpression}</span><b>=</b><span>{rightUnits}</span></div>
                <p className="tutorial-practice-prompt">{c.practiceDragHint}</p>
                <div className="tutorial-balance-stage">
                  <BalanceScale
                    className="tutorial-practice-balance"
                    left={tutorialLeftTiles}
                    right={tutorialRightTiles}
                    equation={`${practiceLeftExpression} = ${rightUnits}`}
                    sides={[c.practicePanLeft, c.practicePanRight]}
                    selectedTile=""
                    overPans=""
                    tilt={balanceDelta > 0 ? 'is-left-heavy' : balanceDelta < 0 ? 'is-right-heavy' : 'is-level'}
                    indicator={balanceDelta > 0 ? 'left' : balanceDelta < 0 ? 'right' : 'center'}
                    statusText={balanceDelta > 0 ? c.practiceLeftHeavy : balanceDelta < 0 ? c.practiceRightHeavy : c.practiceBalance}
                    balanceDelta={balanceDelta}
                    onMoveTile={(event, side, item) => handlePracticePointerDown(event, item.value, 'pan', side)}
                    onSelectMoveTile={() => {}}
                    draggingSource=""
                    lang={lang}
                  />
                </div>
                <div className="tutorial-tile-tray"><strong>{c.practiceTileTray}</strong><div>{[1, -1].map((value) => <button key={value} type="button" className={`tutorial-unit-tile is-tray ${value < 0 ? 'is-negative' : ''} ${practiceSelectedTile === value ? 'is-selected' : ''}`} onPointerDown={(event) => handlePracticePointerDown(event, value)} onClick={() => setPracticeSelectedTile(value)} aria-label={`${value < 0 ? '−1' : '+1'} ${c.practiceTileTray}`}>{value < 0 ? '−1' : '+1'}</button>)}<button type="button" onClick={() => addPracticeUnit('left', practiceSelectedTile)}>{c.practiceAddLeft} {practiceSelectedTile < 0 ? '−1' : '+1'}</button><button type="button" onClick={() => addPracticeUnit('right', practiceSelectedTile)}>{c.practiceAddRight} {practiceSelectedTile < 0 ? '−1' : '+1'}</button></div></div>
                <div className="tutorial-practice-actions"><div className="tutorial-practice-tools"><button type="button" onClick={undoPractice} disabled={!practiceHistory.length}><PixelIcon name="retry" size={15}/>{c.practiceUndo}</button><button type="button" onClick={resetPractice}><PixelIcon name="reset" size={15}/>{c.practiceReset}</button></div>{practiceSolved && <form className="tutorial-practice-answer" onSubmit={submitPractice}><label><PixelIcon name="keyboard" size={17}/><input value={practiceAnswer} onChange={(event) => setPracticeAnswer(event.target.value)} inputMode="numeric" autoComplete="off" aria-label={c.practiceAnswerPlaceholder} placeholder={c.practiceAnswerPlaceholder}/></label><button type="submit" disabled={!practiceAnswer.trim()}><PixelIcon name="sword" size={17}/>{c.practiceAttack}</button></form>}</div>
                {practiceMessage && <p className={`tutorial-practice-feedback ${practiceMessage.good ? 'good' : 'bad'}`} role="status">{practiceMessage.text}</p>}
              </> : <div className="tutorial-practice-done"><span><PixelIcon name="trophy" size={32}/></span><h4>{c.practiceDoneTitle}</h4><p>{c.practiceDoneBody}</p><button type="button" onClick={resetPractice}><PixelIcon name="retry" size={16}/>{c.practiceReset}</button></div>}
            </div>
          </section>}

          {section === 'battle' && <section className="tutorial-section" aria-label={c.battleTitle}>
            <div className="tutorial-section-heading"><span className="tutorial-section-symbol"><PixelIcon name="sword" size={23}/></span><div><h3>{c.battleTitle}</h3><p>{c.battleIntro}</p></div></div>
            <GuideCards items={c.battleCards}/>
            <div className="tutorial-callout"><PixelIcon name="hint" size={19}/><p>{c.battleCallout}</p></div>
            <button className="tutorial-next-section" type="button" onClick={() => openSection('multi')}><span><small>{c.next}</small><b>{c.tabs.multi}</b></span><PixelIcon name="right" size={22}/></button>
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
