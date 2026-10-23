const express=require('express');
const http=require('http');
const path=require('path');
const os=require('os');
const crypto=require('crypto');
const fs=require('fs');
const {Server}=require('socket.io');
const questions=require('./questions');
const singlePlayerRoutes=require('./routes/singlePlayer');
const {isSameAnswer}=require('./singlePlayerGame');

const app=express();
const server=http.createServer(app);
const io=new Server(server,{cors:{origin:true,credentials:false},transports:['websocket','polling']});
const PORT=process.env.PORT||3000;
const rooms=new Map();
const ROOM_GRACE_MS=30000;
const TURN_MS=45000;
const TURN_MS_BY_CHAPTER=[45000,60000,75000,90000,105000];
function turnDurationForChapter(levelId){return TURN_MS_BY_CHAPTER[Number(levelId)-1]||TURN_MS;}
const TOTAL_QUESTIONS=10;
const DAMAGE_PER_CORRECT=20;

const CHARACTERS={
  traveler:{id:'traveler',name:'Kazura',hp:100,color:'#efbd52'},
  asuka:{id:'asuka',name:'Asuka',hp:100,color:'#f17a83'},
  wolf:{id:'wolf',name:'Wolf',hp:100,color:'#b84cff'},
  wraith:{id:'wraith',name:'Wraith',hp:100,color:'#38d8ff'},
  'equation-drake':{id:'equation-drake',name:'Equation Drake',hp:100,color:'#35dfff'},
  titan:{id:'titan',name:'Titan',hp:100,color:'#d8a56b'},
  axiom:{id:'axiom',name:'Axiom',hp:100,color:'#74f0df'}
};
function cleanCharacter(value,fallback='traveler'){return CHARACTERS[value]?value:fallback;}
function cleanName(v,fallback='Player'){return String(v||fallback).trim().slice(0,18)||fallback;}
function cleanLevel(v){const n=Number(v);return questions[n]?n:1;}
function cleanToken(v){return String(v||'').trim().slice(0,80);}
function makeCode(){let code;do code='AJM-'+Math.random().toString(36).slice(2,6).toUpperCase();while(rooms.has(code));return code;}
function makeToken(){return crypto.randomBytes(18).toString('hex');}
function isCorrect(q,value){return isSameAnswer(value,q.acceptedAnswers||[q.answer]);}
function sanitizeQuestion(q){if(!q)return null;return {id:q.id,context:q.context,text:q.text,concept:q.concept,difficulty:q.difficulty,hints:Array.isArray(q.hints)?q.hints.slice(0,3).map(hint=>String(hint)):[]};}
function sanitizeReviewQuestion(q){if(!q)return null;return {id:q.id,context:q.context,text:q.text,answer:q.answer,explanation:q.explanation,concept:q.concept};}
function publicRoom(room){
  const currentTurn=room.turnToken?room.players.find(p=>p.token===room.turnToken):null;
  const displayPlayers=room.status==='finished'&&Array.isArray(room.resultPlayers)?room.resultPlayers:room.players;
  const playerIdByToken=new Map(displayPlayers.map((player)=>[player.token,player.id]));
  const combatEvent=room.combatEvent?{
    seq:room.combatEvent.seq,
    kind:room.combatEvent.kind,
    damage:room.combatEvent.damage,
    playerId:playerIdByToken.get(room.combatEvent.token)||null,
    targetPlayerId:playerIdByToken.get(room.combatEvent.target)||null,
  }:null;
  const finishSummary=room.finishSummary?Object.fromEntries(displayPlayers.map((player)=>[player.id,room.finishSummary[player.token]])):null;
  const winner=room.winner==='draw'?'draw':playerIdByToken.get(room.winner)||null;
  return {
    code:room.code,
    isBot:!!room.isBot,
    status:room.status,
    activePlayerCount:room.players.filter((player)=>player.connected).length,
    mode:room.mode,
    levelId:room.levelId,
    questionIndex:room.questionIndex,
    totalQuestions:room.totalQuestions,
    round:room.round,
    startedAt:room.startedAt||null,
    turnStartedAt:room.turnStartedAt,
    turnDuration:room.mode==='turn'?turnDurationForChapter(room.levelId):TURN_MS,
    currentTurnPlayerId:playerIdByToken.get(room.turnToken)||null,
    currentTurnName:currentTurn?.name||null,
    winnerName:room.winner==='draw'?null:room.players.find((player)=>player.token===room.winner)?.name||room.winnerName||null,
    players:displayPlayers.map((player)=>({
      id:player.id,
      name:player.name,
      character:player.character,
      ready:player.ready,
      hp:player.hp,
      connected:player.connected,
      score:player.score,
      correct:player.correct,
      answered:player.answered||0,
      hintsUsed:player.hintsUsed||0,
      hintsUsedThisQuestion:player.hintLevels?.[room.questionIndex]||0,
      isBot:!!player.isBot,
      turnAnswer:room.turnAnswers?.[player.token]?.submitted||false,
    })),
    question:room.started?sanitizeQuestion(room.questions[room.questionIndex]):null,
    answered:Object.fromEntries(Object.entries(room.turnAnswers||{}).map(([token,result])=>[playerIdByToken.get(token),{correct:result.correct,submitted:result.submitted}])),
    winner,
    lang:room.lang||'id',
    questionSource:room.questionSource||'fallback',
    statusKey:room.statusKey||'WAITING',
    statusName:room.statusName||null,
    finishSummary,
    decisiveQuestion:room.status==='finished'?room.decisiveQuestion:null,
    combatEvent,
  };
}
function broadcast(room,event='room:update'){io.to(room.code).emit(event,publicRoom(room));}
function clearTimer(room){if(room.timer)clearTimeout(room.timer);if(room.botTimer)clearTimeout(room.botTimer);room.timer=null;room.botTimer=null;}
function freshQuestions(levelId,lang){
  return {questions:questions.fallbackGenerate(levelId,TOTAL_QUESTIONS,lang),source:'local'};
}

