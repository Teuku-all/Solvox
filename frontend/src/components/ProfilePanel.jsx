import React,{useEffect,useMemo,useState} from 'react';
import PixelIcon from './PixelIcon';
import {deriveProfile} from '../services/profile';
import {apiJson} from '../services/api';
import {getPlayerAsset} from '../data/playerAssets';

function fmtTime(seconds){
  const s=Math.max(0,Number(seconds)||0);
  if(s<60)return `${Math.round(s)}s`;
  const m=Math.floor(s/60); const r=Math.round(s%60);
  if(m<60)return `${m}m ${r}s`;
  return `${Math.floor(m/60)}h ${m%60}m`;
}

export default function ProfilePanel({progress,profile,playerId,onClose,onSave,t,lang}){
  const stats=useMemo(()=>deriveProfile(progress),[progress]);
  const character=getPlayerAsset(playerId);
  const [name,setName]=useState(profile?.name||progress.playerName||'Player');
  const [mp,setMp]=useState(null);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{const onKey=e=>{if(e.key==='Escape')onClose()};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[onClose]);
  useEffect(()=>{
    let alive=true;
    const lookupName=String(name||profile?.name||progress.playerName||'Player').trim();
    setLoading(true);
    apiJson(`/api/player-profile?name=${encodeURIComponent(lookupName)}`)
      .then(data=>{if(alive)setMp(data?.player||null)})
      .catch(()=>{if(alive)setMp(null)})
      .finally(()=>{if(alive)setLoading(false)});
    return()=>{alive=false};
  },[name]);
  const mpMatches=Number(mp?.matches)||0;
  const totalMatches=stats.totalRuns+mpMatches;
  const totalWins=stats.wins+(Number(mp?.wins)||0);
  const totalLosses=stats.losses+(Number(mp?.losses)||0);
  const totalAnswered=stats.questions+(Number(mp?.answered)||0);
  const totalCorrect=stats.correct+(Number(mp?.correct)||0);
  const combinedAccuracy=totalAnswered?Math.round(totalCorrect/totalAnswered*100):stats.accuracy;
  const save=()=>onSave({...profile,name:name.trim()||'Player'});
  return <div className="profile-overlay profile-screen-overlay" role="dialog" aria-modal="true" aria-label={t('profileTitle')}>
    <div className="profile-panel profile-screen">
      <header className="profile-screen-header">
        <button className="profile-screen-nav profile-screen-back" type="button" onClick={onClose}><PixelIcon name="back" size={20}/><span>{t('back')}</span></button>
        <div className="profile-screen-title"><small>SOLVOX PLAYER DOSSIER</small><h1>{lang==='en'?'PROFILE':'PROFIL'}</h1></div>
        <button className="profile-screen-nav profile-screen-home" type="button" onClick={onClose} aria-label={lang==='en'?'Return home':'Kembali ke halaman utama'}><PixelIcon name="home" size={21}/><span>{lang==='en'?'HOME':'BERANDA'}</span></button>
      </header>
      <div className="profile-screen-layout">
        <aside className="profile-showcase">
          <div className="profile-art-stage"><span className="profile-art-orbit"/><span className="profile-art-floor"/><img src={character.portrait} alt={lang==='en'?`${t(character.nameId)} character`:`Karakter ${t(character.nameId)}`}/><span className="profile-art-level">LV {stats.level}</span></div>
          <div className="profile-showcase-caption"><small>{lang==='en'?'YOUR ADVENTURER':'PETUALANGMU'}</small><h2>{t(character.nameId)}</h2><p>{t(character.roleId)}</p></div>
          <div className="profile-showcase-record"><span><PixelIcon name="trophy" size={16}/>{lang==='en'?'CAMPAIGN XP':'XP PETUALANGAN'}</span><b>{stats.exp.toLocaleString(lang==='en'?'en-US':'id-ID')}</b></div>
        </aside>
        <main className="profile-info">
          <section className="profile-hero profile-identity-card">
            <div className="profile-avatar-xl profile-avatar-text" aria-hidden="true">{String(name||'P').trim().slice(0,1).toUpperCase()}</div>
            <div className="profile-identity">
              <label>{lang==='en'?'PLAYER NAME':'NAMA PEMAIN'}<input value={name} maxLength={18} onChange={e=>setName(e.target.value)}/></label>
              <div className="profile-level-line"><span>LEVEL {stats.level}</span><span>{stats.rank} {stats.rankScore}</span></div>
              <div className="profile-xp-track"><i style={{width:`${Math.round(stats.currentLevelExp/100*100)}%`}}/></div>
              <small>{stats.currentLevelExp}/100 EXP <span>·</span> {stats.exp.toLocaleString(lang==='en'?'en-US':'id-ID')} TOTAL EXP</small>
            </div>
            <div className="profile-actions profile-account-actions"><button className="profile-save-btn" onClick={save}><PixelIcon name="save" size={15}/>{t('save')}</button></div>
          </section>

          <div className="profile-grid profile-core-grid">
            <section className="profile-card profile-stats">
              <div className="profile-card-title"><span className="profile-card-mark" aria-hidden="true">01</span><span>{t('lifetimeStats')}</span></div>
              <div className="profile-stat-grid">
                <div><small>{t('matchesPlayed')}</small><b>{totalMatches}</b></div>
                <div><small>{t('wins')}</small><b className="good">{totalWins}</b></div>
                <div><small>{t('losses')}</small><b className="bad">{totalLosses}</b></div>
                <div><small>{t('accuracy')}</small><b>{combinedAccuracy}%</b></div>
                <div><small>{t('questionsAnswered')}</small><b>{totalAnswered}</b></div>
                <div><small>{t('bestAccuracy')}</small><b>{stats.bestAccuracy}%</b></div>
              </div>
            </section>
            <section className="profile-card profile-progress">
              <div className="profile-card-title"><span className="profile-card-mark" aria-hidden="true">02</span><span>{t('adventureProgress')}</span></div>
              <div className="campaign-progress-big"><div className="campaign-ring" style={{'--progress':stats.completedCount/5*100}}><b>{stats.completedCount}</b><small>/ {stats.totalChapters}</small></div><div><strong>{t('chaptersClearedLabel')}</strong><p>{stats.completedCount===5?t('campaignComplete'):t('chaptersRemaining',{count:5-stats.completedCount})}</p></div></div>
              <div className="profile-progress-bar"><i style={{width:`${stats.completedCount/5*100}%`}}/></div>
            </section>
          </div>

          <div className="profile-grid profile-data-grid">
            <section className="profile-card">
              <div className="profile-card-title"><span className="profile-card-mark" aria-hidden="true">03</span><span>{t('learningSnapshot')}</span></div>
              <div className="learning-pair">
                <div><small>{t('strongestConcept')}</small><strong>{stats.strongest?.concept||'—'}</strong>{stats.strongest&&<span>{stats.strongest.accuracy}% {t('accuracy')}</span>}</div>
                <div><small>{t('revisitConcept')}</small><strong>{stats.weakest?.concept||'—'}</strong>{stats.weakest&&<span>{stats.weakest.accuracy}% {t('accuracy')}</span>}</div>
              </div>
            </section>
            <section className="profile-card">
              <div className="profile-card-title"><span className="profile-card-mark" aria-hidden="true">04</span><span>{t('multiplayerRecord')}</span></div>
              {loading?<p className="profile-muted">{t('loading')}</p>:mp?<div className="profile-mp-grid"><div><small>{t('matchesPlayed')}</small><b>{mpMatches}</b></div><div><small>{t('wins')}</small><b className="good">{mp.wins||0}</b></div><div><small>{t('losses')}</small><b className="bad">{mp.losses||0}</b></div><div><small>{t('avgAccuracy')}</small><b>{mp.accuracy||0}%</b></div></div>:<p className="profile-muted">{t('noMultiplayerRecords')}</p>}
            </section>
          </div>

          <div className="profile-grid profile-bottom-grid">
            <section className="profile-card">
              <div className="profile-card-title"><span className="profile-card-mark" aria-hidden="true">05</span><span>{t('achievements')}</span></div>
              <div className="achievement-list">{stats.achievements.map(a=><div key={a.id} className={a.ok?'earned':''}><span className="achievement-icon profile-mark-status" aria-hidden="true">{a.ok?'✓':'•'}</span><span>{a.label}</span></div>)}</div>
            </section>
            <section className="profile-card">
              <div className="profile-card-title"><span className="profile-card-mark" aria-hidden="true">06</span><span>{t('recentRuns')}</span></div>
              <div className="recent-run-list">{stats.recent.length?stats.recent.map((r,i)=><div className="recent-run" key={`${r.ts}-${i}`}><span className={`${r.won?'run-win':'run-loss'} profile-mark-status`} aria-hidden="true">{r.won?'✓':'×'}</span><div><b>Chapter {r.chapterId||r.level||'—'}</b><small>{r.accuracy||0}% · {fmtTime(r.timeSec)} · {r.won?t('victory'):t('defeat')}</small></div><strong>{r.won?'+100 EXP':'+20 EXP'}</strong></div>):<p className="profile-muted">{t('noCompletedRuns')}</p>}</div>
            </section>
          </div>
        </main>
      </div>
    </div>
  </div>;
}
