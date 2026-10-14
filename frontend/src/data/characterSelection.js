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
      id: 'Seorang ksatria berbaju zirah biru dengan pedang kristal. Kisah perjalanannya di dunia SolvoX masih menunggu untuk ditulis.',
      en: 'A knight in azure armor, carrying a crystal sword. His journey through the world of SolvoX is yet to be written.',
    },
  },
  {
    id: 'asuka', name: 'ASUNA', title: 'ROYAL SPELLBLADE', emblem: 'crystal',
    splash: '/assets/characters/asuka/splash/asuna-selection.webp',
    asset: PLAYER_ASSETS.asuka, stats: PLAYER.stats,
    role: { id: 'Pendekar kristal', en: 'Crystal spellblade' },
    lore: {
      id: 'Seorang pendekar dengan ornamen kristal dan busana kerajaan. Asal-usul serta perannya dalam petualangan SolvoX masih menunggu untuk ditulis.',
      en: 'A spellblade adorned with crystals and royal attire. Her origins and role in the SolvoX adventure are yet to be written.',
    },
  },
]);

// Only mechanics implemented in Battle.jsx; registry-only skills are omitted.
export const SELECTION_ABILITIES = Object.freeze([
  { name: { id: 'Serangan', en: 'Attack' }, description: { id: 'Jawaban benar memicu serangan ke lawan.', en: 'A correct answer triggers an attack on your opponent.' } },
  { name: { id: 'Petunjuk', en: 'Hints' }, description: { id: 'Bantuan menjawab soal dengan biaya HP.', en: 'Help with a question at the cost of HP.' } },
]);
