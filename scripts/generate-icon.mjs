// scripts/generate-icon.mjs
// Generate Android adaptive icon from the Avatar Blast logo
import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const INPUT = 'C:\\Users\\USER\\Downloads\\mobile icon.jpeg';
const RES_DIR = 'android/app/src/main/res';

// The image has extra dark background around the icon - we need to crop to the icon area
// then generate foreground (with padding for adaptive icon safe zone)

// Android adaptive icons: 108dp x 108dp, with 72dp visible (inner 66%)
// Mipmap sizes (foreground layer)
const ICON_SIZES = [
  { folder: 'mipmap-mdpi', size: 108 },
  { folder: 'mipmap-hdpi', size: 162 },
  { folder: 'mipmap-xhdpi', size: 216 },
  { folder: 'mipmap-xxhdpi', size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

// Legacy icon sizes (square with rounded corners baked in by launcher)
const LEGACY_SIZES = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

async function main() {
  console.log('Generating app icons...\n');

  // First, crop the input to just the icon area (the rounded square part)
  const meta = await sharp(INPUT).metadata();
  // The icon is centered - crop to square from center
  const cropSize = Math.min(meta.width, meta.height);
  const left = Math.floor((meta.width - cropSize) / 2);
  const top = Math.floor((meta.height - cropSize) / 2);

  const croppedBuffer = await sharp(INPUT)
    .extract({ left, top, width: cropSize, height: cropSize })
    .toBuffer();

  // Generate adaptive icon foreground (with 18% padding on each side for safe zone)
  for (const { folder, size } of ICON_SIZES) {
    const outDir = join(RES_DIR, folder);
    await mkdir(outDir, { recursive: true });

    // Foreground: icon with padding for adaptive safe zone
    const iconInner = Math.round(size * 0.72); // 72% of total is the visible area
    const padding = Math.round((size - iconInner) / 2);

    const innerBuf = await sharp(croppedBuffer)
      .resize(iconInner, iconInner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
      .composite([{ input: innerBuf, left: padding, top: padding }])
      .png()
      .toFile(join(outDir, 'ic_launcher_foreground.png'));

    console.log(`✓ ${folder}/ic_launcher_foreground.png (${size}x${size})`);
  }

  // Generate legacy icons (ic_launcher.png and ic_launcher_round.png)
  for (const { folder, size } of LEGACY_SIZES) {
    const outDir = join(RES_DIR, folder);
    await mkdir(outDir, { recursive: true });

    // Square icon
    await sharp(croppedBuffer)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(join(outDir, 'ic_launcher.png'));

    // Round icon (same image, launcher will mask it)
    await sharp(croppedBuffer)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(join(outDir, 'ic_launcher_round.png'));

    console.log(`✓ ${folder}/ic_launcher.png + ic_launcher_round.png (${size}x${size})`);
  }

  // Generate Play Store high-res icon (512x512)
  await sharp(croppedBuffer)
    .resize(512, 512, { fit: 'cover' })
    .png()
    .toFile('android/app/src/main/ic_launcher-playstore.png');
  console.log(`✓ ic_launcher-playstore.png (512x512)`);

  // Update adaptive icon background to solid dark
  const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="#0d1b2a"/>
</shape>`;
  await writeFile(join(RES_DIR, 'drawable/ic_launcher_background.xml'), bgXml);
  console.log(`✓ drawable/ic_launcher_background.xml (dark navy solid)`);

  console.log('\n✅ All app icons generated!');
}

main().catch(console.error);
