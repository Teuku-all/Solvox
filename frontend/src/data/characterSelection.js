import { PLAYER } from './player';
import { PLAYER_ASSETS } from './playerAssets';

const UI = '/assets/ui/character-select';
export const SELECTION_ART = Object.freeze({
  divider: `${UI}/divider/crystal-seam.webp`,
  header: `${UI}/nameplates/header-bar.webp`,
  banner: `${UI}/nameplates/banner-plate.webp`,
  crystal: `${UI}/icons/crystal-star.webp`,
  eye: `${UI}/icons/eye-preview.webp`,
  panel: `${UI}/panels/character-info.webp`,
  back: `${UI}/buttons/back.webp`,
});

// Presentation names are independent of the saved campaign / multiplayer IDs.
export const SELECTION_CHARACTERS = Object.freeze([
  {
    id: 'traveler', name: 'KAZURA', title: 'AZURE KNIGHT', emblem: 'sword',
    splash: '/assets/characters/kazura/splash/kazura-selection.webp',
    asset: PLAYER_ASSETS.traveler, stats: PLAYER.stats,
    role: { id: 'Ksatria', en: 'Knight' },
    lore: {
      id: 'Kazura adalah penjaga gerbang utara yang bersumpah memulihkan keseimbangan Solvox. Berbekal zirah biru dan pedang kristal warisan gurunya, ia menelusuri reruntuhan untuk memecahkan teka-teki kuno. Tenang dan pantang menyerah, ia percaya setiap persoalan selalu memiliki jalan keluar.',
      en: 'Kazura guards the northern gate and has sworn to restore balance to Solvox. With azure armor and his mentor’s crystal sword, he explores forgotten ruins and unravels ancient puzzles. Calm and determined, he believes every problem has a solution.',
    },
  },
  {
    id: 'asuka', name: 'ASUNA', title: 'ROYAL SPELLBLADE', emblem: 'crystal',
    splash: '/assets/characters/asuka/splash/asuna-selection.webp',
    asset: PLAYER_ASSETS.asuka, stats: PLAYER.stats,
    role: { id: 'Pendekar kristal', en: 'Crystal spellblade' },
    lore: {
      id: 'Asuna adalah pendekar istana yang menjaga rahasia kristal kerajaan. Ketika cahaya Solvox mulai meredup, ia meninggalkan menara untuk mencari sumber kekacauan. Cermat dan berani, Asuna membaca pola di balik setiap teka-teki sebelum mengangkat pedangnya demi melindungi mereka yang membutuhkan.',
      en: 'Asuna is a royal spellblade entrusted with the kingdom’s crystal secrets. When the light of Solvox begins to fade, she leaves her tower to seek the source of the chaos. Observant and brave, she finds patterns in every puzzle and draws her blade to protect those in need.',
    },
  },
]);

// Only mechanics implemented in Battle.jsx; registry-only skills are omitted.
export const SELECTION_ABILITIES = Object.freeze([
  { name: { id: 'Serangan', en: 'Attack' }, description: { id: 'Jawaban benar memicu serangan ke lawan.', en: 'A correct answer triggers an attack on your opponent.' } },
  { name: { id: 'Petunjuk', en: 'Hints' }, description: { id: 'Bantuan menjawab soal dengan biaya HP.', en: 'Help with a question at the cost of HP.' } },
]);
