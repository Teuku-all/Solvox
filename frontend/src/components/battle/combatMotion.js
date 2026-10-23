const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Measure the rendered fighters so the same lunge reaches its target on phones
// and wide screens, regardless of whether either character is a player or boss.
export function getContactLungeDistance(stage, attackerSide = 'player') {
  const fallback = clamp((globalThis.innerWidth || 1280) * 0.3, 80, 420);
  const player = stage?.querySelector('.fighter-player .sprite-wrap, .fighter-player .asset-boss-sprite');
  const opponent = stage?.querySelector('.fighter-boss .sprite-wrap, .fighter-boss .asset-boss-sprite');
  if (!player || !opponent) return fallback;

  const playerRect = player.getBoundingClientRect();
  const opponentRect = opponent.getBoundingClientRect();
  if (!playerRect.width || !opponentRect.width) return fallback;
  const playerCenter = (playerRect.left + playerRect.right) / 2;
  const opponentCenter = (opponentRect.left + opponentRect.right) / 2;
  const attackerCenter = attackerSide === 'player' ? playerCenter : opponentCenter;
  const targetCenter = attackerSide === 'player' ? opponentCenter : playerCenter;
  const direction = attackerSide === 'player' ? 1 : -1;
  const forwardDistance = Math.max(0, (targetCenter - attackerCenter) * direction);
  const contactSpacing = Math.min(playerRect.width, opponentRect.width) * 0.55;
  return Math.max(48, Math.round(forwardDistance - contactSpacing));
}

// Arrival and retreat both have zero velocity at contact, avoiding the snap
// produced by a linear return just as the target reacts to the hit.
export function attackTravelAtImpact(progress, impactProgress) {
  const p = clamp(progress, 0, 1);
  const peak = clamp(impactProgress, 0.45, 0.88);
  if (p <= peak) return (1 - Math.cos(Math.PI * p / peak)) / 2;
  return (1 + Math.cos(Math.PI * (p - peak) / (1 - peak))) / 2;
}
