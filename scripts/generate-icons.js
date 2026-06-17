// Generates all PNG icons for the PWA from the SVG sources.
// Usage:  npm run gen:icons
//
// Renders ./icons/icon-source.svg into ./icons/icon-<size>.png for each size,
// plus ./icons/icon-512-maskable.png from icon-source-maskable.svg.
// Also writes ./apple-touch-icon.png (180) and ./favicon-32.png at the root.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ICONS_DIR = path.join(__dirname, '..', 'icons');
const ROOT_DIR = path.join(__dirname, '..');
const SOURCE = path.join(ICONS_DIR, 'icon-source.svg');
const MASKABLE_SOURCE = path.join(ICONS_DIR, 'icon-source-maskable.svg');

const SIZES = [48, 72, 96, 128, 144, 152, 167, 180, 192, 256, 384, 512];

async function renderTo(input, size, outFile) {
  await sharp(input, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outFile);
  console.log(`  ✓ ${path.relative(ROOT_DIR, outFile)}`);
}

(async () => {
  if (!fs.existsSync(SOURCE)) {
    console.error('Missing source SVG:', SOURCE);
    process.exit(1);
  }

  console.log('Generating standard icons...');
  for (const size of SIZES) {
    await renderTo(SOURCE, size, path.join(ICONS_DIR, `icon-${size}.png`));
  }

  console.log('Generating maskable icon (Android adaptive)...');
  await renderTo(MASKABLE_SOURCE, 512, path.join(ICONS_DIR, 'icon-512-maskable.png'));
  await renderTo(MASKABLE_SOURCE, 192, path.join(ICONS_DIR, 'icon-192-maskable.png'));

  console.log('Generating root assets (favicon + apple-touch-icon)...');
  await renderTo(SOURCE, 180, path.join(ROOT_DIR, 'apple-touch-icon.png'));
  await renderTo(SOURCE, 32, path.join(ROOT_DIR, 'favicon-32.png'));
  await renderTo(SOURCE, 16, path.join(ROOT_DIR, 'favicon-16.png'));

  console.log('Done.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
