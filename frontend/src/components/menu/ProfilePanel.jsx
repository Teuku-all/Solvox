import React,{useEffect,useMemo,useState} from 'react';
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

export default function ProfilePanel({progress,profile,playerId,onClose,onSave,t,lang}){
  const {closing,dismiss}=useAnimatedDismiss(onClose);
  const stats=useMemo(()=>deriveProfile(progress),[progress]);
  const character=getPlayerAsset(playerId);
  const [name,setName]=useState(profile?.name||progress.playerName||'Player');
  const savedName=profile?.name||progress.playerName||'Player';
  const [mp,setMp]=useState(null);
  const [loading,setLoading]=useState(true);
  const [activeTab,setActiveTab]=useState('activity');
  const en=lang==='en';
  const rankLabel=en?stats.rank:({Novice:'Pemula',Bronze:'Perunggu',Silver:'Perak'}[stats.rank]||stats.rank);

  useEffect(()=>{
    const onKey=e=>{if(e.key==='Escape')dismiss()};
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[dismiss]);
  useEffect(()=>{
    let alive=true;
    const lookupName=String(savedName).trim();
    setLoading(true);
    apiJson(`/api/player-profile?name=${encodeURIComponent(lookupName)}`)
      .then(data=>{if(alive)setMp(data?.player||null)})
      .catch(()=>{if(alive)setMp(null)})
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
  const save=()=>dismiss(()=>onSave({...profile,name:cleanName}));

  return <div className={`profile-overlay profile-screen-overlay${closing?' is-closing':''}`} role="dialog" aria-modal="true" aria-label={t('profileTitle')}>
    <div className="profile-panel profile-screen">
      <header className="profile-screen-header">
        <SolvoxBackButton className="profile-screen-nav profile-screen-back" onClick={()=>dismiss()} label={t('back')} />
        <div className="profile-breadcrumb"><span>SOLVOX</span><i>/</i><b>{en?'PLAYER PROFILE':'PROFIL PEMAIN'}</b></div>
        <button className="profile-screen-nav profile-screen-close profile-close-btn" type="button" onClick={()=>dismiss()} aria-label={t('close')}><SolvoxUtilityArt name="close" size={18} className="profile-close-art"/></button>
      </header>

      <main className="profile-dashboard">
        <section className="profile-hero-banner">
          <div className="profile-hero-avatar"><img src={character.portrait} alt=""/></div>
          <div className="profile-hero-copy">
            <label>{en?'PLAYER NAME':'NAMA PEMAIN'}<input value={name} maxLength={18} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')save()}} aria-label={en?'Player name':'Nama pemain'}/></label>
            <p>{t(character.nameId)} <span>•</span> {t(character.roleId)}</p>
            <div className="profile-xp-track"><i style={{width:`${Math.round(stats.currentLevelExp/100*100)}%`}}/></div>
            <small>{stats.currentLevelExp}/100 EXP <span>·</span> {stats.exp.toLocaleString(en?'en-US':'id-ID')} {en?'TOTAL XP':'TOTAL XP'}</small>
          </div>
          <div className="profile-hero-rank"><small>{en?'CURRENT RANK':'PERINGKAT SAAT INI'}</small><strong>{rankLabel} <i>{stats.rankScore}</i></strong><span>LEVEL {stats.level}</span></div>
          <button className="profile-save-btn" type="button" onClick={save}><PixelIcon name="save" size={15}/>{t('save')}</button>
          <div className="profile-hero-meta">
            <div><small>{en?'MATCHES PLAYED':'TOTAL PERTANDINGAN'}</small><b>{totalMatches}</b></div>
            <div><small>{en?'QUESTIONS ANSWERED':'SOAL DIJAWAB'}</small><b>{totalAnswered}</b></div>
            <div><small>{t('accuracy').toUpperCase()}</small><b>{combinedAccuracy}%</b></div>
            <div><small>{en?'CHAPTERS CLEARED':'CHAPTER SELESAI'}</small><b>{stats.completedCount}<em> / {stats.totalChapters}</em></b></div>
          </div>
        </section>

        <div className="profile-dashboard-layout">
          <aside className="profile-sidebar">
            <section className="profile-card profile-campaign-card">
              <div className="profile-card-title"><span>{t('adventureProgress')}</span><b>{stats.completedCount}/{stats.totalChapters}</b></div>
              <div className="profile-progress-bar"><i style={{width:`${stats.completedCount/stats.totalChapters*100}%`}}/></div>
              <div className="profile-chapter-list">{LEVELS.map(chapter=>{
                const cleared=completed.has(chapter.id);
                const current=!cleared&&chapter.id===stats.completedCount+1;
                return <div className={cleared?'is-cleared':current?'is-current':'is-locked'} key={chapter.id}><i>{cleared?'✓':String(chapter.id).padStart(2,'0')}</i><span><b>{en?chapter.titleEn:chapter.title}</b><small>{cleared?(en?'CLEARED':'SELESAI'):current?(en?'IN PROGRESS':'BERIKUTNYA'):(en?'LOCKED':'TERKUNCI')}</small></span>{cleared&&<PixelIcon name="check" size={14}/>}</div>;
              })}</div>
            </section>
            <section className="profile-card profile-learning-card">
              <div className="profile-card-title"><span>{t('learningSnapshot')}</span><PixelIcon name="spark" size={15}/></div>
              <div className="profile-learning-row"><small>{t('strongestConcept')}</small><b>{stats.strongest?.concept||'—'}</b><span>{stats.strongest?`${stats.strongest.accuracy}% ${t('accuracy')}`:'—'}</span></div>
              <div className="profile-learning-row"><small>{t('revisitConcept')}</small><b>{stats.weakest?.concept||'—'}</b><span>{stats.weakest?`${stats.weakest.accuracy}% ${t('accuracy')}`:'—'}</span></div>
            </section>
            <section className="profile-card profile-multiplayer-card">
              <div className="profile-card-title"><span>{t('multiplayerRecord')}</span><PixelIcon name="sword" size={15}/></div>
              {loading?<p className="profile-muted">{t('loading')}</p>:mp?<div className="profile-mp-grid"><div><small>{t('matchesPlayed')}</small><b>{mpMatches}</b></div><div><small>{t('wins')}</small><b className="good">{mp.wins||0}</b></div><div><small>{t('losses')}</small><b className="bad">{mp.losses||0}</b></div><div><small>{t('avgAccuracy')}</small><b>{mp.accuracy||0}%</b></div></div>:<p className="profile-muted">{t('noMultiplayerRecords')}</p>}
            </section>
          </aside>

          <section className="profile-main-column">
            <nav className="profile-tabs" aria-label={en?'Profile sections':'Bagian profil'}>
              <button type="button" aria-pressed={activeTab==='activity'} className={activeTab==='activity'?'active':''} onClick={()=>setActiveTab('activity')}><PixelIcon name="chart" size={15}/>{en?'Activity':'Aktivitas'}</button>
              <button type="button" aria-pressed={activeTab==='achievements'} className={activeTab==='achievements'?'active':''} onClick={()=>setActiveTab('achievements')}><PixelIcon name="trophy" size={15}/>{t('achievements')}<i>{stats.achievements.filter(item=>item.ok).length}</i></button>
            </nav>
            {activeTab==='activity'?<>
              <div className="profile-performance-grid">
                <article className="profile-card profile-accuracy-card"><small>{t('accuracy').toUpperCase()}</small><div className="profile-accuracy-content"><div className="profile-accuracy-ring" style={{'--accuracy':combinedAccuracy}}><b>{combinedAccuracy}%</b></div><span>{totalCorrect} {en?'CORRECT':'BENAR'}<i/>{Math.max(0,totalAnswered-totalCorrect)} {en?'MISSED':'KELIRU'}</span></div><p>{t('questionsAnswered')}: {totalAnswered}</p></article>
                <article className="profile-card profile-result-card"><small>{en?'MATCH RESULTS':'HASIL PERTANDINGAN'}</small><div className="profile-result-values"><span><b>{totalWins}</b><i>{t('wins')}</i></span><span><b>{totalLosses}</b><i>{t('losses')}</i></span></div><div className="profile-result-bar"><i style={{width:`${totalMatches?totalWins/totalMatches*100:0}%`}}/></div><p>{totalMatches?`${Math.round(totalWins/totalMatches*100)}% ${en?'WIN RATE':'RASIO MENANG'}`:en?'Play a match to build your record':'Mainkan pertandingan untuk mulai membangun rekor'}</p></article>
                <article className="profile-card profile-best-card"><small>{en?'PERSONAL BEST':'REKOR TERBAIK'}</small><div className="profile-best-number">{stats.bestAccuracy}<em>%</em></div><b>{t('bestAccuracy')}</b><p>{stats.bestMastery?`${en?'Mastery score':'Skor mastery'} · ${stats.bestMastery}`:en?'Your highest chapter accuracy':'Akurasi chapter tertinggimu'}</p></article>
              </div>
              <section className="profile-card profile-recent-card"><div className="profile-card-title"><span>{t('recentRuns')}</span><small>{en?'LATEST CAMPAIGN RESULTS':'HASIL PETUALANGAN TERBARU'}</small></div>
                <div className="recent-run-list">{stats.recent.length?stats.recent.map((run,index)=><article className="recent-run" key={`${run.ts}-${index}`}><span className={`recent-run-status ${run.won?'run-win':'run-loss'}`}>{run.won?'✓':'×'}</span><div className="recent-run-name"><b>Chapter {run.chapterId||run.level||'—'}</b><small>{run.won?t('victory'):t('defeat')} <i>·</i> {fmtTime(run.timeSec)}</small></div><div className="recent-run-accuracy"><small>{t('accuracy')}</small><b>{run.accuracy||0}%</b></div><strong>{run.won?'+100 EXP':'+20 EXP'}</strong></article>):<p className="profile-muted">{t('noCompletedRuns')}</p>}</div>
              </section>
            </>:<section className="profile-card profile-achievements-card"><div className="profile-card-title"><span>{t('achievements')}</span><small>{stats.achievements.filter(item=>item.ok).length} / {stats.achievements.length} {en?'UNLOCKED':'TERBUKA'}</small></div><div className="profile-achievement-grid">{stats.achievements.map(item=><article key={item.id} className={item.ok?'earned':''}><span className="achievement-icon">{item.ok?'✓':'◇'}</span><div><b>{achievementNames[item.id]?.[en?0:1]||item.label}</b><small>{item.ok?(en?'Achievement unlocked':'Pencapaian terbuka'):(en?'Keep playing to unlock':'Terus bermain untuk membuka')}</small></div><i>{item.ok?(en?'UNLOCKED':'TERBUKA'):(en?'LOCKED':'TERKUNCI')}</i></article>)}</div></section>}
          </section>
        </div>
      </main>
    </div>
  </div>;
}
