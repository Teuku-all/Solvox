import React,{Suspense,lazy,useEffect,useRef,useState} from 'react';
import HomeMenu from './components/menu/HomeMenu';
const Battle = lazy(() => import('./components/battle/Battle'));
const Evaluation = lazy(() => import('./components/screens/Evaluation'));
import ProfilePanel from './components/menu/ProfilePanel';
import Feedback from './components/menu/Feedback';
const Multiplayer = lazy(() => import('./components/multiplayer/Multiplayer'));
import ModeSelect from './components/menu/ModeSelect';
import ChapterSelect from './components/menu/ChapterSelect';
import SinglePlayerCharacterSelect from './components/character/SinglePlayerCharacterSelect';
import Settings from './components/menu/Settings';
import AboutDevelopers from './components/menu/AboutDevelopers';
import Tutorial from './components/menu/Tutorial';
import CutsceneStory from './components/battle/CutsceneStory';
import { storyScript } from './data/story';
import SolvoxBrandLogo from './components/shared/SolvoxBrandLogo';
import PixelIcon from './components/shared/PixelIcon';
import {LEVELS, isLocalDevelopment, isUnlocked} from './data/levels';
import {T} from './services/i18n';
import {summarizePerformance} from './services/evaluation';
import {GAME_META} from './config/game';
import {setHomeMusicActive} from './services/sound';
import {warmSelectionScreen} from './services/selectionAssets';

