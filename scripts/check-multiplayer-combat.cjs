const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const rectangle = (left, width) => ({ left, right: left + width, width });
const stage = (player, opponent) => ({
  querySelector(selector) {
    return {
      getBoundingClientRect: () => selector.includes('.fighter-player') ? player : opponent,
    };
  },
});

(async () => {
  const { getContactLungeDistance, attackTravelAtImpact } = await import(
    pathToFileURL(path.join(__dirname, '../frontend/src/components/battle/combatMotion.js')).href
  );

  const desktop = stage(rectangle(96, 278), rectangle(870, 310));
  const phone = stage(rectangle(12, 110), rectangle(230, 120));
  assert.equal(getContactLungeDistance(desktop, 'player'), 637);
  assert.equal(getContactLungeDistance(desktop, 'opponent'), 637);
  assert.equal(getContactLungeDistance(phone, 'player'), 163);
  assert.equal(getContactLungeDistance(phone, 'opponent'), 163);
  assert.ok(getContactLungeDistance(stage(rectangle(0, 0), rectangle(0, 0))) > 0);

  for (const impact of [0.55, 0.7, 0.83]) {
    assert.equal(attackTravelAtImpact(0, impact), 0);
    assert.equal(attackTravelAtImpact(impact, impact), 1);
    assert.ok(Math.abs(attackTravelAtImpact(1, impact)) < 1e-10);
    assert.ok(attackTravelAtImpact(impact - 0.01, impact) > 0.99);
    assert.ok(attackTravelAtImpact(impact + 0.01, impact) > 0.99);
  }

  console.log('PASS multiplayer lunge reaches both fighters at impact on desktop and mobile');
})().catch((error) => { console.error(error); process.exitCode = 1; });