const DATA_DIR=process.env.SOLVOX_DATA_DIR
  ? path.resolve(process.env.SOLVOX_DATA_DIR)
  : process.env.VERCEL
    ? path.join(os.tmpdir(),'solvox-data')
    : path.join(__dirname,'..','data');
const MATCH_LOG=path.join(DATA_DIR,'multiplayer.jsonl');
const allowedOrigins=(process.env.FRONTEND_ORIGIN||'').split(',').map(origin=>origin.trim()).filter(Boolean);
app.use((req,res,next)=>{
  const origin=req.headers.origin;
  if(origin&&(allowedOrigins.length===0||allowedOrigins.includes(origin))){
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Content-Type');
  }
  if(req.method==='OPTIONS')return res.sendStatus(204);
  next();
});
function appendJsonLine(file,payload){fs.mkdirSync(DATA_DIR,{recursive:true});fs.appendFileSync(file,JSON.stringify(payload)+'\n');}
function readJsonLines(file){if(!fs.existsSync(file))return [];return fs.readFileSync(file,'utf8').split(/\r?\n/).filter(Boolean).map(line=>{try{return JSON.parse(line)}catch{return null}}).filter(Boolean);}
function recordFinishedMatch(room){if(room.recorded||!room.startedAt||room.players.length<2)return;room.recorded=true;const winnerToken=room.winner;const finishedAt=Date.now();room.players.filter(player=>!player.isBot).forEach(player=>{const answered=Math.max(0,Number(player.answered)||0);const correct=Math.max(0,Number(player.correct)||0);appendJsonLine(MATCH_LOG,{type:'multiplayer_match',ts:new Date(finishedAt).toISOString(),matchId:room.code,levelId:room.levelId,mode:room.mode,userId:player.userId||null,player:player.name,opponent:room.players.find(p=>p.token!==player.token)?.name||'—',answered,correct,accuracy:answered?Math.round(correct/answered*100):0,score:Number(player.score)||0,hpRemaining:Number(player.hp)||0,wins:winnerToken===player.token?1:0,draw:winnerToken==='draw'?1:0,losses:winnerToken!==player.token&&winnerToken!=='draw'?1:0,durationSec:Math.max(0,Math.round((finishedAt-room.startedAt)/1000)),totalQuestions:room.totalQuestions,hintsUsed:Number(player.hintsUsed)||0,decisiveQuestion:room.decisiveQuestion?.id||null,decisiveConcept:room.decisiveQuestion?.concept||null});});}
async function startBattle(room){
  if(room.generating)return;
  room.generating=true;room.status='generating';room.statusKey='GENERATING_QUESTIONS';room.statusName=null;broadcast(room,'game:generating');
  const pack=freshQuestions(room.levelId,room.lang);
  room.questions=pack.questions;room.questionSource=pack.source;room.generating=false;room.status='battle';room.started=true;room.startedAt=Date.now();room.recorded=false;room.questionIndex=0;room.round=1;room.turnAnswers={};room.turnToken=room.mode==='score'?null:room.players[0].token;room.turnStartedAt=Date.now();room.winner=null;room.winnerName=null;room.players.forEach(p=>{p.hp=100;p.score=0;p.correct=0;p.answered=0;p.hintsUsed=0;p.ready=true;p.lastMistake=null;p.hintLevels=[];});room.mode==='score'?scheduleScoreRound(room):scheduleTurn(room);broadcast(room,'game:start');
}
function scheduleTurn(room){
  clearTimer(room);
  const current=room.players.find(p=>p.token===room.turnToken);
  if(current?.isBot){
    room.botTimer=setTimeout(()=>botSubmitTurn(room), 1800 + Math.random()*1500);
    return;
  }
  room.timer=setTimeout(()=>advanceTurn(room,true),turnDurationForChapter(room.levelId)+250);
}
function scheduleScoreRound(room){
  clearTimer(room);
  if(room.players.some(p=>p.isBot)) room.botTimer=setTimeout(()=>botSubmitScore(room), 1800 + Math.random()*1500);
  room.timer=setTimeout(()=>advanceScoreRound(room,true),TURN_MS+250);
}
function clearTurnAnswers(room){room.turnAnswers={};}
function advanceTurn(room,timeout=false){
  if(!rooms.has(room.code)||room.status!=='battle')return;
  clearTimer(room);
  const p=room.players.find(x=>x.token===room.turnToken);
  if(timeout&&!room.turnAnswers[p?.token]){room.turnAnswers[p.token]={submitted:true,correct:false,timeout:true,answer:''};room.statusKey='TURN_TIMEOUT';room.statusName=p?.name||null;}
  const idx=room.players.findIndex(x=>x.token===room.turnToken);
  if(idx<room.players.length-1){room.turnToken=room.players[idx+1].token;room.turnStartedAt=Date.now();room.statusKey='TURN_CHANGED';room.statusName=room.players[idx+1].name;broadcast(room,'turn:next');room.combatEvent=null;scheduleTurn(room);return;}
  resolveRound(room);
}
function advanceScoreRound(room,timeout=false){
  if(!rooms.has(room.code)||room.status!=='battle'||room.mode!=='score')return;
  clearTimer(room);
  if(timeout){for(const p of room.players){if(!room.turnAnswers[p.token])room.turnAnswers[p.token]={submitted:true,correct:false,timeout:true,answer:''};}room.statusKey='TIME_UP';}
  const p1=room.players[0],p2=room.players[1];
  const both=room.turnAnswers[p1.token]?.submitted&&room.turnAnswers[p2.token]?.submitted;
  if(!timeout&&!both)return;
  room.statusName=null;
  setTimeout(()=>{
    if(!rooms.has(room.code)||room.status!=='battle')return;
    if(room.questionIndex>=room.questions.length-1){finishRoom(room);return;}
    room.questionIndex++;room.round++;room.turnAnswers={};room.turnStartedAt=Date.now();room.statusKey='NEW_ROUND';broadcast(room,'round:next');scheduleScoreRound(room);
  },700);
}
function botAnswerFor(room){
  const q=room.questions[room.questionIndex];
  const correctChance=room.levelId<=2?0.74:room.levelId===3?0.69:0.64;
  if(Math.random()<correctChance){
    return Array.isArray(q?.acceptedAnswers)?q.acceptedAnswers[0]:(Array.isArray(q?.answer)?q.answer[0]:q?.answer);
  }
  return '__BOT_MISS__';
}
function botSubmitTurn(room){
  if(!rooms.has(room.code)||room.status!=='battle'||room.mode!=='turn')return;
  const bot=room.players.find(p=>p.isBot);
  const q=room.questions[room.questionIndex];
  if(!bot||room.turnToken!==bot.token||room.turnAnswers[bot.token]?.submitted||!q)return;
  const value=botAnswerFor(room);
  const correct=isCorrect(q,value);
  bot.answered=(bot.answered||0)+1;
  if(correct)bot.correct=(bot.correct||0)+1;
  if(correct)bot.score=(bot.score||0)+1;
  room.turnAnswers[bot.token]={submitted:true,correct,answer:value,timeout:false};
  if(correct)room.combatEvent={token:bot.token,target:room.players.find(p=>p.token!==bot.token)?.token,damage:DAMAGE_PER_CORRECT,seq:Date.now(),kind:'hit'};
  room.statusKey=correct?'TURN_CORRECT':'TURN_WRONG';
  room.statusName=bot.name;
  broadcast(room,'turn:answer');
  setTimeout(()=>{if(rooms.has(room.code)&&room.status==='battle')advanceTurn(room,false);},700);
}
function botSubmitScore(room){
  if(!rooms.has(room.code)||room.status!=='battle'||room.mode!=='score')return;
  const bot=room.players.find(p=>p.isBot);
  const q=room.questions[room.questionIndex];
  if(!bot||!q||room.turnAnswers[bot.token]?.submitted)return;
  const value=botAnswerFor(room);
  const correct=isCorrect(q,value);
  bot.answered=(bot.answered||0)+1;
  if(correct){bot.correct=(bot.correct||0)+1;bot.score=(bot.score||0)+100;room.combatEvent={token:bot.token,target:room.players.find(p=>p.token!==bot.token)?.token,damage:10,seq:Date.now(),kind:'hit'};}
  room.turnAnswers[bot.token]={submitted:true,correct,answer:value,timeout:false};
  room.statusKey=correct?'SCORE_CORRECT':'SCORE_WRONG';
  room.statusName=bot.name;
  broadcast(room,'score:answer');
  if(room.turnAnswers[room.players[0].token]?.submitted&&room.turnAnswers[room.players[1].token]?.submitted)advanceScoreRound(room,false);
}