const STORAGE='solvox.progress.v1';
const PLAYER_STORAGE='solvox.singlePlayer.character.v1';
const PLAYER_LOCK_STORAGE='solvox.singlePlayer.characterLocked.v1';
const VISITED_CHAPTERS_STORAGE='solvox.singlePlayer.visitedChapters.v1';
const MENU_SCREENS=new Set(['home','modes','chapters','character','about']);
const MENU_EXIT_MS=150;
const LEGACY_STORAGES=['numericore.v35.progress','aljabarmaster.v34.progress','aljabarmaster.v33.progress','aljabarmaster.v32.progress','aljabarmaster.v31.progress','aljabarmaster.v30.progress','aljabarmaster.v29.progress','aljabarmaster.v28.progress','aljabarmaster.v23.progress','aljabarmaster.v20.progress','aljabarmaster.v16final.progress'];
const DEFAULT={playerName:'Player',playerEXP:0,completedLevels:[],analytics:[],profile:{name:'Player',avatar:'pixelNinja',createdAt:Date.now()}};
function normalizeCompleted(raw){
  const set=new Set((Array.isArray(raw)?raw:[]).map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=LEVELS.length));
  const result=[];
  for(let id=1;id<=LEVELS.length;id++){ if(set.has(id)) result.push(id); else break; }
  return result;
}
function sanitizeState(raw){const base={...DEFAULT,...(raw||{})};const cleanBase={...base};delete cleanBase.activityLogs;const profile={...DEFAULT.profile,...(cleanBase.profile||{}),name:String(cleanBase.profile?.name||cleanBase.playerName||'Player').trim().slice(0,18)||'Player'};return {...cleanBase,playerName:profile.name,profile,completedLevels:normalizeCompleted(cleanBase.completedLevels),playerEXP:Number(cleanBase.playerEXP)||0,analytics:Array.isArray(cleanBase.analytics)?cleanBase.analytics:[]};}
function load(){try{const current=localStorage.getItem(STORAGE);if(current)return sanitizeState(JSON.parse(current));for(const key of LEGACY_STORAGES){const legacy=localStorage.getItem(key);if(legacy)return sanitizeState(JSON.parse(legacy));}return {...DEFAULT}}catch{return {...DEFAULT}}}
function save(s){localStorage.setItem(STORAGE,JSON.stringify(s))}
function loadVisitedChapters(){
  try{
    const saved=JSON.parse(localStorage.getItem(VISITED_CHAPTERS_STORAGE)||'{}');
    return saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};
  }catch{return {}}
}
function loadLanguage(){
  const saved=localStorage.getItem('solvox.lang')||localStorage.getItem('numericore.lang')||localStorage.getItem('aljabarmaster.lang');
  return saved==='en'?'en':'id';
}
export default function App(){
  const [state,setState]=useState(load),[screen,setScreenState]=useState('home'),[screenLeaving,setScreenLeaving]=useState(false),[level,setLevel]=useState(1),[playerId,setPlayerId]=useState(()=>localStorage.getItem(PLAYER_STORAGE)||'traveler'),[playerSelectionLocked,setPlayerSelectionLocked]=useState(()=>localStorage.getItem(PLAYER_LOCK_STORAGE)==='1'),[battleSession,setBattleSession]=useState(0),[evaluation,setEvaluation]=useState(null),[feedback,setFeedback]=useState(false),[settings,setSettings]=useState(false),[profileOpen,setProfileOpen]=useState(false),[tutorialOpen,setTutorialOpen]=useState(false),[multiplayerBattle,setMultiplayerBattle]=useState(false),[lang,setLang]=useState(loadLanguage);
  const screenRef=useRef(screen);
  const screenExitTimer=useRef(null);
  screenRef.current=screen;
  const setScreen=(next)=>{
    window.clearTimeout(screenExitTimer.current);
    screenExitTimer.current=null;
    if(next===screenRef.current){setScreenLeaving(false);return;}
    const reducedMotion=document.documentElement.classList.contains('reduced-motion')
      ||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if(MENU_SCREENS.has(screenRef.current)&&MENU_SCREENS.has(next)&&!reducedMotion){
      setScreenLeaving(true);
      screenExitTimer.current=window.setTimeout(()=>{
        screenRef.current=next;
        setScreenState(next);
        setScreenLeaving(false);
        screenExitTimer.current=null;
      },MENU_EXIT_MS);
      return;
    }
    screenRef.current=next;
    setScreenLeaving(false);
    setScreenState(next);
  };
  useEffect(()=>()=>window.clearTimeout(screenExitTimer.current),[]);
  const [activeCutscene,setActiveCutscene]=useState(null);
  const [visitedChapters,setVisitedChapters]=useState(loadVisitedChapters);
  const t=(k,vars)=>{let value=T[lang]?.[k] ?? T.id?.[k] ?? k; if(vars) Object.entries(vars).forEach(([name,val])=>{value=value.replaceAll(`{${name}}`,String(val))}); return value;};
  useEffect(()=>{save(state);},[state]);
  useEffect(()=>{
    const inBattle=(screen==='battle'&&!evaluation)||(screen==='multi'&&multiplayerBattle);
    setHomeMusicActive(!inBattle&&screen!=='multi');
    return()=>setHomeMusicActive(false);
  },[screen,multiplayerBattle,evaluation]);
  useEffect(()=>{ document.documentElement.lang=lang==='en'?'en':'id'; },[lang]);
  useEffect(()=>{document.documentElement.classList.toggle('reduced-motion',localStorage.getItem('solvox.reducedMotion')==='1')},[]);
  useEffect(()=>{window.scrollTo(0,0)},[screen]);
  useEffect(()=>{
    if(screen!=='chapters')return;
    const timer=setTimeout(warmSelectionScreen,200);
    return()=>clearTimeout(timer);
  },[screen]);
  useEffect(()=>{ localStorage.setItem(PLAYER_STORAGE,playerId); },[playerId]);
  const reset=()=>{
    if(!confirm(t('resetConfirm')))return;
    const next={...DEFAULT,profile:{...DEFAULT.profile,createdAt:Date.now()}};
    save(next);
    LEGACY_STORAGES.forEach((key)=>localStorage.removeItem(key));
    localStorage.removeItem(VISITED_CHAPTERS_STORAGE);
    localStorage.removeItem(PLAYER_LOCK_STORAGE);
    localStorage.setItem(PLAYER_STORAGE,'traveler');
    setState(next);
    setPlayerSelectionLocked(false);
    setVisitedChapters({});
    setPlayerId('traveler');
    setLevel(1);
    setActiveCutscene(null);
    setEvaluation(null);
    setFeedback(false);
    setSettings(false);
    setProfileOpen(false);
    setTutorialOpen(false);
    setScreen('home');
  };
  const allChaptersCompleted=normalizeCompleted(state.completedLevels).length===LEVELS.length;
  const hasPlayedBefore=()=>Object.values(visitedChapters).some(Boolean)
    ||normalizeCompleted(state.completedLevels).length>0
    ||(state.analytics||[]).length>0;
  const recordChapterPlay=(chapterId)=>{
    const played={...visitedChapters,[chapterId]:true};
    try{
      localStorage.setItem(VISITED_CHAPTERS_STORAGE,JSON.stringify(played));
    }catch(error){
      console.error('Could not save played story chapters.',error);
    }
    setVisitedChapters(played);
  };
  const launchBattle=(chapterId,{characterId=playerId}={})=>{
    const intro=storyScript.chapters[chapterId]?.intro?.[characterId]||[];
    const canSkip=hasPlayedBefore();
    recordChapterPlay(chapterId);
    setActiveCutscene(intro.length?{chapterId,characterId,dialogues:intro,canSkip}:null);
    setLevel(chapterId);
    setBattleSession(v=>v+1);
    setScreen('battle');
  };
  const finishCutscene=()=>setActiveCutscene(null);
  const selectChapter=(id)=>{
    const chapterId=Number(id);
    if(!Number.isInteger(chapterId)||chapterId<1||chapterId>LEVELS.length)return;
    if(!isUnlocked(state, chapterId))return;
    // Character choice is a one-time campaign decision, made on Chapter 1.
    // It becomes available again only after the entire campaign is cleared.
    if(chapterId===1&&(!playerSelectionLocked||allChaptersCompleted)){
      setLevel(1);
      setScreen('character');
      return;
    }
    if(!playerSelectionLocked&&!isLocalDevelopment()){
      // Guard imported/legacy progress where later chapters are unlocked but
      // the one-time character choice was never committed.
      setLevel(1);
      setScreen('character');
      return;
    }
    launchBattle(chapterId);
  };
  const start=(id, nextPlayerId=playerId)=>{
    const chapterId=Number(id);
    if(chapterId!==1||!Number.isInteger(chapterId)||chapterId<1||chapterId>LEVELS.length)return;
    const selected=nextPlayerId||'traveler';
    if(!['traveler','asuka'].includes(selected))return false;
    // Commit storage before changing React state or navigating. A failed write
    // leaves the preview open and lets the character screen offer a retry.
    const previous=[PLAYER_STORAGE,PLAYER_LOCK_STORAGE,STORAGE].map(key=>[key,localStorage.getItem(key)]);
    try{
      localStorage.setItem(PLAYER_STORAGE,selected);
      localStorage.setItem(PLAYER_LOCK_STORAGE,'1');
      if(allChaptersCompleted)save({...state,completedLevels:[]});
    }catch(error){
      for(const [key,value] of previous){
        try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{}
      }
      throw error;
    }
    // Completing the full campaign and choosing a new Chapter 1 character
    // starts a fresh run, so the new choice stays locked for that run.
    if(allChaptersCompleted)setState(current=>({...current,completedLevels:[]}));
    setPlayerId(selected);
    setPlayerSelectionLocked(true);
    launchBattle(chapterId,{characterId:selected});
  };
  const complete=(result)=>{
    const id=level;
    const won=result.won!==false;
    const canSkip=hasPlayedBefore();
    const completed=new Set(normalizeCompleted(state.completedLevels));
    if(won||result.completionReason==='chapter-complete')completed.add(id);
    const run={level:id,chapterId:id,...result,mastery:summarizePerformance(result).mastery,ts:Date.now()};
    const next={...state,completedLevels:normalizeCompleted([...completed]),playerEXP:state.playerEXP+(won?100:20),playerName:state.profile?.name||state.playerName,analytics:[...(state.analytics||[]),run]};
    const chapterStory=storyScript.chapters[id];
    const outcome=chapterStory?.[won?'win':'lose']?.[playerId]||[];
    const epilogue=won&&id===LEVELS.length?storyScript.epilogue[playerId]||[]:[];
    const dialogues=[...outcome,...epilogue];
    setActiveCutscene(dialogues.length?{chapterId:id,characterId:playerId,dialogues,canSkip}:null);
    setState(next);
    setEvaluation(result);
  };
  const finishEval=()=>{setEvaluation(null);setScreen('home')};
  const goNext=(nextId)=>{
    setEvaluation(null);
    if(!nextId){setScreen('chapters');return;}
    // The Next Chapter button is rendered only after a successful completion,
    // so do not re-check stale state here. This avoids the post-level dead-end bug.
    launchBattle(Number(nextId));
  };
  const rematch=()=>{const sameLevel=Number(evaluation?.chapterId||level);setEvaluation(null);launchBattle(sameLevel)};
  const changeLang=(next)=>setLang(v=>{const n=next|| (v==='id'?'en':'id');localStorage.setItem('solvox.lang',n);return n});
  const saveProfile=(profile)=>{const clean={...state.profile,...profile,name:String(profile?.name||state.profile?.name||'Player').trim().slice(0,18)||'Player'};setState(v=>({...v,profile:clean,playerName:clean.name}));setProfileOpen(false)};
  return <div className={`app-shell ${screen==='battle'?'battle-active':''} ${screen==='multi'&&multiplayerBattle?'multiplayer-battle-active':''}`} data-screen={screen} data-screen-transition={screenLeaving?'exiting':undefined}>
    {screen!=='battle'&&!(screen==='multi'&&multiplayerBattle)&&screen!=='home'&&screen!=='modes'&&screen!=='chapters'&&screen!=='character'&&screen!=='about'&&screen!=='dashboard'&&<header className="global-bar"><div className="global-brand"><SolvoxBrandLogo compact/><span className="global-brand-copy"><b>{t('online')}</b><small>{t('subtitle')}</small></span></div><nav className="global-actions" aria-label={lang==='en'?'Game options':'Pengaturan game'}><button className="global-action" title={t('feedback')} aria-label={t('feedback')} onClick={()=>setFeedback(true)}><PixelIcon name="feedback" size={17}/><span>{t('feedback')}</span></button><button className="global-action" title={t('settingsTitle')} aria-label={t('settingsTitle')} onClick={()=>setSettings(true)}><PixelIcon name="gear" size={17}/><span>{t('settingsTitle')}</span></button></nav></header>}
    <Suspense fallback={<div className="loading-screen" role="status"><p>{t('loading')}</p></div>}>
    {screen==='home'&&<HomeMenu t={t} profileName={state.profile?.name||state.playerName} onMain={()=>setScreen('modes')} onTutorial={()=>setTutorialOpen(true)} onSettings={()=>setSettings(true)} onFeedback={()=>setFeedback(true)} onDashboard={()=>setScreen('dashboard')} onProfile={()=>setProfileOpen(true)}/>} 
    {screen==='modes'&&<ModeSelect lang={lang} t={t} onBack={()=>setScreen('home')} onSingle={()=>setScreen('chapters')} onMulti={()=>setScreen('multi')}/>}
    {screen==='chapters'&&<ChapterSelect progress={state} lang={lang} t={t} onBack={()=>setScreen('modes')} onSelectChapter={selectChapter}/>}
    {screen==='character'&&<SinglePlayerCharacterSelect levelId={level} playerId={playerId} lang={lang} t={t} onPlayerChange={setPlayerId} onBack={()=>setScreen('chapters')} onStart={start}/>}
    {screen==='battle'&&<Battle key={`chapter-${level}-session-${battleSession}`} levelId={level} playerId={playerId} lang={lang} t={t} onComplete={complete} onBack={()=>setScreen('chapters')}/>} 
    {activeCutscene&&<CutsceneStory dialogues={activeCutscene.dialogues} chapterId={activeCutscene.chapterId} characterType={activeCutscene.characterId} canSkip={activeCutscene.canSkip} lang={lang} onComplete={finishCutscene} onSkip={finishCutscene}/>}
    {screen==='multi'&&<Multiplayer lang={lang} t={t} playerName={state.profile?.name||state.playerName} onBack={()=>setScreen('modes')} onBattleStateChange={setMultiplayerBattle}/>}
    {screen==='dashboard'&&<Multiplayer dashboardOnly lang={lang} t={t} playerName={state.profile?.name||state.playerName} onBack={()=>setScreen('home')} onPlay={()=>setScreen('multi')}/>}
    {evaluation&&!activeCutscene&&<Evaluation result={evaluation} onClose={finishEval} onRematch={rematch} onNext={goNext} nextLevel={(evaluation.won||evaluation.completionReason==='chapter-complete')&&Number(evaluation.chapterId||level)<LEVELS.length?Number(evaluation.chapterId||level)+1:null} t={t} lang={lang}/>}
    {feedback&&<Feedback lang={lang} t={t} onClose={()=>setFeedback(false)}/>}
    {settings&&<Settings lang={lang} t={t} onClose={()=>setSettings(false)} onReset={reset} onChangeLang={changeLang} onAboutUs={()=>{setSettings(false);setScreen('about')}}/>}
    {screen==='about'&&<AboutDevelopers lang={lang} t={t} onBack={()=>setScreen('home')}/>}
    {profileOpen&&<ProfilePanel progress={state} profile={state.profile} playerId={playerId} onClose={()=>setProfileOpen(false)} onSave={saveProfile} onPlay={()=>{setProfileOpen(false);setScreen('chapters')}} onGuide={()=>{setProfileOpen(false);setTutorialOpen(true)}} t={t} lang={lang}/>}
    {tutorialOpen&&<Tutorial t={t} lang={lang} onClose={()=>setTutorialOpen(false)} onPlay={()=>{setTutorialOpen(false);setScreen('modes')}}/>}
    </Suspense>
  </div>
}
