const imagePromises = new Map();

export function loadAssetImage(src, { fetchPriority = 'auto' } = {}) {
  const cached = imagePromises.get(src);
  if (cached) return cached;

  const image = new Image();
  image.decoding = 'async';
  if ('fetchPriority' in image) image.fetchPriority = fetchPriority;

  const promise = new Promise((resolve, reject) => {
    image.onload = async () => {
      // Decode once before a canvas needs the frame; shared promises also dedupe previews.
      try { await image.decode?.(); } catch { /* A loaded image can still be drawn. */ }
      resolve(image);
    };
    image.onerror = () => reject(new Error(src));
    image.src = src;
  }).catch((error) => {
    if (imagePromises.get(src) === promise) imagePromises.delete(src);
    throw error;
  });

  imagePromises.set(src, promise);
  return promise;
}
