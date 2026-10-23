import manifest from '../data/optimizedAssets.json';

export function optimizedAsset(src) {
  return manifest.assets[decodeURI(src)]?.src || src;
}

export function responsiveAsset(src, sizes) {
  const asset = manifest.assets[decodeURI(src)];
  return asset ? { ...asset, sizes, decoding: 'async' } : { src, decoding: 'async' };
}

export function selectionFrameAnchor(src) {
  return manifest.anchors[src];
}
