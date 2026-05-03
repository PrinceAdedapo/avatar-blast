// scripts/generate-splash.mjs
// Generate native Android splash screen at all DPI densities
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join } from 'path';

const INPUT = 'C:\\Users\\USER\\Downloads\\A_premium,_ultra-minimalist_3D_brand_202604292223.jpeg';
const RES_DIR = 'android/app/src/main/res';

// Android splash densities (portrait)
const PORTRAIT_SIZES = [
  { folder: 'drawable-port-mdpi', w: 320, h: 480 },
  { folder: 'drawable-port-hdpi', w: 480, h: 800 },
  { folder: 'drawable-port-xhdpi', w: 720, h: 1280 },
  { folder: 'drawable-port-xxhdpi', w: 1080, h: 1920 },
  { folder: 'drawable-port-xxxhdpi', w: 1440, h: 2560 },
];

// Landscape sizes
const LANDSCAPE_SIZES = [
  { folder: 'drawable-land-mdpi', w: 480, h: 320 },
  { folder: 'drawable-land-hdpi', w: 800, h: 480 },
  { folder: 'drawable-land-xhdpi', w: 1280, h: 720 },
  { folder: 'drawable-land-xxhdpi', w: 1920, h: 1080 },
  { folder: 'drawable-land-xxxhdpi', w: 2560, h: 1440 },
];

// Also the default drawable
const DEFAULT = { folder: 'drawable', w: 1080, h: 1920 };

async function generate(input, { folder, w, h }) {
  const outDir = join(RES_DIR, folder);
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, 'splash.png');

  await sharp(input)
    .resize(w, h, {
      fit: 'cover',
      position: 'centre',
    })
    .png({ quality: 90 })
    .toFile(outPath);

  console.log(`✓ ${folder}/splash.png (${w}x${h})`);
}

async function main() {
  console.log('Generating native splash screens...\n');

  // Default
  await generate(INPUT, DEFAULT);

  // Portrait
  for (const size of PORTRAIT_SIZES) {
    await generate(INPUT, size);
  }

  // Landscape
  for (const size of LANDSCAPE_SIZES) {
    await generate(INPUT, size);
  }

  console.log('\n✅ All splash screens generated!');
}

main().catch(console.error);
