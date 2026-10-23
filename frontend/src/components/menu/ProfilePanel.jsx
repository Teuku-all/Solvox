import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import PixelIcon from '../shared/PixelIcon';
import {SolvoxUtilityArt} from '../shared/SolvoxUtilityArt';
import SolvoxBackButton from '../shared/SolvoxBackButton';
import {deriveProfile} from '../../services/profile';
import {apiJson} from '../../services/api';
import {getPlayerAsset} from '../../data/playerAssets';
import {LEVELS} from '../../data/levels';
import useAnimatedDismiss from '../shared/useAnimatedDismiss';

function fmtTime(seconds){
  const s=Math.max(0,Number(seconds)||0);
  if(s<60)return `${Math.round(s)}s`;
  const m=Math.floor(s/60),r=Math.round(s%60);
  if(m<60)return `${m}m ${r}s`;
  return `${Math.floor(m/60)}h ${m%60}m`;
}

const achievementNames={
  'first-clear':['First chapter cleared','Chapter pertama ditaklukkan'],
  'ten-questions':['10 questions answered','Menjawab 10 soal'],
  sharp:['80% accuracy','Akurasi 80%'],
  boss:['Boss defeated','Bos dikalahkan'],
  campaign:['Campaign complete','Kampanye selesai'],
};

