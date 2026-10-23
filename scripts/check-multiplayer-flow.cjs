const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const { io } = require('socket.io-client');

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'solvox-multiplayer-qa-'));
process.env.SOLVOX_DATA_DIR = dataDir;
const server = require('../backend/server');
const questions = require('../backend/solvoxQuestions.json');

function waitFor(socket, event, predicate = () => true, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off(event, receive); reject(new Error(`Timed out waiting for ${event}`)); }, timeoutMs);
    function receive(payload) {
      if (!predicate(payload)) return;
      clearTimeout(timer);
      socket.off(event, receive);
      resolve(payload);
    }
    socket.on(event, receive);
  });
}

async function checkMatch(url, levelId, mode) {
  const host = io(url, { transports: ['websocket'], reconnection: false });
  const guest = io(url, { transports: ['websocket'], reconnection: false });
  try {
    await Promise.all([waitFor(host, 'connect'), waitFor(guest, 'connect')]);
    const created = waitFor(host, 'room:created');
    host.emit('room:create', { name: 'Player 1', levelId, mode });
    const room = await created;
    const joined = waitFor(host, 'room:update', value => value.players.length === 2);
    guest.emit('room:join', { code: room.code, name: 'Player 2' });
    await joined;
    host.emit('player:ready');
    const started = waitFor(host, 'game:start');
    guest.emit('player:ready');
    const battle = await started;
    assert.equal(battle.questionIndex, 0);
    assert.equal(battle.players.length, 2);
    const question = questions.find(item => item.id === battle.question.id);
    assert.ok(question, `Chapter ${levelId}: multiplayer question absent from question bank`);
    const answer = Array.isArray(question.answer) ? question.answer[0] : question.answer;
    const attacks = [];
    host.on('turn:answer', value => { if (value.combatEvent) attacks.push(value.combatEvent.seq); });
    host.on('round:resolved', value => { if (value.combatEvent) attacks.push(value.combatEvent.seq); });
    const firstResult = waitFor(host, 'answer:result');
    host.emit('answer:submit', { answer });
    assert.equal((await firstResult).correct, true, `Chapter ${levelId} ${mode}: correct answer rejected`);
    if (mode === 'turn') {
      const guestTurn = await waitFor(guest, 'turn:next');
      assert.equal(guestTurn.currentTurnPlayerId, guest.id);
    }
    const secondResult = waitFor(guest, 'answer:result');
    const resolved = mode === 'turn'
      ? waitFor(host, 'round:resolved')
      : waitFor(host, 'round:next');
    guest.emit('answer:submit', { answer: '__WRONG_ANSWER__' });
    assert.equal((await secondResult).correct, false);
    const final = await resolved;
    const first = final.players.find(player => player.name === 'Player 1');
    const second = final.players.find(player => player.name === 'Player 2');
    assert.equal(first.answered, 1);
    assert.equal(first.correct, 1);
    assert.equal(second.answered, 1);
    assert.equal(second.correct, 0);
    assert.equal(first.score, mode === 'score' ? 100 : 1, `Chapter ${levelId} ${mode}: score counted incorrectly`);
    assert.equal(second.score, 0);
    if (mode === 'turn') {
      assert.equal(first.hp, 100);
      assert.equal(second.hp, 80);
      assert.equal(new Set(attacks).size, 1, `Chapter ${levelId}: duplicate attack animation`);
      assert.equal(attacks.length, 1, 'A correct answer should trigger one attack');
    } else {
      assert.equal(final.questionIndex, 1, 'Score duel did not advance to next question');
    }
    console.log(`PASS Chapter ${levelId} multiplayer ${mode}`);
  } finally {
    if (guest.connected) await new Promise(resolve => guest.emit('room:leave', resolve));
    if (host.connected) await new Promise(resolve => host.emit('room:leave', resolve));
    host.disconnect();
    guest.disconnect();
  }
}

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    for (let levelId = 1; levelId <= 5; levelId += 1) {
      await checkMatch(url, levelId, 'turn');
      await checkMatch(url, levelId, 'score');
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    assert.equal(path.dirname(fs.realpathSync(dataDir)), path.resolve(os.tmpdir()));
    assert.match(path.basename(dataDir), /^solvox-multiplayer-qa-/);
    fs.rmSync(dataDir, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
