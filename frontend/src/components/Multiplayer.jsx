import React,{useEffect,useMemo,useRef,useState} from 'react';
import {io} from 'socket.io-client';
import CharacterPicker, { findCharacter } from './CharacterPicker';
import PixelIcon from './PixelIcon';
import MultiplayerFighter from './MultiplayerFighter';
import ArenaBackground from './ArenaBackground';
import BattleQuestionPanel from './BattleQuestionPanel';
import HitEffect from './HitEffect';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';
import {GAME_META} from '../config/game';
import {LEVELS} from '../data/levels';
import { playSound } from '../services/sound';
import {apiJson} from '../services/api';

export default function Multiplayer({lang,onBack,t,playerName=''} ){
  const [socket]=useState(()=>io({autoConnect:false}));
  const [socketConnected,setSocketConnected]=useState(false);
  const roomRef=useRef(null);
  const pendingActionRef=useRef(null);
  const finishedMatchRef=useRef('');
  const [battleMode,setBattleMode]=useState('turn');
  const [name,setName]=useState(playerName||'Player');
  const [char,setChar]=useState(()=>findCharacter(localStorage.getItem('solvox.mpCharacter')).id);
  const [level,setLevel]=useState(1);
  const [code,setCode]=useState('');
  const [room,setRoom]=useState(null);
  const [keypadVisible,setKeypadVisible]=useState(false);
  const [error,setError]=useState('');
  const [answer,setAnswer]=useState('');
  const [seconds,setSeconds]=useState(45);
  const [answerInfo,setAnswerInfo]=useState(null);
  const [hintInfo,setHintInfo]=useState(null);
  const [battleImpact,setBattleImpact]=useState(null);
  const [showMatchReview,setShowMatchReview]=useState(false);
  const [dashboard,setDashboard]=useState(null);
  const [dashboardLoading,setDashboardLoading]=useState(false);

  const loadDashboard=()=>{
    setDashboardLoading(true);
    apiJson('/api/dashboard?limit=20').then(data=>setDashboard(data)).catch(()=>setDashboard(null)).finally(()=>setDashboardLoading(false));
  };
  useEffect(()=>{if(playerName)setName(playerName)},[playerName]);
  useEffect(()=>{loadDashboard();},[]);
  useEffect(()=>{
    const events=['room:created','room:update','game:start','game:generating','turn:next','turn:answer','turn:hint-used','round:resolved','round:next','score:answer','game:finished','rematch:ready','player:left','player:disconnected','room:reconnected'];
    const storedToken=()=>localStorage.getItem('solvox.mpToken')||localStorage.getItem('numericore.mpToken')||localStorage.getItem('aljabarmaster.mpToken')||'';
    const handler=r=>{
      roomRef.current=r||null;
      setRoom(r);
      if(r?.code){
        localStorage.setItem('solvox.mpRoomCode',r.code);
      }
      const finishedMatchKey=r?.status==='finished'?`${r.code}:${r.startedAt||''}`:'';
      if(finishedMatchKey&&finishedMatchRef.current!==finishedMatchKey){
        finishedMatchRef.current=finishedMatchKey;
        playSound(r.winner&&r.winner===socket.id?'victory':'defeat');
        setTimeout(loadDashboard,250);
      }
    };
    const onConnect=()=>{
      setSocketConnected(true);
      setError(current=>current==='SOCKET_CONNECTION'?'':current);
      const activeRoom=roomRef.current;
      const token=storedToken();
      if(activeRoom?.code&&token){
        // Socket.IO preserves packet order, so a queued action follows room rebind.
        socket.emit('room:join',{code:activeRoom.code,name:playerName||'Player',character:localStorage.getItem('solvox.mpCharacter')||'traveler',token});
      } else if(!activeRoom&&token){
        const savedCode=localStorage.getItem('solvox.mpRoomCode');
        if(savedCode)socket.emit('room:join',{code:savedCode,name:playerName||'Player',character:localStorage.getItem('solvox.mpCharacter')||'traveler',token});
      }
      const pendingAction=pendingActionRef.current;
      if(pendingAction){
        pendingActionRef.current=null;
        pendingAction();
      }
    };
    const onDisconnect=()=>setSocketConnected(false);
    const onConnectError=()=>{setSocketConnected(false);setError('SOCKET_CONNECTION')};
    const onAnswerResult=x=>{setAnswerInfo(x);setAnswer('');playSound(x?.correct?'correct':'wrong')};
    const onHintResult=x=>{if(x?.ok){setHintInfo(x);playSound('hint')}else if(x?.code==='HINT_NOT_ENOUGH_HP'){setAnswerInfo({correct:false,explanation:t('hintNotEnoughHp')});}};
    const onRoomError=x=>{
      setError(x?.code||'ROOM_ERROR');
      if(x?.code==='ROOM_NOT_FOUND'){
        roomRef.current=null;
        setRoom(null);
        localStorage.removeItem('solvox.mpRoomCode');
        localStorage.removeItem('solvox.mpToken');
        localStorage.removeItem('numericore.mpToken');
        localStorage.removeItem('aljabarmaster.mpToken');
      }
    };
    events.forEach(e=>socket.on(e,handler));
    socket.on('connect',onConnect);
    socket.on('disconnect',onDisconnect);
    socket.on('connect_error',onConnectError);
    socket.on('answer:result',onAnswerResult);
    socket.on('hint:result',onHintResult);
    socket.on('room:error',onRoomError);
    socket.connect();
    return()=>{
      events.forEach(e=>socket.off(e,handler));
      socket.off('connect',onConnect);socket.off('disconnect',onDisconnect);socket.off('connect_error',onConnectError);
      socket.off('answer:result',onAnswerResult);socket.off('hint:result',onHintResult);socket.off('room:error',onRoomError);
      socket.disconnect();
    };
  },[socket]);
  useEffect(()=>{
    if(!room)return;
    setAnswerInfo(null);
    setHintInfo(null);
    setAnswer('');
  },[room?.questionIndex,room?.turnToken]);
  useEffect(()=>{
    if(!room||room.status!=='battle')return setSeconds(45);
    const started=room.turnStartedAt||Date.now();
    const duration=(room.turnDuration||45000);
    const tick=()=>setSeconds(Math.max(0,Math.ceil((duration-(Date.now()-started))/1000)));
    tick();const id=setInterval(tick,250);return()=>clearInterval(id);
  },[room?.status,room?.turnStartedAt,room?.questionIndex,room?.turnToken]);

  const me=useMemo(()=>room?.players?.find(p=>p.id===socket.id),[room,socket]);
  const current=room?.currentTurnPlayerId===me?.id;
  const errText={ROOM_NOT_FOUND:t('roomNotFound'),ROOM_FULL:t('roomFull'),ROOM_STARTED:t('roomStarted'),ROOM_CODE:t('roomCodeRule'),ROOM_ERROR:t('roomError'),SOCKET_CONNECTION:lang==='en'?'Multiplayer server is unreachable. Start the game server and try again.':'Server multiplayer tidak terhubung. Jalankan server game lalu coba lagi.'}[error];
  const statusText=()=>{
    if(!room)return '';
    const map={WAITING_PLAYER:t('waitingPlayer'),WAITING:t('waitingReady'),GENERATING_QUESTIONS:t('generatingMatch'),READY_TO_BATTLE:t('battleReady'),TURN_CHANGED:room.currentTurnPlayerId===me?.id?t('turnYour'):t('turnOpponent'),TURN_TIMEOUT:t('timeUp'),TURN_CORRECT:t('correct'),TURN_WRONG:t('wrong'),BOTH_WRONG:t('bothMissed'),ROUND_RESOLVED:t('roundResolved'),NEW_ROUND:t('newRound'),MATCH_FINISHED:t('matchFinished'),DRAW:t('draw'),REMATCH_READY:t('rematchReady'),DISCONNECTED:t('disconnect')};
    if(room.isBot&&room.status==='waiting')return t('botReady');
    return map[room.statusKey]||t('waiting');
  };
  const winnerName=room?.winnerName||(room?.winner&&room.winner!=='draw'?room.players?.find(p=>p.id===room.winner)?.name:null);
const playerBattleRef=useRef(null);
const opponentBattleRef=useRef(null);
const getArenaLungeDistance=()=>{const width=window.innerWidth||1280;return width<=380?68:width<=520?82:width<=760?96:112};
const playerBattleImpact=()=>{opponentBattleRef.current?.play('hurt')};
const opponentBattleImpact=()=>{playerBattleRef.current?.play('hurt')};
const battlePlayers=useMemo(()=>{
  const list=Array.isArray(room?.players)?room.players:[];
  if(!list.length)return {player:null,opponent:null};
  const local=list.find(p=>p.id===socket.id)
    ||me
    ||list.find(p=>p.name===name)
    ||list[0];
  const opponent=list.find(p=>p.id!==local.id)||null;
  return {player:local,opponent};
},[room?.players,me?.id,socket.id,name]);
const battlePlayerCharacter=findCharacter(battlePlayers.player?.character);
const battleOpponentCharacter=findCharacter(battlePlayers.opponent?.character);
const meta=LEVELS.find(entry=>entry.id===Number(room?.levelId||level))||LEVELS[0];
const playerSubmitted=Boolean(room?.answered?.[battlePlayers.player?.id]?.submitted);
const opponentSubmitted=Boolean(room?.answered?.[battlePlayers.opponent?.id]?.submitted);

const getFighterVital=(fighter)=>{
  if(room?.mode==='score'){
    const points=Number(fighter?.score)||0;
    const maxPoints=(room?.totalQuestions||10)*100;
    return {label:t('score'),value:points,progress:Math.max(0,Math.min(100,points/maxPoints*100)),score:true};
  }
  const hp=Math.max(0,Number(fighter?.hp??100));
  return {label:'HP',value:`${hp}/100`,progress:Math.max(0,Math.min(100,hp)),score:false};
};
const playerVital=getFighterVital(battlePlayers.player);
const opponentVital=getFighterVital(battlePlayers.opponent);

useEffect(()=>{
  if(room?.status!=='battle')return;
  playerBattleRef.current?.idle();
  opponentBattleRef.current?.idle();
},[room?.status,room?.questionIndex]);

useEffect(()=>{
  const event=room?.combatEvent;
  if(room?.status!=='battle'||!event||!event.seq)return;
  const distance=getArenaLungeDistance();
  if(event.playerId===battlePlayers.player?.id){
    playerBattleRef.current?.play('attack',{distance});
  }else{
    opponentBattleRef.current?.play('attack',{distance});
  }
  setBattleImpact({side:event.playerId===battlePlayers.player?.id?'boss':'player',amount:room?.mode==='score'?100:(event.damage||10),seq:event.seq});
  const impactTimer=setTimeout(()=>setBattleImpact(current=>current?.seq===event.seq?null:current),850);
  return()=>clearTimeout(impactTimer);
},[room?.status,room?.combatEvent?.seq,battlePlayers.player?.id]);

  const runWhenConnected=(action)=>{
    if(socket.connected){action();return;}
    // Keep the first pending action and run it once the socket is ready.
    if(!pendingActionRef.current)pendingActionRef.current=action;
    setError('');
    socket.connect();
  };
  const prepareRoomToken=()=>{
    const token=globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
    localStorage.removeItem('solvox.mpRoomCode');
    localStorage.removeItem('numericore.mpToken');
    localStorage.removeItem('aljabarmaster.mpToken');
    localStorage.setItem('solvox.mpToken',token);
    localStorage.setItem('solvox.mpCharacter',char);
    return token;
  };
  const create=(bot=false)=>{
    const token=prepareRoomToken();
    runWhenConnected(()=>{setError('');setAnswerInfo(null);socket.emit('room:create',{name,character:char,levelId:level,lang,mode:battleMode,bot,token})});
  };
  const join=()=>{
    const roomCode=code.trim().toUpperCase();
    if(!/^AJM-[A-Z0-9]{4}$/.test(roomCode)){setError('ROOM_CODE');return;}
    const token=prepareRoomToken();
    runWhenConnected(()=>{setError('');socket.emit('room:join',{code:roomCode,name,character:char,lang,token})});
  };
  const ready=()=>runWhenConnected(()=>{
    if(room?.status==='waiting')socket.emit('player:update',{character:char,name});
    socket.emit('player:ready',{ready:true});
  });
  const submit=()=>{if(!answer.trim()||(room?.mode==='turn'&&!current)||(room?.mode==='score'&&playerSubmitted))return;const submittedAnswer=answer;runWhenConnected(()=>socket.emit('answer:submit',{answer:submittedAnswer}))};
  const useTurnHint=()=>{const nextHintCost=5*((me?.hintsUsed||0)+1);if(!room||room.status!=='battle'||room.mode!=='turn'||!current||!room.question?.hints?.length||Number(me?.hintsUsed||0)>=2)return;if(Number(me?.hp||0)<=nextHintCost){setAnswerInfo({correct:false,explanation:t('hintNotEnoughHp')});return;}socket.emit('turn:hint')};
  const changeMyCharacter=(next)=>{
    setChar(next);
    localStorage.setItem('solvox.mpCharacter',next);
    if(room?.status==='waiting')socket.emit('player:update',{character:next,name});
  };
  const leaveMultiplayer=()=>{
    const finishLeave=()=>{
      roomRef.current=null;
      setRoom(null);
      localStorage.removeItem('solvox.mpRoomCode');
      localStorage.removeItem('solvox.mpToken');
      localStorage.removeItem('numericore.mpToken');
      localStorage.removeItem('aljabarmaster.mpToken');
      onBack?.();
    };
    if(socket.connected)socket.timeout(750).emit('room:leave',finishLeave);
    else finishLeave();
  };

  const myStats=dashboard?.players?.find(p=>String(p.name).trim().toLowerCase()===String(name).trim().toLowerCase());
  const bestAccuracy=Math.max(...(dashboard?.players||[]).map(p=>p.accuracy||0),0);
  const totalWins=(dashboard?.players||[]).reduce((n,p)=>n+(p.wins||0),0);
  const badges=[
    myStats?.matches>=1&&'FIRST MATCH',
    myStats?.accuracy>=80&&'SHARP MIND',
    myStats?.wins>=3&&'ARENA VETERAN',
    myStats?.avgScore>=700&&'COMBO MASTER'
  ].filter(Boolean);

  return <div className="multi-page multiplayer">
    <div className="multi-home-bg" aria-hidden="true">
      <video autoPlay loop muted playsInline preload="metadata" poster="/assets/home/home-background-v83-poster.jpg">
        <source src="/assets/home/home-background-v83.mp4" type="video/mp4" />
      </video>
    </div>
    <div className="multi-ambient" aria-hidden="true"><span/><i/><b/></div>
    <div className="multi-header">
      <button className="multi-back-btn" type="button" onClick={leaveMultiplayer} aria-label={t('back')} title={t('back')}><SolvoxUtilityArt name="back" size={20} className="solvox-back-art" /><span className="solvox-back-label">{t('back')}</span></button>
      <div className="multi-header-copy"><div className="eyebrow">{GAME_META.title.toUpperCase()}</div><h1>{t('battleWithFriend')}</h1><p>{t('arenaTip')}</p></div>
      <div className={`multi-connection-status status-dot ${socketConnected ? '' : 'is-connecting'}`} aria-live="polite"><i/> {socketConnected ? t('online') : (lang==='en' ? 'Connecting…' : 'Menghubungkan…')}</div>
    </div>
    {errText&&<div className="error-banner">{errText}</div>}

    {!room&&<>
      <div className="multi-grid">
        <div className="multi-card host-card">
          <div className="player-slot-label"><span>{t('player1')}</span><b>{t('host')}</b></div>
          <h2><PixelIcon name="sword" size={18}/><span>{t('createArena')}</span></h2>
          <p className="card-subtitle">{t('createArenaDesc')}</p>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t('name')}/>
          <select value={level} onChange={e=>setLevel(Number(e.target.value))}>{[1,2,3,4,5].map(x=><option key={x} value={x}>Chapter {x}{x===5?' • '+t('finalBoss'):''}</option>)}</select>
          <div className="mode-choice"><button className={battleMode==='turn'?'active':''} onClick={()=>setBattleMode('turn')}>{t('turnBased')}</button><button className={battleMode==='score'?'active':''} onClick={()=>setBattleMode('score')}>{t('scoreDuel')}</button></div>
          <p className="mode-desc">{battleMode==='turn'?t('turnBasedDesc'):t('scoreDuelDesc')}</p><div className="tiebreak-note"><PixelIcon name="hint" size={14}/><span>{t('tieBreakHintRule')}</span></div>
          <div className="multi-actions"><button className="primary-btn" onClick={()=>create(false)}>{t('create')}</button><button className="primary-btn multi-bot-btn" onClick={()=>create(true)}>{t('playVsBot')}</button></div>
        </div>

        <div className="multi-card join-card">
          <div className="player-slot-label"><span>{t('player2')}</span><b>{t('challenger')}</b></div>
          <h2>ðŸ”— {t('joinArena')}</h2>
          <p className="card-subtitle">{t('joinArenaDesc')}</p>
          <input value={code} maxLength={8} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,''))} placeholder="AJM-OOOO"/>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t('name')}/>
          <button className="primary-btn" onClick={join}>{t('join')}</button>
        </div>
      </div>

      <div className="dashboard-card--legacy dashboard-card">
        <div className="dashboard-head--legacy dashboard-head--summary">
          <div>
            <div className="eyebrow">{t('dashboard')}</div>
            <h2>{t('dashboardHint')}</h2>
          </div>
          <div className="dashboard-spark"><PixelIcon name="crown" size={24}/></div>
        </div>
        {dashboardLoading && !dashboard ? (
          <div className="dashboard-empty--legacy">{t('loading')}</div>
        ) : dashboard?.summary?.playerEntries ? (
          <>
            <div className="dashboard-hero-row">
              <div className="dashboard-identity">
                <div className="dashboard-avatar">{String(name || 'P').slice(0, 1).toUpperCase()}</div>
                <div>
                  <span>{t('dashboardPlayer')}</span>
                  <strong>{name}</strong>
                  <small>{badges.length ? badges.join(' • ') : t('dashboardMomentum')}</small>
                </div>
              </div>
              <div className="dashboard-best">
                <span>{t('dashboardTopAccuracy')}</span>
                <b>{bestAccuracy}%</b>
                <small>{totalWins} {t('wins')}</small>
              </div>
            </div>
            <div className="dashboard-metrics--legacy dashboard-metrics">
              <div><span>{t('matchesPlayed')}</span><b>{myStats?.matches || 0}</b></div>
              <div><span>{t('avgAccuracy')}</span><b>{myStats?.accuracy || 0}%</b></div>
              <div><span>{t('wins')}</span><b>{myStats?.wins || 0}</b></div>
              <div><span>{t('dashboardTotalScore')}</span><b>{myStats?.avgScore || 0}</b></div>
              <div><span>{t('avgHints')}</span><b>{myStats?.avgHints || 0}</b></div>
            </div>
            <div className="dashboard-table-wrap--legacy dashboard-table-wrap">
              <table>
                <thead><tr><th>#</th><th>{t('player')}</th><th>{t('matchesPlayed')}</th><th>{t('avgAccuracy')}</th><th>{t('wins')}</th><th>{t('draws')}</th><th>{t('losses')}</th><th>{t('avgHints')}</th></tr></thead>
                <tbody>{dashboard.players.map((p, i) => (
                  <tr key={p.name}>
                    <td><span className={`rank-chip rank-${i + 1}`}>{i + 1}</span></td>
                    <td><strong>{p.name}</strong></td><td>{p.matches}</td><td>{p.accuracy}%</td><td>{p.wins}</td><td>{p.draws}</td><td>{p.losses}</td><td>{p.avgHints || 0}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="dashboard-empty--legacy dashboard-empty">
            <div><PixelIcon name="chart" size={28}/></div>
            <b>{t('dashboardEmpty')}</b>
            <span>{t('startMatchForStats')}</span>
          </div>
        )}
      </div>
    </>}

    {room&&<div className={`room-card multi-room--legacy multi-room ${room.status==='battle'?'is-battling':''}`}>
      <div className="multi-room-heading">
        <div className="room-top-title"><div className="eyebrow">{room.mode==='turn'?t('turnBased'):t('scoreDuel')}</div><div className="room-code">{room.code}</div></div>
        <div className="match-meta">{room.isBot? t('botReady') : `${t('questionSource')}: ${room.questionSource}`}</div>
      </div>
      {room.status==='waiting'&&<section className="multi-character-selection">
        <div className="multi-character-selection-heading"><div><small>{t('yourFighter')}</small><h2>{t('characterSelect')}</h2></div><span>{t('multiplayerCharacterHint')}</span></div>
        <CharacterPicker value={char} onChange={changeMyCharacter} levelId={room.levelId||level} t={t}/>
      </section>}
      <div className="room-status">{statusText()}</div>
       {answerInfo&&<div className={`mp-feedback-banner ${answerInfo.correct?'ok':'bad'}`} role="alert" aria-live="polite">
         <strong>{answerInfo.correct ? 'âœ“ '+t('correct') : 'âœ• '+t('wrong')}</strong>
         <span>{answerInfo.explanation}</span>
       </div>}
      {room.status==='waiting'&&<button className="primary-btn wide-action" onClick={ready}><PixelIcon name="check" size={16}/><span>{t('ready')}</span></button>}
      {room.status==='generating'&&<div className="match-loading">âœ¨ {t('generatingMatch')}</div>}
{room.status==='battle'&&room.question&&<div className="battle-page battle-reference multiplayer-battle-page">
  <div className="battle-world">
    <ArenaBackground levelId={room.levelId||level}/>
    <div className="battle-ui multiplayer-battle-ui">
      <header className="battle-top-rail">
        <button className="battle-home-back" type="button" onClick={leaveMultiplayer} aria-label={t('back')} title={t('back')}><SolvoxUtilityArt name="back" size={26} className="solvox-back-art"/></button>
        <div className="hp-card hp-player">
          <div className="hp-card-head"><span className="hp-avatar"><img src={battlePlayerCharacter.portrait} alt=""/></span><span className="hp-copy"><small>{t('player1')} / {battlePlayers.player?.name||name}</small><b>{playerVital.score?`${playerVital.value} ${t('score')}`:`${battlePlayers.player?.hp??100} / 100`}</b></span><span className="hp-percent">{playerVital.score?`${Math.round(playerVital.progress)}%`:`${Math.max(0,battlePlayers.player?.hp??100)}%`}</span></div>
          <div className="hp-track"><span style={{width:`${playerVital.progress}%`}}/></div><div className="hp-footer"><span>{room.mode==='score'?(playerSubmitted?t('waiting'):t('scoreDuelBadge')):(current?t('turnYour'):t('turnOpponent'))}</span><span>{playerVital.score?t('score'):'HP'}</span></div>
        </div>
        <div className="stage-crown"><span><PixelIcon name="crown" size={12}/>{lang==='en'?meta.chapterEn:meta.chapter} / {t('round')} {room.round||1}/{room.totalQuestions||10}</span><b>{lang==='en'?meta.titleEn:meta.title}</b></div>
        <div className="hp-card hp-boss">
          <div className="hp-card-head"><span className="hp-avatar boss"><img src={battleOpponentCharacter.portrait} alt=""/></span><span className="hp-copy"><small>{t('player2')} / {battlePlayers.opponent?.name||t('player2')}</small><b>{opponentVital.score?`${opponentVital.value} ${t('score')}`:`${battlePlayers.opponent?.hp??100} / 100`}</b></span><span className="hp-percent">{opponentVital.score?`${Math.round(opponentVital.progress)}%`:`${Math.max(0,battlePlayers.opponent?.hp??100)}%`}</span></div>
          <div className="hp-track"><span style={{width:`${opponentVital.progress}%`}}/></div><div className="hp-footer"><span>{room.mode==='score'?(opponentSubmitted?t('waiting'):t('scoreDuelBadge')):t('opponent')}</span><span>{opponentVital.score?t('score'):'HP'}</span></div>
        </div>
      </header>
      {answerInfo&&!answerInfo.correct&&<aside className="battle-mistake-banner" role="alert" aria-live="polite"><span className="battle-mistake-icon"><PixelIcon name="warning" size={15}/></span><div className="battle-mistake-copy"><div className="battle-mistake-heading"><b>{t('wrong')}</b><span>{t('questionNumber')} {room.questionIndex+1}</span></div><p>{answerInfo.explanation}</p></div></aside>}
      <div className="battle-reference-arena multiplayer-arena" data-combat-seq={room.combatEvent?.seq||''}>
        <div className="combat-stage multiplayer-combat-stage" data-level={room.levelId||level}>
          <div className="fighter-slot fighter-player-slot"><div className="fighter-player player-lane-shift"><div className="fighter-shadow-anchor" aria-hidden="true"/><MultiplayerFighter ref={playerBattleRef} characterId={battlePlayerCharacter.id} levelId={room.levelId||level} size={278} mirrored={battlePlayerCharacter.kind==='boss'} attackDirection={1} onImpact={playerBattleImpact}/></div></div>
          <div className="multiplayer-stage-center"><span>VS</span><small>{room.mode==='turn'?`${t('turnBased')} / ${seconds}s`:`${t('scoreDuel')} / ${seconds}s`}</small></div>
          <div className="fighter-slot fighter-boss-slot"><div className="fighter-boss"><div className="fighter-shadow-anchor" aria-hidden="true"/><MultiplayerFighter ref={opponentBattleRef} characterId={battleOpponentCharacter.id} levelId={room.levelId||level} size={310} mirrored={battleOpponentCharacter.kind==='player'} attackDirection={-1} onImpact={opponentBattleImpact}/></div></div>
        </div>
      </div>
      <BattleQuestionPanel
        q={{...room.question,attempts:0}}
        levelId={room.levelId||level}
        meta={meta}
        lang={lang}
        t={t}
        round={room.round||1}
        totalRounds={room.totalQuestions||10}
        idx={room.questionIndex||0}
        answer={answer}
        setAnswer={setAnswer}
        busy={room.mode==='turn'?!current:playerSubmitted}
        submit={submit}
        hintsUsed={Number(me?.hintsUsed||0)}
        hintsLeft={Math.max(0,2-Number(me?.hintsUsed||0))}
        hintCost={5*(Number(me?.hintsUsed||0)+1)}
        currentHp={Number(me?.hp||0)}
        useHint={useTurnHint}
        keypadVisible={keypadVisible}
        onToggleKeypad={()=>setKeypadVisible(value=>!value)}
        showHintRail={room.mode==='turn'}
        showAttemptCounter={false}
      />
      <HitEffect side={battleImpact?.side} amount={battleImpact?.amount} theme={battleImpact?.side==='boss'?'boss':'player'}/>
    </div>
  </div>
</div>}
{room.status==='finished'&&<div className="match-result"><div className="result-emblem"><PixelIcon name={winnerName?'trophy':'star'} size={48}/></div><h2>{winnerName?`${winnerName} — ${t('matchFinished')}`:t('draw')}</h2><p>{room.players?.map(p=>`${p.name}: ${room.mode==='turn'?p.hp+' HP':' '+p.score+' '+t('score')} • ${p.hintsUsed||0} ${t('hints')}`).join(' • ')}</p><div className="match-pedagogy">{room.finishSummary?.[me?.id]||statusText()}</div><section className="match-evaluation" aria-label={t('matchEvaluation')}><h3>{t('matchEvaluation')}</h3><div className="match-evaluation-grid">{room.players?.map(p=>{const answered=Number(p.answered||0);const correct=Number(p.correct||0);const accuracy=answered?Math.round(correct/answered*100):0;return <article key={p.id}><b>{p.name}</b><span>{correct}/{answered} {t('correct')} · {accuracy}% {t('accuracy')}</span><small>{room.mode==='turn'?`${p.hp} HP · `:`${p.score} ${t('score')} · `}{p.hintsUsed||0} ${t('hints')}</small></article>;})}</div></section><div className="match-result-actions"><button className="secondary-btn" onClick={()=>setShowMatchReview(v=>!v)}><PixelIcon name="book" size={14}/><span>{showMatchReview?t('close'):t('viewSolution')}</span></button>{room.players?.length===2?<button className="primary-btn" onClick={()=>runWhenConnected(()=>socket.emit('rematch'))}><PixelIcon name="retry" size={16}/><span>{t('rematch')}</span></button>:<button className="primary-btn" onClick={leaveMultiplayer}><SolvoxUtilityArt name="back" size={18}/><span>{t('back')}</span></button>}</div>{showMatchReview&&room.decisiveQuestion&&<div className="match-review"><span>{t('questionReview')}</span><h3>{room.decisiveQuestion.text}</h3><b>{t('expected')}: {room.decisiveQuestion.answer}</b><p>{room.decisiveQuestion.explanation}</p><small>{room.decisiveQuestion.concept}</small></div>}</div>}
    </div>}
  </div>;
}
