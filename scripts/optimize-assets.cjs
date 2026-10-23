const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');

const root = path.resolve(__dirname, '../frontend');
const publicDir = path.join(root, 'public');
const outputDir = path.join(publicDir, 'assets/optimized');
const sources = [
  ['characters/kazura/splash/kazura-selection.webp', [540, 1080]],
  ['characters/asuka/splash/asuna-selection.webp', [540, 1080]],
  ['backgrounds/character select/character-select-bg-desktop.webp', [960, 1920]],
  ['backgrounds/character select/character-select-bg-mobile.webp', [540, 1080]],
  ['home/home-background-v83-poster.jpg', [960, 1920]],
  ['home/home-background-cinematic-poster.jpg', [960, 1920]],
  ['ui/brand/solvox-logo-v89.png', [480]],
  ['ui/modes/single-mode-v94.webp', [480, 960]],
  ['ui/modes/multi-mode-v94.webp', [480, 960]],
];

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  // Include decorative selection art without changing the supplied originals.
  for (const folder of ['buttons', 'divider', 'icons', 'nameplates', 'panels']) {
    const dir = `ui/character-select/${folder}`;
    for (const name of await fs.readdir(path.join(publicDir, 'assets', dir))) {
      if (/\.webp$/i.test(name)) sources.push([`${dir}/${name}`, [1080]]);
    }
  }
  const assets = {};
  let before = 0;
  let after = 0;
  for (const [source, widths] of sources) {
    const input = await fs.readFile(path.join(publicDir, 'assets', source));
    const meta = await sharp(input).metadata();
    const variants = [];
    for (const targetWidth of widths) {
      const width = Math.min(meta.width, targetWidth);
      if (variants.some((item) => item.width === width)) continue;
      const options = { width, quality: 82, effort: 5 };
      const hash = crypto.createHash('sha256').update(input).update(JSON.stringify(options)).digest('hex').slice(0, 12);
      const name = `${path.parse(source).name}-${width}-${hash}.webp`;
      const output = path.join(outputDir, name);
      try { await fs.access(output); } catch {
        await sharp(input).resize({ width, withoutEnlargement: true }).webp(options).toFile(output);
      }
      variants.push({ src: `/assets/optimized/${name}`, width });
    }
    const largest = variants[variants.length - 1];
    assets[`/assets/${source}`] = { src: largest.src, srcSet: variants.map((v) => `${v.src} ${v.width}w`).join(', '), width: largest.width, height: Math.round(meta.height * largest.width / meta.width) };
    before += input.length;
    after += (await fs.stat(path.join(publicDir, largest.src))).size;
  }

  // Foot anchors are computed once at build time, instead of scanning RGBA on every visit.
  const anchors = {};
  for (const [character, folder] of [['kazura', 'kazura-front'], ['asuka', 'asuka-front']]) {
    for (const name of await fs.readdir(path.join(publicDir, 'assets/characters', character, folder))) {
      if (!/\.webp$/.test(name)) continue;
      const src = `/assets/characters/${character}/${folder}/${name}`;
      const { data, info } = await sharp(path.join(publicDir, src)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      let bottom = 0;
      for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 32) bottom = y + 1;
      }
      let left = info.width;
      let right = 0;
      for (let y = Math.max(0, bottom - Math.ceil(info.height * .07)); y < bottom; y++) for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 32) { left = Math.min(left, x); right = Math.max(right, x); }
      }
      anchors[src] = { footX: left <= right ? (left + right) / 2 : info.width / 2, bottom: bottom || info.height };
    }
  }
  await fs.writeFile(path.join(root, 'src/data/optimizedAssets.json'), `${JSON.stringify({ assets, anchors }, null, 2)}\n`);
  console.log(`Optimized ${sources.length} images: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB (largest variants).`);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