function resolveRound(room){
  const p1=room.players[0],p2=room.players[1];
  const a1=room.turnAnswers[p1.token],a2=room.turnAnswers[p2.token];
  const q=room.questions[room.questionIndex];
  if(a1?.correct){p1.score=(p1.score||0)+1;p1.correct+=1;p2.hp=Math.max(0,p2.hp-DAMAGE_PER_CORRECT);room.decisiveQuestion=sanitizeReviewQuestion(q);room.combatEvent={token:p1.token,target:p2.token,damage:DAMAGE_PER_CORRECT,seq:Date.now(),kind:'hit'};}
  if(a2?.correct){p2.score=(p2.score||0)+1;p2.correct+=1;p1.hp=Math.max(0,p1.hp-DAMAGE_PER_CORRECT);room.decisiveQuestion=sanitizeReviewQuestion(q);room.combatEvent={token:p2.token,target:p1.token,damage:DAMAGE_PER_CORRECT,seq:Date.now()+1,kind:'hit'};}
  if(!a1?.correct&&a1?.submitted){p1.lastMistake={questionIndex:room.questionIndex,concept:q?.concept||'—',answer:a1.answer,correctAnswer:q?.answer,explanation:q?.explanation};}
  if(!a2?.correct&&a2?.submitted){p2.lastMistake={questionIndex:room.questionIndex,concept:q?.concept||'—',answer:a2.answer,correctAnswer:q?.answer,explanation:q?.explanation};}
  room.statusKey=(!a1?.correct&&!a2?.correct)?'BOTH_WRONG':'ROUND_RESOLVED';
  broadcast(room,'round:resolved');
  setTimeout(()=>{
    if(!rooms.has(room.code)||room.status!=='battle')return;
    if(room.questionIndex>=room.questions.length-1||p1.hp<=0||p2.hp<=0){finishRoom(room);return;}
    room.questionIndex++;room.round++;clearTurnAnswers(room);room.turnToken=p1.token;room.turnStartedAt=Date.now();room.statusKey='NEW_ROUND';room.combatEvent=null;broadcast(room,'round:next');scheduleTurn(room);
  },1000);
}
function finishRoom(room,winnerOverride=null){
  clearTimer(room);room.status='finished';room.turnStartedAt=null;
  const first=room.players[0];
  const second=room.players[1];
  if(winnerOverride)room.winner=winnerOverride;
  else if(!first||!second) room.winner=first?.token||'draw';
  else if(room.mode==='score'){
    if(first.score!==second.score) room.winner=first.score>second.score?first.token:second.token;
    else room.winner='draw';
  } else {
    if(first.hp!==second.hp) room.winner=first.hp>second.hp?first.token:second.token;
    else if((first.score||0)!==(second.score||0)) room.winner=first.score>second.score?first.token:second.token;
    else room.winner='draw';
  }
  const winner=room.players.find(p=>p.token===room.winner);
  room.winnerName=winner?.name||null;
  room.finishSummary={};
  room.players.forEach(p=>{
    const en=room.lang==='en';
    if(room.winner==='draw') room.finishSummary[p.token]=en?'Match finished! It is a draw. Both players have the same final result.':'Pertandingan selesai! Seri. Hasil akhir kedua pemain sama.';
    else if(p.token===room.winner){
      const result=room.mode==='score'?(p.score||0)+' points':'with '+(p.hp||0)+' HP remaining';
      const hasil=room.mode==='score'?(p.score||0)+' poin':'dengan '+(p.hp||0)+' HP tersisa';
      room.finishSummary[p.token]=en?'Match finished! You win '+result+'. Review the deciding question below.':'Pertandingan selesai! Kamu menang '+hasil+'. Lihat soal penentunya di bawah.';
    } else {
      const diff=room.mode==='score'?Math.abs((winner?.score||0)-(p.score||0)):Math.abs((winner?.hp||0)-(p.hp||0));
      const q=p.lastMistake?{id:p.lastMistake.questionIndex+1,text:room.questions[p.lastMistake.questionIndex]?.text,concept:p.lastMistake.concept,answer:p.lastMistake.correctAnswer,explanation:p.lastMistake.explanation}:room.decisiveQuestion;
      room.finishSummary[p.token]=q?(en?`Match finished! You lost by ${room.mode==='score'?`${diff} point${diff===1?'':'s'}`:`${diff} HP`} because of a mistake on Question ${q.id} (${q.concept}). Click View Solution to review the key and steps.`:`Pertandingan Selesai! Kamu kalah ${room.mode==='score'?`${diff} poin`:`${diff} HP`} dari lawan karena keliru di Soal No. ${q.id} (${q.concept}). Klik Lihat Pembahasan untuk melihat kunci dan langkahnya.`):(en?`Match finished! Your opponent had the stronger final result. Review the explanation to reinforce the concepts you need most.`:`Pertandingan Selesai! Lawan memiliki hasil akhir lebih tinggi. Lihat pembahasan untuk memperkuat konsep yang perlu kamu latih.`);
    }
  });
  room.resultPlayers=room.players.map(player=>({...player}));
  room.statusKey=room.winner==='draw'?'DRAW':'MATCH_FINISHED'; room.combatEvent=null; recordFinishedMatch(room); broadcast(room,'game:finished');
}

