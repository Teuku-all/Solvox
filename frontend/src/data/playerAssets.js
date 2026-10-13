/**
 * Player sprite registry. Single-player can swap characters without changing
 * the combat renderer. The legacy traveler ID belongs to Kazura and stays
 * stable for existing saves and multiplayer messages.
 */
const freezeSequence = (frames, step, impactFrame = null) =>
  Object.freeze({ frames: Object.freeze(frames), step, impactFrame });

const freezeSequences = (sequences) => Object.freeze(sequences);

const PLAYER_MIRRORS = Object.freeze({
  traveler: Object.freeze({
    base: '/assets/characters/kazura/mirror',
    sequences: freezeSequences({
      idle: freezeSequence(['idle_01.webp','idle_02.webp','idle_03.webp','idle_04.webp','idle_05.webp','idle_06.webp'], 150),
      attack: freezeSequence(['attack_01.webp','attack_02.webp','attack_03.webp','attack_04.webp','attack_05.webp','attack_06.webp','attack_07.webp'], 82, 5),
      hurt: freezeSequence(['hurt_01.webp','hurt_02.webp','hurt_03.webp','hurt_04.webp','hurt_05.webp'], 112),
      die: freezeSequence(['die_01.webp','die_02.webp','die_03.webp','die_04.webp','die_05.webp','die_06.webp'], 175),
    }),
  }),
  asuka: Object.freeze({
    base: '/assets/characters/asuka/mirror',
    sequenceFolders: Object.freeze({ idle: 'idle-asuka', attack: 'attack-asuka', hurt: 'hurt-asuka', die: 'die-asuka' }),
    sequences: freezeSequences({
      idle: freezeSequence(['idle-asuka_01.webp','idle-asuka_02.webp','idle-asuka_03.webp','idle-asuka_04.webp','idle-asuka_05.webp','idle-asuka_06.webp'], 150),
      attack: freezeSequence(['attack-asuka_01.webp','attack-asuka_02.webp','attack-asuka_03.webp','attack-asuka_04.webp','attack-asuka_05.webp','attack-asuka_06.webp','attack-asuka_07.webp','attack-asuka_08.webp','attack-asuka_09.webp','attack-asuka_10.webp','attack-asuka_11.webp','attack-asuka_12.webp'], 78, 8),
      hurt: freezeSequence(['hurt-asuka_01.webp','hurt-asuka_02.webp','hurt-asuka_03.webp','hurt-asuka_04.webp','hurt-asuka_05.webp','hurt-asuka_06.webp','hurt-asuka_07.webp','hurt-asuka_08.webp'], 105),
      die: freezeSequence(['die-asuka_01.webp','die-asuka_02.webp','die-asuka_03.webp','die-asuka_04.webp','die-asuka_05.webp'], 170),
    }),
  }),
});

export const PLAYER_ASSETS = Object.freeze({
  traveler: Object.freeze({
    id: 'traveler',
    nameId: 'characterTraveler',
    roleId: 'characterTravelerRole',
    base: '/assets/characters/kazura',
    mirror: PLAYER_MIRRORS.traveler,
    portrait: '/assets/characters/kazura/idle/01.png',
    selectionIdle: Object.freeze({
      folder: 'kazura-front',
      referenceSize: Object.freeze({ width: 313, height: 710 }),
      sequence: freezeSequence(['idle-kazura-01.webp','idle-kazura-02.webp','idle-kazura-03.webp','idle-kazura-04.webp','idle-kazura-05.webp','idle-kazura-06.webp'], 150),
    }),
    referenceSize: Object.freeze({ width: 160, height: 160 }),
    frameFocus: Object.freeze({ idle: 0.5, attack: 0.5, hurt: 0.5, die: 0.5 }),
    sequences: Object.freeze({
      idle: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png'], 150),
      attack: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png','07.png'], 82, 5),
      hurt: freezeSequence(['01.png','02.png','03.png','04.png','05.png'], 112),
      die: freezeSequence(['01.png','02.png','03.png','04.png','05.png','06.png'], 175),
    }),
  }),
  asuka: Object.freeze({
    id: 'asuka',
    nameId: 'characterAsuka',
    roleId: 'characterAsukaRole',
    base: '/assets/characters/asuka',
    mirror: PLAYER_MIRRORS.asuka,
    sequenceFolders: Object.freeze({ idle: 'idle-asuka', attack: 'attack-asuka', hurt: 'hurt-asuka', die: 'die-asuka' }),
    portrait: '/assets/characters/asuka/idle-asuka/idle-asuka_01.webp',
    selectionIdle: Object.freeze({
      folder: 'asuka-front',
      referenceSize: Object.freeze({ width: 310, height: 705 }),
      sequence: freezeSequence(['idle-asuka-01.webp','idle-asuka-02.webp','idle-asuka-03.webp','idle-asuka-04.webp','idle-asuka-05.webp','idle-asuka-06.webp'], 150),
    }),
    referenceSize: Object.freeze({ width: 343, height: 365 }),
    // The supplied attack canvas contains a long beam to the right. Focus the
    // renderer on Asuka's body so the effects can extend without shrinking the
    // fighter or pushing her out of the arena.
    frameFocus: Object.freeze({ idle: 0.5, attack: 0.30, hurt: 0.5, die: 0.5 }),
    sequences: Object.freeze({
      idle: freezeSequence(['idle-asuka_01.webp','idle-asuka_02.webp','idle-asuka_03.webp','idle-asuka_04.webp','idle-asuka_05.webp','idle-asuka_06.webp'], 150),
      attack: freezeSequence(['attack-asuka_01.webp','attack-asuka_02.webp','attack-asuka_03.webp','attack-asuka_04.webp','attack-asuka_05.webp','attack-asuka_06.webp','attack-asuka_07.webp','attack-asuka_08.webp','attack-asuka_09.webp','attack-asuka_10.webp','attack-asuka_11.webp','attack-asuka_12.webp'], 78, 8),
      hurt: freezeSequence(['hurt-asuka_01.webp','hurt-asuka_02.webp','hurt-asuka_03.webp','hurt-asuka_04.webp','hurt-asuka_05.webp','hurt-asuka_06.webp','hurt-asuka_07.webp','hurt-asuka_08.webp'], 105),
      die: freezeSequence(['die-asuka_01.webp','die-asuka_02.webp','die-asuka_03.webp','die-asuka_04.webp','die-asuka_05.webp'], 170),
    }),
  }),
});

export const ACTIVE_PLAYER_ID = 'traveler';

export function getPlayerAsset(playerId = ACTIVE_PLAYER_ID) {
  return PLAYER_ASSETS[playerId] || PLAYER_ASSETS[ACTIVE_PLAYER_ID];
}

export function resolvePlayerSequence(action = 'idle', playerId = ACTIVE_PLAYER_ID) {
  const asset = getPlayerAsset(playerId);
  if (asset.sequences[action]) return action;
  return 'idle';
}
