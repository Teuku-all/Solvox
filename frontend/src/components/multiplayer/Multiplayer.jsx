import React,{useEffect,useMemo,useRef,useState} from 'react';
import {io} from 'socket.io-client';
import CharacterPicker, { findCharacter } from '../character/CharacterPicker';
import PixelIcon from '../shared/PixelIcon';
import SolvoxBrandLogo from '../shared/SolvoxBrandLogo';
import MultiplayerFighter from '../battle/MultiplayerFighter';
import ArenaBackground from '../battle/ArenaBackground';
import BattleQuestionPanel from '../battle/BattleQuestionPanel';
import HitEffect from '../battle/HitEffect';
import SolvoxBackButton from '../shared/SolvoxBackButton';
import {GAME_META} from '../../config/game';
import {LEVELS} from '../../data/levels';
import { playCharacterAttack, playSound, setMultiplayerLobbyMusicActive } from '../../services/sound';
import {apiJson,SOCKET_URL} from '../../services/api';
import { getContactLungeDistance } from '../battle/combatMotion';

const turnSecondsForLevel=(levelId)=>45+15*(Math.min(5,Math.max(1,Number(levelId)||1))-1);

export default function Multiplayer({lang,onBack,onPlay,t,playerName='',onBattleStateChange,dashboardOnly=false}){
  const [socket]=useState(()=>io(SOCKET_URL || undefined,{
    autoConnect:false,
    transports:['websocket','polling'],
    tryAllTransports:true,
  }));
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
  const [error,setError]=useState('');
  const [answer,setAnswer]=useState('');
  const [seconds,setSeconds]=useState(45);
  const [battleImpacts,setBattleImpacts]=useState([]);
  const [attackingSide,setAttackingSide]=useState('');
  const [showMatchReview,setShowMatchReview]=useState(false);
  const [dashboard,setDashboard]=useState(null);
  const [dashboardLoading,setDashboardLoading]=useState(false);
  const [dashboardError,setDashboardError]=useState(false);

  const loadDashboard=()=>{
    setDashboardLoading(true);
    setDashboardError(false);
    apiJson('/api/dashboard?limit=20').then(data=>setDashboard(data)).catch(()=>{setDashboard(null);setDashboardError(true)}).finally(()=>setDashboardLoading(false));
  };
  useEffect(()=>{if(playerName)setName(playerName)},[playerName]);
  useEffect(()=>{
    setMultiplayerLobbyMusicActive(!dashboardOnly&&room?.status!=='battle'&&room?.status!=='finished');
  },[dashboardOnly,room?.status]);
  useEffect(()=>()=>setMultiplayerLobbyMusicActive(false),[]);
  useEffect(()=>{loadDashboard();},[]);
  useEffect(()=>{
    if(dashboardOnly)return;
    const events=['room:created','room:update','game:start','game:generating','turn:next','turn:answer','round:resolved','round:next','score:answer','game:finished','rematch:ready','player:left','player:disconnected','room:reconnected'];
    const storedToken=()=>localStorage.getItem('solvox.mpToken')||localStorage.getItem('numericore.mpToken')||localStorage.getItem('aljabarmaster.mpToken')||'';
    const handler=r=>{
      roomRef.current=r||null;
      onBattleStateChange?.(r?.status==='battle');
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
    const onAnswerResult=x=>{
      setAnswer('');
      if(x?.code==='NOT_YOUR_TURN')return;
      playSound(x?.correct?'correct':'wrong');
    };
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
    socket.on('room:error',onRoomError);
    socket.connect();
    return()=>{
      events.forEach(e=>socket.off(e,handler));
      socket.off('connect',onConnect);socket.off('disconnect',onDisconnect);socket.off('connect_error',onConnectError);
      socket.off('answer:result',onAnswerResult);socket.off('room:error',onRoomError);
      onBattleStateChange?.(false);
      socket.disconnect();
    };
  },[socket,onBattleStateChange,dashboardOnly]);
  useEffect(()=>{
    if(!room)return;
    setAnswer('');
  },[room?.code,room?.status,room?.questionIndex]);
  useEffect(()=>{
    if(!room||room.status!=='battle')return setSeconds(room?.mode==='turn'?turnSecondsForLevel(room.levelId):45);
    const started=room.turnStartedAt||Date.now();
    const duration=room.turnDuration||(room.mode==='turn'?turnSecondsForLevel(room.levelId)*1000:45000);
    const tick=()=>setSeconds(Math.max(0,Math.ceil((duration-(Date.now()-started))/1000)));
    tick();const id=setInterval(tick,250);return()=>clearInterval(id);
  },[room?.status,room?.turnStartedAt,room?.questionIndex,room?.turnToken,room?.turnDuration,room?.levelId,room?.mode]);

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
const didWin=Boolean(me&&((room?.winner&&room.winner===me.id)||room?.winnerName===me.name));
const playerBattleRef=useRef(null);
const opponentBattleRef=useRef(null);
const arenaRef=useRef(null);
const activeAttacksRef=useRef({player:null,opponent:null});
const combatTimersRef=useRef(new Set());
const refreshAttackingSide=()=>{
  const sides=Object.entries(activeAttacksRef.current).filter(([,attack])=>attack?.active).map(([side])=>side);
  setAttackingSide(sides.length===2?'both':sides[0]||'');
};
const playHurt=(side)=>{
  if(side==='player')playerBattleRef.current?.play('hurt');
  else opponentBattleRef.current?.play('hurt');
};
const queueHurtAfterStrike=(side,attack)=>{
  if(attack.hurtQueued)return;
  attack.hurtQueued=true;
  const timer=setTimeout(()=>{
    combatTimersRef.current.delete(timer);
    if(activeAttacksRef.current[side]?.seq===attack.seq)playHurt(side);
  },220);
  combatTimersRef.current.add(timer);
};
const showAttackImpact=(side)=>{
  const attack=activeAttacksRef.current[side];
  if(!attack||attack.impacted)return;
  attack.impacted=true;
  const targetSide=side==='player'?'opponent':'player';
  const targetAttack=activeAttacksRef.current[targetSide];
  if(targetAttack?.active){
    if(targetAttack.impacted)queueHurtAfterStrike(targetSide,targetAttack);
    else targetAttack.pendingHurt=true;
  }else{
    playHurt(targetSide);
  }
  if(attack.pendingHurt)queueHurtAfterStrike(side,attack);
  const impact={side:side==='player'?'boss':'player',amount:attack.amount,seq:attack.seq};
  setBattleImpacts(current=>[...current.filter(item=>item.seq!==attack.seq),impact]);
  const timer=setTimeout(()=>{
    combatTimersRef.current.delete(timer);
    setBattleImpacts(current=>current.filter(item=>item.seq!==attack.seq));
  },850);
  combatTimersRef.current.add(timer);
};
const playerBattleImpact=()=>showAttackImpact('player');
const opponentBattleImpact=()=>showAttackImpact('opponent');
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
  activeAttacksRef.current={player:null,opponent:null};
  combatTimersRef.current.forEach(clearTimeout);
  combatTimersRef.current.clear();
  setBattleImpacts([]);
  setAttackingSide('');
  if(room?.status!=='battle')return;
  playerBattleRef.current?.idle();
  opponentBattleRef.current?.idle();
},[room?.status,battlePlayerCharacter.id,battleOpponentCharacter.id]);