export default function ProfilePanel({progress,profile,playerId,onClose,onSave,onPlay,onGuide,t,lang}){
  const {closing,dismiss}=useAnimatedDismiss(onClose);
  const stats=useMemo(()=>deriveProfile(progress),[progress]);
  const character=getPlayerAsset(playerId);
  const [name,setName]=useState(profile?.name||progress.playerName||'Player');
  const savedName=profile?.name||progress.playerName||'Player';
  const [mp,setMp]=useState(null);
  const [loading,setLoading]=useState(true);
  const [activeTab,setActiveTab]=useState('activity');
  const panelRef=useRef(null);
  const dismissRef=useRef(dismiss);
  const [mpError,setMpError]=useState(false);
  const en=lang==='en';
  const rankLabel=en?stats.rank:({Novice:'Pemula',Bronze:'Perunggu',Silver:'Perak'}[stats.rank]||stats.rank);

  useEffect(()=>{dismissRef.current=dismiss},[dismiss]);
  useEffect(()=>{
    const previousFocus=document.activeElement;
    const previousOverflow=document.body.style.overflow;
    const dismiss=()=>dismissRef.current();
    const onKey=e=>{
      if(e.key==='Escape')dismiss();
      if(e.key!=='Tab')return;
      const controls=[...panelRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')];
      const first=controls[0],last=controls[controls.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
    };
    document.body.style.overflow='hidden';
    panelRef.current?.querySelector('button')?.focus();
    window.addEventListener('keydown',onKey);
    return()=>{
      document.body.style.overflow=previousOverflow;
      window.removeEventListener('keydown',onKey);
      previousFocus?.focus?.();
    };
  },[]);
  useEffect(()=>{
    let alive=true;
    const lookupName=String(savedName).trim();
    setLoading(true);
    setMpError(false);
    apiJson(`/api/player-profile?name=${encodeURIComponent(lookupName)}`)
      .then(data=>{if(alive)setMp(data?.player||null)})
      .catch(()=>{if(alive){setMp(null);setMpError(true)}})
      .finally(()=>{if(alive)setLoading(false)});
    return()=>{alive=false};
  },[savedName]);

  const mpMatches=Number(mp?.matches)||0;
  const totalMatches=stats.totalRuns+mpMatches;
  const totalWins=stats.wins+(Number(mp?.wins)||0);
  const totalLosses=stats.losses+(Number(mp?.losses)||0);
  const totalAnswered=stats.questions+(Number(mp?.answered)||0);
  const totalCorrect=stats.correct+(Number(mp?.correct)||0);
  const combinedAccuracy=totalAnswered?Math.round(totalCorrect/totalAnswered*100):stats.accuracy;
  const completed=new Set((progress.completedLevels||[]).map(Number));
  const cleanName=name.trim()||'Player';
  const nameChanged=cleanName!==savedName;
  const nextChapter=LEVELS.find(chapter=>!completed.has(chapter.id));
  const earnedCount=stats.achievements.filter(item=>item.ok).length;
  const campaignPercent=Math.round(stats.completedCount/stats.totalChapters*100);
  const save=()=>dismiss(()=>onSave({...profile,name:cleanName}));

  return createPortal(<div className={`profile-overlay profile-screen-overlay${closing?' is-closing':''}`} role="dialog" aria-modal="true" aria-labelledby="player-profile-title" ref={panelRef}>
    <div className="profile-panel profile-screen">
      <header className="profile-screen-header">
        <SolvoxBackButton className="profile-screen-nav profile-screen-back" onClick={()=>dismiss()} label={t('back')} />
        <div className="profile-breadcrumb"><span>SOLVOX</span><i>/</i><b>{en?'PLAYER PROFILE':'PROFIL PEMAIN'}</b></div>
        <button className="profile-screen-nav profile-screen-close profile-close-btn" type="button" onClick={()=>dismiss()} aria-label={t('close')}><SolvoxUtilityArt name="close" size={18} className="profile-close-art"/></button>
      </header>

      <main className="profile-dashboard">
        <div className="profile-page-intro"><div><span className="profile-eyebrow">{en?'YOUR ADVENTURE, AT A GLANCE':'JEJAK PETUALANGANMU'}</span><h1 id="player-profile-title">{en?'Player profile':'Profil pemain'}<span>.</span></h1><p>{en?'Every answer is a step forward. See how far you’ve come.':'Setiap jawaban adalah langkah maju. Lihat sejauh apa kamu berkembang.'}</p></div><span className="profile-local-badge"><PixelIcon name="shield" size={17}/>{en?'Progress on this device':'Progres di perangkat ini'}</span></div>
        <section className="profile-hero-banner">
          <div className="profile-hero-avatar"><img src={character.portrait} alt=""/><span>LV. {stats.level}</span></div>
          <div className="profile-hero-copy">
            <label>{en?'PLAYER NAME':'NAMA PEMAIN'}<input value={name} maxLength={18} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')save()}} aria-describedby="profile-name-help" aria-label={en?'Player name':'Nama pemain'}/></label>
            <p>{t(character.nameId)} <span>•</span> {t(character.roleId)}</p>
            <div className="profile-xp-track" role="progressbar" aria-label={en?'Experience to next level':'Pengalaman menuju level berikutnya'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={stats.currentLevelExp}><i style={{width:`${stats.currentLevelExp}%`}}/></div>
            <small>{stats.currentLevelExp}/100 EXP <span>·</span> {100-stats.currentLevelExp} EXP {en?`to level ${stats.level+1}`:`ke level ${stats.level+1}`}</small>
          </div>
          <div className="profile-hero-rank"><small>{en?'CURRENT RANK':'PERINGKAT SAAT INI'}</small><strong>{rankLabel} <i>{stats.rankScore}</i></strong><span>LEVEL {stats.level}</span></div>
          <div className="profile-name-actions"><button className="profile-save-btn" type="button" onClick={save} disabled={!nameChanged}><PixelIcon name={nameChanged?'save':'check'} size={16}/>{nameChanged?(en?'Save name':'Simpan nama'):(en?'Name saved':'Nama tersimpan')}</button><small id="profile-name-help">{nameChanged?(en?'Save to apply your new name':'Simpan untuk memakai nama baru'):(en?'Edit your name to personalize it':'Ubah nama sesuai keinginanmu')}</small></div>
          <div className="profile-hero-meta">
            <div><PixelIcon name="sword" size={19}/><small>{en?'Matches played':'Pertandingan'}</small><b>{totalMatches}</b></div>
            <div><PixelIcon name="book" size={19}/><small>{en?'Questions answered':'Soal dijawab'}</small><b>{totalAnswered}</b></div>
            <div><PixelIcon name="chart" size={19}/><small>{t('accuracy')}</small><b>{totalAnswered?`${combinedAccuracy}%`:'—'}</b></div>
            <div><PixelIcon name="map" size={19}/><small>{en?'Chapters cleared':'Chapter selesai'}</small><b>{stats.completedCount}<em> / {stats.totalChapters}</em></b></div>
          </div>
        </section>

        <section className="profile-next-adventure">
          <div className="profile-next-art" aria-hidden="true"><img src={(nextChapter||LEVELS[LEVELS.length-1]).art} alt=""/></div>
          <div className="profile-next-copy"><span className="profile-eyebrow">{nextChapter?(en?'YOUR NEXT MISSION':'MISI BERIKUTNYA'):(en?'ADVENTURE COMPLETE':'PETUALANGAN SELESAI')}</span><h2>{nextChapter?`${String(nextChapter.id).padStart(2,'0')} · ${en?nextChapter.titleEn:nextChapter.title}`:(en?'All chapters conquered!':'Semua chapter ditaklukkan!')}</h2><p>{nextChapter?(en?'Solve the next challenge and keep your adventure going.':'Selesaikan tantangan berikutnya dan lanjutkan petualanganmu.'):(en?'Play again to sharpen your skills and set a new record.':'Mainkan kembali untuk mengasah kemampuan dan mencetak rekor baru.')}</p></div>
          <button className="profile-primary-action" type="button" onClick={()=>dismiss(onPlay)}><PixelIcon name="play" size={17}/>{stats.totalRuns?(en?'Continue playing':'Lanjut bermain'):(en?'Start adventure':'Mulai petualangan')}</button>
        </section>

        <div className="profile-dashboard-layout">
          <aside className="profile-sidebar">
            <section className="profile-card profile-campaign-card">
              <div className="profile-card-title"><span>{t('adventureProgress')}</span><b>{stats.completedCount}/{stats.totalChapters}</b></div>
              <div className="profile-progress-caption"><span>{en?'Campaign completion':'Petualangan terselesaikan'}</span><b>{campaignPercent}%</b></div>
              <div className="profile-progress-bar" role="progressbar" aria-label={t('adventureProgress')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={campaignPercent}><i style={{width:`${campaignPercent}%`}}/></div>
              <div className="profile-chapter-list">{LEVELS.map(chapter=>{
                const cleared=completed.has(chapter.id);
                const current=chapter.id===nextChapter?.id;
                return <div className={cleared?'is-cleared':current?'is-current':'is-locked'} key={chapter.id}><i>{cleared?'✓':String(chapter.id).padStart(2,'0')}</i><span><b>{en?chapter.titleEn:chapter.title}</b><small>{cleared?(en?'CLEARED':'SELESAI'):current?(en?'IN PROGRESS':'BERIKUTNYA'):(en?'LOCKED':'TERKUNCI')}</small></span>{cleared&&<PixelIcon name="check" size={14}/>}</div>;
              })}</div>
            </section>
            <section className="profile-card profile-learning-card">
              <div className="profile-card-title"><span>{t('learningSnapshot')}</span><PixelIcon name="spark" size={15}/></div>
              {stats.concepts.length?<><div className="profile-learning-row"><small>{t('strongestConcept')}</small><b>{stats.strongest.concept}</b><span>{stats.strongest.accuracy}% {t('accuracy')}</span></div><div className="profile-learning-row"><small>{t('revisitConcept')}</small><b>{stats.weakest.concept}</b><span>{stats.weakest.accuracy}% {t('accuracy')}</span></div></>:<p className="profile-muted">{en?'Complete a chapter to discover your strengths and topics to practice.':'Selesaikan satu chapter untuk melihat keunggulanmu dan materi yang perlu dilatih.'}</p>}
              <button className="profile-text-action" type="button" onClick={()=>dismiss(onGuide)}>{en?'Open player guide':'Buka panduan bermain'}<PixelIcon name="right" size={17}/></button>
            </section>
            <section className="profile-card profile-multiplayer-card">
              <div className="profile-card-title"><span>{t('multiplayerRecord')}</span><PixelIcon name="sword" size={15}/></div>
              {loading?<p className="profile-muted" role="status">{t('loading')}</p>:mp?<div className="profile-mp-grid"><div><small>{t('matchesPlayed')}</small><b>{mpMatches}</b></div><div><small>{t('wins')}</small><b className="good">{mp.wins||0}</b></div><div><small>{t('losses')}</small><b className="bad">{mp.losses||0}</b></div><div><small>{t('avgAccuracy')}</small><b>{mp.accuracy||0}%</b></div></div>:<p className="profile-muted">{mpError?(en?'Multiplayer records are unavailable. Your campaign progress is still shown.':'Rekor multiplayer belum dapat dimuat. Progres petualanganmu tetap ditampilkan.'):t('noMultiplayerRecords')}</p>}
            </section>
          </aside>

          <section className="profile-main-column">
            <nav className="profile-tabs" aria-label={en?'Profile sections':'Bagian profil'}>
              <button type="button" aria-controls="profile-activity" aria-pressed={activeTab==='activity'} className={activeTab==='activity'?'active':''} onClick={()=>setActiveTab('activity')}><PixelIcon name="chart" size={17}/>{en?'Activity':'Aktivitas'}</button>
              <button type="button" aria-controls="profile-achievements" aria-pressed={activeTab==='achievements'} className={activeTab==='achievements'?'active':''} onClick={()=>setActiveTab('achievements')}><PixelIcon name="trophy" size={17}/>{t('achievements')}<i>{earnedCount}/{stats.achievements.length}</i></button>
            </nav>
            <div id="profile-activity" hidden={activeTab!=='activity'}>
              <p className="profile-section-note">{en?'Your campaign and multiplayer results in one place.':'Ringkasan hasil petualangan dan multiplayer kamu.'}</p>
              <div className="profile-performance-grid">
                <article className="profile-card profile-accuracy-card"><small>{t('accuracy')}</small><div className="profile-accuracy-content"><div className="profile-accuracy-ring" style={{'--accuracy':combinedAccuracy}}><b>{totalAnswered?`${combinedAccuracy}%`:'—'}</b></div><span><b>{totalCorrect} {en?'correct':'benar'}</b><small>{Math.max(0,totalAnswered-totalCorrect)} {en?'incorrect':'keliru'}</small></span></div><p>{totalAnswered?`${t('questionsAnswered')}: ${totalAnswered}`:(en?'Answer questions to see your accuracy':'Jawab soal untuk melihat akurasimu')}</p></article>
                <article className="profile-card profile-result-card"><small>{en?'MATCH RESULTS':'HASIL PERTANDINGAN'}</small><div className="profile-result-values"><span><b>{totalWins}</b><i>{t('wins')}</i></span><span><b>{totalLosses}</b><i>{t('losses')}</i></span></div><div className="profile-result-bar"><i style={{width:`${totalMatches?totalWins/totalMatches*100:0}%`}}/></div><p>{totalMatches?`${Math.round(totalWins/totalMatches*100)}% ${en?'WIN RATE':'RASIO MENANG'}`:en?'Play a match to build your record':'Mainkan pertandingan untuk mulai membangun rekor'}</p></article>
                <article className="profile-card profile-best-card"><small><PixelIcon name="trophy" size={16}/>{en?'Personal best':'Rekor terbaik'}</small><div className="profile-best-number">{stats.totalRuns?stats.bestAccuracy:'—'}{stats.totalRuns>0&&<em>%</em>}</div><b>{t('bestAccuracy')}</b><p>{stats.bestMastery?`${en?'Mastery score':'Skor penguasaan'} · ${stats.bestMastery}`:en?'Your highest chapter accuracy':'Akurasi chapter tertinggimu'}</p></article>
              </div>
              <section className="profile-card profile-recent-card"><div className="profile-card-title"><span>{t('recentRuns')}</span><small>{en?'LATEST CAMPAIGN RESULTS':'HASIL PETUALANGAN TERBARU'}</small></div>
                <div className="recent-run-list">{stats.recent.length?stats.recent.map((run,index)=>{const chapter=LEVELS.find(item=>item.id===Number(run.chapterId||run.level));return <article className="recent-run" key={`${run.ts}-${index}`}><span className={`recent-run-status ${run.won?'run-win':'run-loss'}`}><PixelIcon name={run.won?'check':'retry'} size={17}/></span><div className="recent-run-name"><b>{chapter?(en?chapter.titleEn:chapter.title):`Chapter ${run.chapterId||run.level||'—'}`}</b><small>{run.won?t('victory'):t('defeat')} <i>·</i> {fmtTime(run.timeSec)}</small></div><div className="recent-run-accuracy"><small>{t('accuracy')}</small><b>{run.accuracy||0}%</b></div><strong>{run.won?'+100 EXP':'+20 EXP'}</strong></article>}):<div className="profile-empty-state"><span><PixelIcon name="map" size={30}/></span><h3>{en?'Your adventure starts here':'Petualanganmu dimulai di sini'}</h3><p>{en?'Complete your first chapter. Your results and progress will appear here.':'Selesaikan chapter pertamamu. Hasil bermain dan perkembanganmu akan muncul di sini.'}</p><button className="profile-text-action" type="button" onClick={()=>dismiss(onGuide)}>{en?'Learn how to play':'Pelajari cara bermain'}<PixelIcon name="right" size={17}/></button></div>}</div>
              </section>
            </div><section id="profile-achievements" hidden={activeTab!=='achievements'} className="profile-card profile-achievements-card"><div className="profile-achievement-heading"><span><PixelIcon name="trophy" size={30}/></span><div><h2>{en?'Small steps. Great achievements.':'Langkah kecil, pencapaian besar.'}</h2><p>{earnedCount} / {stats.achievements.length} {en?'achievements unlocked. Keep your adventure going!':'pencapaian terbuka. Teruskan petualanganmu!'}</p></div></div><div className="profile-achievement-grid">{stats.achievements.map(item=><article key={item.id} className={item.ok?'earned':''}><span className="achievement-icon"><PixelIcon name={item.ok?'trophy':({campaign:'crown','first-clear':'map','ten-questions':'book',sharp:'chart',boss:'sword'}[item.id]||'star')} size={24}/></span><div><b>{achievementNames[item.id]?.[en?0:1]||item.label}</b><small>{item.ok?(en?'Achievement unlocked':'Pencapaian terbuka'):(en?'Keep playing to unlock':'Terus bermain untuk membuka')}</small></div><i>{item.ok?<PixelIcon name="check" title={en?'Unlocked':'Terbuka'} size={17}/>:<PixelIcon name="lock" title={en?'Locked':'Terkunci'} size={15}/>}</i></article>)}</div></section>
          </section>
        </div>
      </main>
    </div>
  </div>,document.body);
}
