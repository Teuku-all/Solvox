import { loadAssetImage } from './assetImageCache';
import { responsiveAsset } from './optimizedAssets';
import { SELECTION_CHARACTERS, SELECTION_ART } from '../data/characterSelection';
import { CHARACTER_SELECT_BACKGROUND } from '../config/backgrounds';

const warmedArtwork = new Map();

export function warmSelectionScreen() {
  if (navigator.connection?.saveData || /(^|-)2g/.test(navigator.connection?.effectiveType || '')) return;
  const portrait = window.matchMedia('(max-width: 1050px) and (orientation: portrait)').matches;
  const background = portrait ? CHARACTER_SELECT_BACKGROUND.mobile : CHARACTER_SELECT_BACKGROUND.desktop;
  const artwork = [
    [background, '100vw'],
    ...SELECTION_CHARACTERS.map((character) => [character.splash, '(max-width: 800px) 71vw, 60vw']),
    [SELECTION_ART.banner], [SELECTION_ART.back], [SELECTION_ART.eye],
  ];
  for (const [src, sizes] of artwork) {
    if (warmedArtwork.has(src)) continue;
    const image = new Image();
    const asset = responsiveAsset(src, sizes);
    image.decoding = 'async';
    image.fetchPriority = 'low';
    if (sizes) { image.sizes = sizes; image.srcset = asset.srcSet || ''; }
    image.src = asset.src;
    warmedArtwork.set(src, image);
  }
}

export function selectionFrameSources(asset) {
  const sequence = asset.selectionIdle?.sequence || asset.sequences.idle;
  const folder = asset.selectionIdle?.folder || asset.sequenceFolders?.idle || 'idle';
  return sequence.frames.map((name) => `${asset.base}/${folder}/${name}`);
}

export function warmSelectionCharacter(asset) {
  return loadAssetImage(selectionFrameSources(asset)[0], { fetchPriority: 'high' }).catch(() => null);
}