useEffect(()=>()=>{
  combatTimersRef.current.forEach(clearTimeout);
  combatTimersRef.current.clear();
},[]);

useEffect(()=>{
  const event=room?.combatEvent;
  if(room?.status!=='battle'||!event||!event.seq)return;
  const side=event.playerId===battlePlayers.player?.id?'player':'opponent';
  const distance=getContactLungeDistance(arenaRef.current,side);
  activeAttacksRef.current[side]={seq:event.seq,amount:room?.mode==='score'?100:(event.damage||10),impacted:false,active:true};
  refreshAttackingSide();
  const timer=setTimeout(()=>{
    combatTimersRef.current.delete(timer);
    if(activeAttacksRef.current[side]?.seq===event.seq){
      activeAttacksRef.current[side].active=false;
      refreshAttackingSide();
    }
  },1100);
  combatTimersRef.current.add(timer);
  if(side==='player'){
    playerBattleRef.current?.play('attack',{distance,contactAtImpact:true});
    playCharacterAttack(battlePlayers.player?.character);
  }else{
    opponentBattleRef.current?.play('attack',{distance,contactAtImpact:true});
    playCharacterAttack(battlePlayers.opponent?.character);
  }
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
    runWhenConnected(()=>{setError('');socket.emit('room:create',{name,character:char,levelId:level,lang,mode:battleMode,bot,token})});
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

  const leaderboardScore=(player)=>Number(player?.totalScore ?? player?.avgScore)||0;
  const rankedPlayers=useMemo(()=>[...(dashboard?.players||[])].sort((a,b)=>(leaderboardScore(b)-leaderboardScore(a))||(Number(b.accuracy)||0)-(Number(a.accuracy)||0)),[dashboard?.players]);
  const myStats=rankedPlayers.find(p=>String(p.name).trim().toLowerCase()===String(name).trim().toLowerCase());
  const myRank=rankedPlayers.findIndex(p=>String(p.name).trim().toLowerCase()===String(name).trim().toLowerCase());
  const maxLeaderboardScore=Math.max(1,...rankedPlayers.map(leaderboardScore));
  const nextRival=myRank>0?rankedPlayers[myRank-1]:null;
  const rivalGap=nextRival?Math.max(0,leaderboardScore(nextRival)-leaderboardScore(myStats)):0;
  const bestAccuracy=Math.max(...(dashboard?.players||[]).map(p=>p.accuracy||0),0);
  const totalWins=(dashboard?.players||[]).reduce((n,p)=>n+(p.wins||0),0);
  const badges=[
    myStats?.matches>=1&&'FIRST MATCH',
    myStats?.accuracy>=80&&'SHARP MIND',
    myStats?.wins>=3&&'ARENA VETERAN',
    myStats?.avgScore>=700&&'COMBO MASTER'
  ].filter(Boolean);

  return <div className={`multi-page multiplayer ${room?.status==='battle'?'is-battling':''} ${dashboardOnly?'dashboard-only':''}`}>
    <div className="multi-home-bg" aria-hidden="true">
      <video autoPlay loop muted playsInline preload="metadata" poster="/assets/home/home-background-v83-poster.jpg">
        <source src="/assets/home/home-background-v83.mp4" type="video/mp4" />
      </video>
    </div>
    <div className="multi-ambient" aria-hidden="true"><span/><i/><b/></div>
    <div className="multi-header">
      <SolvoxBackButton className="multi-back-btn" labelClassName="solvox-back-label" onClick={dashboardOnly?onBack:leaveMultiplayer} label={t('back')} />
      <div className="multi-header-copy"><div className="eyebrow">{GAME_META.title.toUpperCase()}</div><h1>{dashboardOnly?(lang==='en'?'Multiplayer Leaderboard':'Leaderboard Multiplayer'):t('battleWithFriend')}</h1><p>{dashboardOnly?t('dashboardHint'):t('arenaTip')}</p></div>
      {!dashboardOnly&&<div className={socketConnected?"multi-connection-status status-dot":"multi-connection-status status-dot is-connecting"} aria-live="polite"><i/> {socketConnected ? t('online') : (lang==='en' ? 'Connecting...' : 'Menghubungkan...')}</div>}
    </div>
    {errText&&<div className="error-banner">{errText}</div>}

    {!room&&<>
      {!dashboardOnly&&<div className="multi-grid">
        <div className="multi-card host-card">
          <div className="player-slot-label"><span>{t('player1')}</span><b>{t('host')}</b></div>
          <h2><PixelIcon name="sword" size={18}/><span>{t('createArena')}</span></h2>
          <p className="card-subtitle">{t('createArenaDesc')}</p>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t('name')}/>
          <select value={level} onChange={e=>setLevel(Number(e.target.value))}>{[1,2,3,4,5].map(x=><option key={x} value={x}>Chapter {x}{x===5?' • '+t('finalBoss'):''}</option>)}</select>
          <div className="mode-choice"><button className={battleMode==='turn'?'active':''} onClick={()=>setBattleMode('turn')}>{t('turnBased')}</button><button className={battleMode==='score'?'active':''} onClick={()=>setBattleMode('score')}>{t('scoreDuel')}</button></div>
          <p className="mode-desc">{battleMode==='turn'?(lang==='en'?`Players answer in turns. Chapter ${level} gives each player ${turnSecondsForLevel(level)} seconds per turn.`:`Pemain menjawab bergiliran. Chapter ${level} memberi setiap pemain ${turnSecondsForLevel(level)} detik per giliran.`):t('scoreDuelDesc')}</p>
          <div className="multi-actions"><button className="primary-btn" onClick={()=>create(false)}>{t('create')}</button><button className="primary-btn multi-bot-btn" onClick={()=>create(true)}>{t('playVsBot')}</button></div>
        </div>

        <div className="multi-card join-card">
          <div className="player-slot-label"><span>{t('player2')}</span><b>{t('challenger')}</b></div>
          <h2><PixelIcon name="party" size={18}/><span>{t('joinArena')}</span></h2>
          <p className="card-subtitle">{t('joinArenaDesc')}</p>
          <input value={code} maxLength={8} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,''))} placeholder="AJM-OOOO"/>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={t('name')}/>
          <button className="primary-btn" onClick={join}>{t('join')}</button>
        </div>
      </div>}

      <section className="leaderboard-card">
        <header className="leaderboard-header">
          <div className="leaderboard-heading"><span className="leaderboard-heading-mark" aria-hidden="true">‹</span><div><span className="leaderboard-eyebrow">SOLVOX ARENA</span><h2>{lang==='en'?'LEADERBOARD':'PAPAN PERINGKAT'}</h2></div></div>
          <SolvoxBrandLogo compact className="leaderboard-brand" />
          <div className="leaderboard-header-meta"><span>{lang==='en'?'ALL TIME':'SEMUA WAKTU'}</span>{dashboard?.summary&&<span className="leaderboard-online"><i/>{dashboard.summary.uniquePlayers} {lang==='en'?'PLAYERS':'PEMAIN'}</span>}</div>
        </header>
        {dashboardLoading && !dashboard ? <div className="leaderboard-loading"><PixelIcon name="spark" size={26}/><span>{t('loading')}</span></div> : dashboard?.summary?.playerEntries ? <>
          <div className="leaderboard-overview" aria-label={lang==='en'?'Arena summary':'Ringkasan arena'}>
            <div><small>{lang==='en'?'PLAYERS':'PEMAIN'}</small><strong>{Number(dashboard.summary.uniquePlayers||0).toLocaleString(lang==='en'?'en-US':'id-ID')}</strong></div>
            <div><small>{lang==='en'?'MATCHES':'PERTANDINGAN'}</small><strong>{Number(dashboard.summary.matches||0).toLocaleString(lang==='en'?'en-US':'id-ID')}</strong></div>
            <div><small>{lang==='en'?'YOUR RANK':'PERINGKATMU'}</small><strong>{myStats?`#${myRank+1}`:'—'}</strong></div>
            <div className="leaderboard-overview-action"><button type="button" onClick={loadDashboard} disabled={dashboardLoading} aria-label={t('dashboardRefresh')} title={t('dashboardRefresh')}><PixelIcon name="retry" size={17}/></button></div>
          </div>
          <div className="leaderboard-rival">
            <span className="leaderboard-rival-icon"><PixelIcon name={myRank===0?'crown':'sword'} size={20}/></span>
            <div><small>{myRank===0?(lang==='en'?'ARENA LEADER':'PEMIMPIN ARENA'):(lang==='en'?'NEXT RIVAL':'RIVAL BERIKUTNYA')}</small><strong>{nextRival?nextRival.name:myStats?name:lang==='en'?'Enter the ranking':'Masuk papan peringkat'}</strong><span>{nextRival?`${lang==='en'?'Point gap':'Selisih poin'}: ${rivalGap.toLocaleString(lang==='en'?'en-US':'id-ID')} PTS`:myStats?(lang==='en'?'Defend your top spot in the next duel.':'Pertahankan posisi teratas di duel berikutnya.'):(lang==='en'?'Finish a match to claim your place.':'Selesaikan match untuk merebut posisi.')}</span></div>
            {dashboardOnly&&<button className="leaderboard-duel-btn" type="button" onClick={onPlay}><PixelIcon name="sword" size={15}/>Duel</button>}
          </div>
          <section className="leaderboard-podium" aria-label={lang==='en'?'Top three players':'Tiga pemain teratas'}>
            {[1,0,2].map((index)=>{
              const player=rankedPlayers[index];
              const rank=index+1;
              if(!player)return <div className="leaderboard-podium-empty" key={`empty-${index}`}><span>{rank}</span><small>{lang==='en'?'OPEN SPOT':'POSISI TERBUKA'}</small></div>;
              const initials=String(player.name||'?').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
              const isSelf=String(player.name).trim().toLowerCase()===String(name).trim().toLowerCase();
              return <article className={`leaderboard-podium-card rank-${rank} ${isSelf?'is-self':''}`} key={player.name}>
                <span className="leaderboard-medal" aria-label={`${lang==='en'?'Rank':'Peringkat'} ${rank}`}>{rank===1?'★':rank}</span>
                <div className="leaderboard-avatar">{initials}</div>
                <strong className="leaderboard-player-name">{player.name}{isSelf&&<em>{lang==='en'?'YOU':'KAMU'}</em>}</strong>
                <small className="leaderboard-player-handle">@{String(player.name||'player').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,16)||'player'}</small>
                <b className="leaderboard-points">{leaderboardScore(player).toLocaleString(lang==='en'?'en-US':'id-ID')} <small>PTS</small></b>
                <span className="leaderboard-player-meta">{player.matches} {t('matchesPlayed')} · {player.wins} {t('wins')}</span>
              </article>;
            })}
          </section>
          {rankedPlayers.length>3&&<section className="leaderboard-list" aria-label={lang==='en'?'Player rankings':'Peringkat pemain'}>
            <div className="leaderboard-list-head"><span>{lang==='en'?'RANK & PLAYER':'PERINGKAT & PEMAIN'}</span><span>{lang==='en'?'TOTAL POINTS':'TOTAL POIN'}</span></div>
            <div className="leaderboard-list-scroll">
              {rankedPlayers.slice(3).filter(player=>String(player.name).trim().toLowerCase()!==String(name).trim().toLowerCase()).map((player)=>{
                const rank=rankedPlayers.indexOf(player)+1;
                const initials=String(player.name||'?').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
                const score=leaderboardScore(player);
                return <article className="leaderboard-row" key={player.name}>
                  <span className="leaderboard-row-rank">{rank}</span><span className="leaderboard-row-avatar">{initials}</span>
                  <span className="leaderboard-row-copy"><strong>{player.name}</strong><small>@{String(player.name||'player').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,16)||'player'}</small></span>
                  <span className="leaderboard-row-score"><b>{score.toLocaleString(lang==='en'?'en-US':'id-ID')} <small>PTS</small></b><i><span style={{width:`${score>0?Math.max(5,score/maxLeaderboardScore*100):0}%`}}/></i></span>
                </article>;
              })}
            </div>
            {myStats&&myRank>=3&&<div className="leaderboard-self-row">
              <span className="leaderboard-row-rank">{myRank+1}</span><span className="leaderboard-row-avatar">{String(name||'?').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase()}</span>
              <span className="leaderboard-row-copy"><strong>{name} <em>{lang==='en'?'YOU':'KAMU'}</em></strong><small>@{String(name||'player').toLowerCase().replace(/[^a-z0-9]+/g,'').slice(0,16)||'player'}</small></span>
              <span className="leaderboard-row-score"><b>{leaderboardScore(myStats).toLocaleString(lang==='en'?'en-US':'id-ID')} <small>PTS</small></b><i><span style={{width:`${leaderboardScore(myStats)>0?Math.max(5,leaderboardScore(myStats)/maxLeaderboardScore*100):0}%`}}/></i></span>
            </div>}
          </section>}
        </> : <div className={`leaderboard-empty ${dashboardError?'is-error':''}`}>
          <div className="leaderboard-empty-art" aria-hidden="true"><span/><span/><span/><i><PixelIcon name={dashboardError?'warning':'trophy'} size={30}/></i></div>
          <small>{dashboardError?(lang==='en'?'CONNECTION ISSUE':'KONEKSI ARENA'):(lang==='en'?'THE RANKING STARTS HERE':'PEREBUTAN PERINGKAT DIMULAI')}</small>
          <h3>{dashboardError?(lang==='en'?'Leaderboard unavailable':'Papan peringkat belum tersedia'):(lang==='en'?'The podium is waiting':'Podium menunggu penantang')}</h3>
          <p>{dashboardError?(lang==='en'?'Could not reach the multiplayer server. Check the connection and try again.':'Server multiplayer belum dapat dihubungi. Periksa koneksi lalu coba lagi.'):(lang==='en'?'Complete a multiplayer match to earn points and appear on the board.':'Selesaikan match multiplayer untuk mendapat poin dan masuk papan peringkat.')}</p>
          <div className="leaderboard-empty-actions"><button type="button" className="leaderboard-refresh-btn" onClick={loadDashboard} disabled={dashboardLoading}><PixelIcon name="retry" size={16}/>{t('dashboardRefresh')}</button>{dashboardOnly&&!dashboardError&&<button type="button" className="leaderboard-duel-btn" onClick={onPlay}><PixelIcon name="sword" size={16}/>{lang==='en'?'Start a duel':'Mulai duel'}</button>}</div>
        </div>}
      </section>
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
      <div className={`room-status ${room.status==='finished'?'is-finished':''}`}>{statusText()}</div>
      {room.status==='waiting'&&<button className="primary-btn wide-action" onClick={ready}><PixelIcon name="check" size={16}/><span>{t('ready')}</span></button>}
      {room.status==='generating'&&<div className="match-loading"><PixelIcon name="spark" size={16}/> {t('generatingMatch')}</div>}
{room.status==='battle'&&room.question&&<div className="battle-page battle-reference multiplayer-battle-page">
  <div className="battle-world">
    <div className="battle-ui multiplayer-battle-ui">
      <ArenaBackground levelId={room.levelId||level}/>
      <header className="battle-top-rail">
        <SolvoxBackButton className="battle-home-back solvox-back-button--compact" onClick={leaveMultiplayer} ariaLabel={t('back')} title={t('back')} />
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
      <div ref={arenaRef} className="battle-reference-arena multiplayer-arena" data-combat-seq={room.combatEvent?.seq||''} data-attacking-side={attackingSide||undefined}>
        <div className="combat-stage multiplayer-combat-stage" data-level={room.levelId||level}>
          <div className="fighter-slot fighter-player-slot"><div className="fighter-player player-lane-shift"><div className="fighter-shadow-anchor" aria-hidden="true"/><MultiplayerFighter ref={playerBattleRef} characterId={battlePlayerCharacter.id} levelId={room.levelId||level} size={278} mirrored={battlePlayerCharacter.kind==='boss'} attackDirection={1} onImpact={playerBattleImpact}/></div></div>
          <div className="multiplayer-stage-center"><span>VS</span><small>{room.mode==='turn'?`${t('turnBased')} / ${seconds}s`:`${t('scoreDuel')} / ${seconds}s`}</small></div>
          <div className="fighter-slot fighter-boss-slot"><div className="fighter-boss"><div className="fighter-shadow-anchor" aria-hidden="true"/><MultiplayerFighter ref={opponentBattleRef} characterId={battleOpponentCharacter.id} levelId={room.levelId||level} size={310} mirrored={battleOpponentCharacter.kind==='player'} attackDirection={-1} onImpact={opponentBattleImpact}/></div></div>
        </div>
      </div>
      <BattleQuestionPanel
        q={{...room.question,attempts:playerSubmitted?1:0}}
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
      />
      {battleImpacts.map(impact=><HitEffect key={impact.seq} side={impact.side} amount={impact.amount} theme={impact.side==='boss'?'boss':'player'}/>)}
    </div>
  </div>
</div>}
{room.status==='finished'&&<div className={`match-result ${winnerName?(didWin?'is-win':'is-loss'):'is-draw'}`}>
  <div className="result-status-pill"><i/>{didWin?(lang==='en'?'VICTORY':'KEMENANGAN'):winnerName?(lang==='en'?'MATCH COMPLETE':'PERTANDINGAN SELESAI'):(lang==='en'?'DRAW':'SERI')}</div>
  <div className="result-emblem"><PixelIcon name={winnerName?'trophy':'star'} size={42}/></div>
  <h2>{winnerName?(didWin?(lang==='en'?'Victory!':'Kamu Menang!'):`${winnerName} ${lang==='en'?'wins the match':'menang'}`):t('draw')}</h2>
  <p className="result-subtitle">{lang==='en'?'Match results and player performance':'Hasil pertandingan dan performa pemain'}</p>
  <div className="result-score-strip" aria-label={lang==='en'?'Final scores':'Skor akhir'}>{room.players?.map(p=><div className={`${p.id===me?.id?'is-self':''} ${p.id===room.winner?'is-winner':''}`} key={p.id}>
    <span className="result-score-avatar"><img src={findCharacter(p.character).portrait} alt=""/></span>
    <span className="result-score-player"><b>{p.name}</b><small>{p.id===room.winner?(lang==='en'?'WINNER':'PEMENANG'):p.id===me?.id?(lang==='en'?'YOU':'KAMU'):(lang==='en'?'OPPONENT':'LAWAN')}</small></span>
    <b className="result-score-value">{room.mode==='turn'?`${p.hp} HP`:`${p.score} ${t('score')}`}</b>
  </div>)}</div>
  <div className="match-pedagogy"><span className="result-pedagogy-icon"><PixelIcon name="spark" size={15}/></span><span>{room.finishSummary?.[me?.id]||statusText()}</span></div>
  <section className="match-evaluation" aria-label={t('matchEvaluation')}>
    <div className="result-section-heading"><span><small>{lang==='en'?'PERFORMANCE':'RINGKASAN'}</small><h3>{t('matchEvaluation')}</h3></span><PixelIcon name="chart" size={19}/></div>
    <div className="match-evaluation-grid">{room.players?.map(p=>{
      const answered=Number(p.answered||0);const correct=Number(p.correct||0);const accuracy=answered?Math.round(correct/answered*100):0;const portrait=findCharacter(p.character).portrait;
      return <article className={`${p.id===me?.id?'is-self':''} ${p.id===room.winner?'is-winner':''}`} key={p.id}>
        <div className="result-eval-player"><span><img src={portrait} alt=""/></span><b>{p.name}</b>{p.id===room.winner&&<i><PixelIcon name="crown" size={13}/></i>}</div>
        <div className="result-eval-stats"><span><b>{correct}<small>/{answered}</small></b><small>{t('correct')}</small></span><span><b>{accuracy}%</b><small>{t('accuracy')}</small></span></div>
        <div className="result-eval-footer"><span>{room.mode==='turn'?`${p.hp} HP`:`${p.score} ${t('score')}`}</span></div>
      </article>;
    })}</div>
  </section>
  <div className="match-result-actions">
    <button className="secondary-btn result-review-btn" onClick={()=>setShowMatchReview(v=>!v)}><PixelIcon name="book" size={15}/><span>{showMatchReview?t('close'):t('viewSolution')}</span></button>
    {room.players?.length===2?<button className="primary-btn result-rematch-btn" onClick={()=>runWhenConnected(()=>socket.emit('rematch'))}><PixelIcon name="retry" size={16}/><span>{t('rematch')}</span></button>:<SolvoxBackButton className="primary-btn result-rematch-btn" onClick={leaveMultiplayer} label={t('back')} />}
  </div>
  {showMatchReview&&room.decisiveQuestion&&<div className="match-review"><span>{t('questionReview')}</span><h3>{room.decisiveQuestion.text}</h3><b>{t('expected')}: {room.decisiveQuestion.answer}</b><p>{room.decisiveQuestion.explanation}</p><small>{room.decisiveQuestion.concept}</small></div>}
</div>}
    </div>}
  </div>;
}