function findPlayer(room,socket){return room?.players.find(p=>p.id===socket.id);}
function rebindSocket(room,player,socket){player.id=socket.id;player.connected=true;if(player.disconnectTimer)clearTimeout(player.disconnectTimer);player.disconnectTimer=null;socket.join(room.code);socket.data.roomCode=room.code;socket.data.playerToken=player.token;}

const FRONTEND_DIST=path.join(__dirname,'..','frontend','dist');
app.use(express.json({limit:'128kb'}));

if(!process.env.VERCEL) app.use(express.static(FRONTEND_DIST, {
  setHeaders(res, filePath) {
    const assetPath = filePath.replace(/\\/g, '/');
    if (/\/assets\/optimized\//.test(assetPath) || /\/assets\/[^/]+-[\w-]{8,}\.(js|css)$/.test(assetPath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (/\.(webp|png|jpe?g|mp4|mp3|ttf)$/.test(assetPath)) {
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    } else if (assetPath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));
app.use('/api/single-player',singlePlayerRoutes);

app.post('/api/questions/generate',(req,res)=>{
  const chapterId=cleanLevel(req.body?.chapterId);const lang=req.body?.lang==='en'?'en':'id';
  try{const pack=freshQuestions(chapterId,lang);res.json({ok:true,chapterId,lang,totalQuestions:pack.questions.length,source:pack.source,questions:pack.questions});}
  catch(e){res.status(500).json({ok:false,message:'Question generation failed'});}
});

app.post('/api/feedback',(req,res)=>{
  try{
    fs.mkdirSync(DATA_DIR,{recursive:true});
    fs.appendFileSync(path.join(DATA_DIR,'feedback.jsonl'),JSON.stringify({type:'feedback',ts:new Date().toISOString(),...req.body})+'\n');
    res.json({ok:true});
  }catch(e){res.status(500).json({ok:false,message:'Feedback gagal disimpan'});}
});

app.post('/api/evaluation',(req,res)=>{
  try{
    const run=req.body&&typeof req.body==='object'?req.body:{};
    const cleanRun={...run,ts:run.ts||Date.now()};
    appendJsonLine(path.join(DATA_DIR,'evaluation.jsonl'),{type:'evaluation',...cleanRun});
    res.json({ok:true});
  }catch(e){res.status(500).json({ok:false,message:'Evaluasi gagal disimpan'});}
});

app.get('/api/player-profile',(req,res)=>{
  try{
    const wanted=String(req.query?.name||'').trim().toLowerCase();
    const rows=readJsonLines(MATCH_LOG).filter(r=>!wanted||String(r.player||'').trim().toLowerCase()===wanted);
    if(!rows.length)return res.json({ok:true,player:null});
    const matches=rows.length;
    const wins=rows.reduce((n,r)=>n+(Number(r.wins)||0),0);
    const draws=rows.reduce((n,r)=>n+(Number(r.draw)||0),0);
    const losses=rows.reduce((n,r)=>n+(Number(r.losses)||0),0);
    const answered=rows.reduce((n,r)=>n+(Number(r.answered)||0),0);
    const correct=rows.reduce((n,r)=>n+(Number(r.correct)||0),0);
    const totalScore=rows.reduce((n,r)=>n+(Number(r.score)||0),0);
    const totalTime=rows.reduce((n,r)=>n+(Number(r.durationSec)||0),0);
    const totalHints=rows.reduce((n,r)=>n+(Number(r.hintsUsed)||0),0);
    const accuracy=answered?Math.round(correct/answered*100):0;
    const avgScore=matches?Math.round(totalScore/matches):0;
    const avgDuration=matches?Math.round(totalTime/matches):0;
    const avgHints=matches?Math.round(totalHints/matches*10)/10:0;
    res.json({ok:true,player:{name:rows[0].player||'Player',matches,wins,draws,losses,answered,correct,accuracy,avgScore,avgDuration,totalHints,avgHints,lastPlayed:rows.map(r=>r.ts).sort().slice(-1)[0]}});
  }catch(e){res.status(500).json({ok:false,message:'Profil pemain gagal dimuat'});}
});

app.get('/api/dashboard',(req,res)=>{
  try{
    const limit=Math.max(1,Math.min(100,Number(req.query.limit)||30));
    const rows=readJsonLines(MATCH_LOG);
    const players=new Map();
    for(const row of rows){
      const key=String(row.player||'Player').trim().toLowerCase()||'player';
      const item=players.get(key)||{userId:null,name:row.player,matches:0,wins:0,draws:0,losses:0,totalCorrect:0,totalAnswered:0,totalScore:0,totalAccuracy:0,totalHints:0,lastPlayed:row.ts};
      item.matches++;item.wins+=row.wins||0;item.draws+=row.draw||0;item.losses+=row.losses||0;item.totalCorrect+=row.correct||0;item.totalAnswered+=row.answered||0;item.totalScore+=row.score||0;item.totalAccuracy+=row.accuracy||0;item.totalHints+=row.hintsUsed||0;
      if(new Date(row.ts)>new Date(item.lastPlayed))item.lastPlayed=row.ts;
      players.set(key,item);
    }
    const leaderboard=[...players.values()].map(item=>({...item,accuracy:item.matches?Math.round(item.totalAccuracy/item.matches):0,avgScore:item.matches?Math.round(item.totalScore/item.matches):0,answerRate:item.totalAnswered?Math.round(item.totalCorrect/item.totalAnswered*100):0,avgHints:item.matches?Math.round(item.totalHints/item.matches*10)/10:0})).sort((a,b)=>(b.totalScore-a.totalScore)||(b.accuracy-a.accuracy)).slice(0,limit);
    res.json({ok:true,summary:{matches:new Set(rows.map(r=>r.matchId)).size,playerEntries:rows.length,uniquePlayers:players.size,totalAnswered:rows.reduce((n,x)=>n+(x.answered||0),0),avgAccuracy:rows.length?Math.round(rows.reduce((n,x)=>n+(x.accuracy||0),0)/rows.length):0,totalHints:rows.reduce((n,x)=>n+(x.hintsUsed||0),0)},players:leaderboard,recent:rows.slice(-limit).reverse()});
  }catch(e){res.status(500).json({ok:false,message:'Dashboard gagal dimuat'});}
});

app.get('/health',(req,res)=>res.json({ok:true,rooms:rooms.size,transport:'socket.io',storage:'writable',turnDuration:TURN_MS,turnDurationByChapter:TURN_MS_BY_CHAPTER,questionsPerChapter:TOTAL_QUESTIONS,questionEngine:'local'}));
app.get('/api/characters',(req,res)=>res.json(Object.values(CHARACTERS)));
app.get('/api/levels',(req,res)=>res.json(Object.entries(questions).filter(([id])=>/^\d+$/.test(id)).map(([id,q])=>({id:Number(id),title:q.title,titleEn:q.titleEn,icon:q.icon,difficulty:q.difficulty,totalQuestions:TOTAL_QUESTIONS}))));
app.get('/api/lan',(req,res)=>res.json({port:PORT,hostnames:lanAddresses().map(ip=>`http://${ip}:${PORT}`)}));

io.on('connection',socket=>{
  socket.data.userId=null;
  socket.data.username='';
  socket.emit('server:info',{turnMs:TURN_MS,turnMsByChapter:TURN_MS_BY_CHAPTER,roomGraceMs:ROOM_GRACE_MS,questionsPerChapter:TOTAL_QUESTIONS,protocol:'turn-based'});
  socket.on('room:create',({name,character='traveler',levelId=1,token,lang='id',mode='turn',bot=false}={})=>{
    const playerToken=cleanToken(token)||makeToken();const code=makeCode();const level=cleanLevel(levelId);
    const room={code,hostToken:playerToken,isBot:!!bot,mode:mode==='score'?'score':'turn',status:'waiting',statusKey:'WAITING_PLAYER',levelId:level,lang:lang==='en'?'en':'id',questions:[],questionIndex:0,totalQuestions:TOTAL_QUESTIONS,round:0,turnAnswers:{},turnToken:null,turnStartedAt:null,winner:null,started:false,generating:false,questionSource:'fallback',timer:null,startedAt:null,recorded:false,players:[{id:socket.id,userId:socket.data.userId,token:playerToken,name:cleanName(name,'Player 1'),character:cleanCharacter(character),ready:false,hp:100,connected:true,score:0,correct:0,answered:0,hintsUsed:0,hintLevels:[],lastMistake:null,disconnectTimer:null}]};
    rooms.set(code,room);socket.join(code);socket.data.roomCode=code;socket.data.playerToken=playerToken;
    if(bot){
      room.players.push({id:'bot',token:makeToken(),name:'Solvox Bot',character:'axiom',ready:true,hp:100,connected:true,score:0,correct:0,answered:0,hintsUsed:0,hintLevels:[],lastMistake:null,disconnectTimer:null,isBot:true});
    }
    socket.emit('room:created',publicRoom(room));
  });
  socket.on('room:join',({code,name,character='traveler',token}={})=>{
    const room=rooms.get(String(code||'').trim().toUpperCase());if(!room)return socket.emit('room:error',{code:'ROOM_NOT_FOUND'});const playerToken=cleanToken(token);const existing=playerToken?room.players.find(p=>p.token===playerToken):null;if(existing){rebindSocket(room,existing,socket);broadcast(room);return socket.emit('room:reconnected',publicRoom(room));}
    if(room.players.length>=2)return socket.emit('room:error',{code:'ROOM_FULL'});if(room.status!=='waiting')return socket.emit('room:error',{code:'ROOM_STARTED'});const newToken=playerToken||makeToken();room.players.push({id:socket.id,userId:socket.data.userId,token:newToken,name:cleanName(name,'Player 2'),character:cleanCharacter(character),ready:false,hp:100,connected:true,score:0,correct:0,answered:0,hintsUsed:0,hintLevels:[],lastMistake:null,disconnectTimer:null});socket.join(room.code);socket.data.roomCode=room.code;socket.data.playerToken=newToken;broadcast(room);
  });
  socket.on('player:ready',async({ready=true}={})=>{const room=rooms.get(socket.data.roomCode);if(!room)return;const p=findPlayer(room,socket);if(!p)return;p.ready=!!ready;if(room.players.length===2&&room.players.every(x=>x.ready&&x.connected))await startBattle(room);else broadcast(room);});
  socket.on('player:update',({name,character}={})=>{const room=rooms.get(socket.data.roomCode);if(!room||room.status!=='waiting')return;const p=findPlayer(room,socket);if(!p)return;if(name!==undefined)p.name=cleanName(name,p.name);if(character&&CHARACTERS[character])p.character=character;broadcast(room);});
  socket.on('answer:submit',({answer}={})=>{
    const room=rooms.get(socket.data.roomCode);if(!room||room.status!=='battle')return;const p=findPlayer(room,socket);if(!p||!p.connected)return;const q=room.questions[room.questionIndex];if(!q)return;
    if(room.mode==='turn'){
      if(p.token!==room.turnToken)return socket.emit('answer:result',{correct:false,code:'NOT_YOUR_TURN'});
      if(room.turnAnswers[p.token]?.submitted)return;
       const value=String(answer||'').trim();if(!value)return;const correct=isCorrect(q,value);p.answered=(p.answered||0)+1;if(!correct)p.lastMistake={questionIndex:room.questionIndex,concept:q.concept||'—',answer:value,correctAnswer:q.answer,explanation:q.explanation||q.feedback};if(correct)p.score=(p.score||0)+1;room.turnAnswers[p.token]={submitted:true,correct,answer:value,timeout:false};if(correct)room.combatEvent={token:p.token,target:room.players.find(x=>x.token!==p.token)?.token,damage:DAMAGE_PER_CORRECT,seq:Date.now(),kind:'hit'};room.statusKey=correct?'TURN_CORRECT':'TURN_WRONG';room.statusName=p.name;socket.emit('answer:result',{correct,feedback:correct?'':String(q.feedback||q.explanation||''),errorTag:q.errorTag||q.concept||''});broadcast(room,'turn:answer');
      setTimeout(()=>{if(rooms.has(room.code)&&room.status==='battle')advanceTurn(room,false);},700);
      return;
    }
    // Score Duel: both players get the same question and the full timer independently. No speed advantage.
    if(room.mode==='score'){
      if(room.turnAnswers[p.token]?.submitted)return;
      const value=String(answer||'').trim();if(!value)return;const correct=isCorrect(q,value);p.answered=(p.answered||0)+1;if(!correct)p.lastMistake={questionIndex:room.questionIndex,concept:q.concept||'—',answer:value,correctAnswer:q.answer,explanation:q.explanation||q.feedback};room.turnAnswers[p.token]={submitted:true,correct,answer:value,timeout:false};if(correct){p.score+=100;p.correct+=1;room.combatEvent={token:p.token,target:room.players.find(x=>x.token!==p.token)?.token,damage:10,seq:Date.now(),kind:'hit'};}room.statusKey=correct?'SCORE_CORRECT':'SCORE_WRONG';room.statusName=p.name;socket.emit('answer:result',{correct,feedback:correct?'':String(q.feedback||q.explanation||''),errorTag:q.errorTag||q.concept||''});broadcast(room,'score:answer');
      if(room.turnAnswers[room.players[0].token]?.submitted&&room.turnAnswers[room.players[1].token]?.submitted)advanceScoreRound(room,false);
    }
  });
  socket.on('hint:use',(ack)=>{
    const respond=(result)=>{if(typeof ack==='function')ack(result)};
    const room=rooms.get(socket.data.roomCode);
    if(!room||room.status!=='battle')return respond({ok:false,code:'NOT_IN_BATTLE'});
    const player=findPlayer(room,socket);
    const question=room.questions[room.questionIndex];
    if(!player||!player.connected||!question)return respond({ok:false,code:'NOT_IN_BATTLE'});
    if(room.mode==='turn'&&player.token!==room.turnToken)return respond({ok:false,code:'NOT_YOUR_TURN'});
    if(room.turnAnswers?.[player.token]?.submitted)return respond({ok:false,code:'ANSWER_SUBMITTED'});
    const used=Math.max(0,Number(player.hintLevels?.[room.questionIndex])||0);
    const hints=Array.isArray(question.hints)?question.hints:[];
    if(used>=3||used>=hints.length)return respond({ok:false,code:'HINT_LIMIT'});
    const cost=[5,10,15][used]??15;
    if((Number(player.hp)||0)<=cost)return respond({ok:false,code:'HINT_HP'});
    player.hp-=cost;
    player.hintsUsed=(player.hintsUsed||0)+1;
    player.hintLevels=Array.isArray(player.hintLevels)?player.hintLevels:[];
    player.hintLevels[room.questionIndex]=used+1;
    respond({ok:true,hintsUsed:used+1,hp:player.hp,cost});
    broadcast(room);
  });
  socket.on('rematch',async()=>{const room=rooms.get(socket.data.roomCode);if(!room||room.players.length!==2)return;room.status='waiting';room.started=false;room.startedAt=null;room.questions=[];room.questionIndex=0;room.round=0;room.turnAnswers={};room.turnToken=null;room.turnStartedAt=null;room.winner=null;room.recorded=false;room.statusKey='REMATCH_READY';room.players.forEach(p=>{p.ready=!!p.isBot;p.hp=100;p.score=0;p.correct=0;p.answered=0;p.hintsUsed=0;p.hintLevels=[];p.lastMistake=null;});broadcast(room,'rematch:ready');});
  socket.on('room:leave',(ack)=>{leaveRoom(socket,true);ack?.({ok:true});});socket.on('disconnect',()=>leaveRoom(socket,false));
});
function leaveRoom(socket,explicit){const code=socket.data.roomCode;if(!code)return;const room=rooms.get(code);if(!room)return;const p=room.players.find(x=>x.id===socket.id);if(!p)return;if(explicit){if(room.isBot){clearTimer(room);rooms.delete(code);return;}if(room.status==='battle'){const winner=room.players.find(x=>x.token!==p.token)?.token;finishRoom(room,winner);}room.players=room.players.filter(x=>x.token!==p.token);if(room.players.length===0){clearTimer(room);rooms.delete(code);return;}if(room.status!=='finished'){room.players[0].ready=false;broadcast(room,'player:left');}else broadcast(room,'player:left');return;}p.connected=false;p.id='disconnected:'+p.token.slice(0,8);p.ready=false;room.statusKey='DISCONNECTED';broadcast(room,'player:disconnected');p.disconnectTimer=setTimeout(()=>{if(!rooms.has(code))return;const current=rooms.get(code);const idx=current.players.findIndex(x=>x.token===p.token);if(idx>=0)current.players.splice(idx,1);if(current.players.length===0){clearTimer(current);rooms.delete(code);}else{current.status='waiting';current.started=false;current.players[0].ready=false;current.statusKey='WAITING_PLAYER';broadcast(current,'player:left');}},ROOM_GRACE_MS);}
function lanAddresses(){const nets=os.networkInterfaces(),out=[];for(const name of Object.keys(nets))for(const net of nets[name]||[])if(net.family==='IPv4'&&!net.internal)out.push(net.address);return out;}
function sendSpa(req,res){return res.sendFile(path.join(FRONTEND_DIST,'index.html'));}
if(!process.env.VERCEL){
  app.get(['/','/index.html','/game.html'],sendSpa);
  app.get(/^(?!\/api(?:\/|$)).*/,sendSpa);
}
try{
  fs.mkdirSync(DATA_DIR,{recursive:true});
  fs.accessSync(DATA_DIR,fs.constants.W_OK);
}catch(error){
  console.error(`[Solvox] Data directory is not writable: ${DATA_DIR}. Set SOLVOX_DATA_DIR to a writable persistent directory.`);
  throw error;
}
module.exports=server;
