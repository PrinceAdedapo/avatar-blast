// scripts/convert-images.mjs
// Converts all JPEG/PNG in public/assets to WebP + AVIF
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';

const ROOT = 'public/assets';
const EXTENSIONS = new Set(['.jpeg', '.jpg', '.png']);

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(full));
    } else if (EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

async function convert(filePath) {
  const dir = dirname(filePath);
  const name = basename(filePath, extname(filePath));
  const webpOut = join(dir, `${name}.webp`);
  const avifOut = join(dir, `${name}.avif`);

  const img = sharp(filePath);
  const meta = await img.metadata();

  // Resize large images (backgrounds max 1080w, characters/effects max 512w)
  const isBackground = filePath.includes('backgrounds') || filePath.includes('victory') || filePath.includes('splash');
  const maxWidth = isBackground ? 1080 : 512;
  const needsResize = meta.width > maxWidth;

  const pipeline = needsResize ? sharp(filePath).resize(maxWidth, null, { withoutEnlargement: true }) : sharp(filePath);
  const buffer = await pipeline.toBuffer();

  // WebP (quality 78, good balance of size/quality)
  await sharp(buffer).webp({ quality: 78, effort: 6 }).toFile(webpOut);

  // AVIF (quality 55, slower but much smaller)
  await sharp(buffer).avif({ quality: 55, effort: 6 }).toFile(avifOut);

  const origSize = (await stat(filePath)).size;
  const webpSize = (await stat(webpOut)).size;
  const avifSize = (await stat(avifOut)).size;

  const webpSave = ((1 - webpSize / origSize) * 100).toFixed(0);
  const avifSave = ((1 - avifSize / origSize) * 100).toFixed(0);

  console.log(`✓ ${name} | orig: ${(origSize/1024).toFixed(0)}KB → webp: ${(webpSize/1024).toFixed(0)}KB (-${webpSave}%) | avif: ${(avifSize/1024).toFixed(0)}KB (-${avifSave}%)`);
}

async function main() {
  const files = await walk(ROOT);
  console.log(`Found ${files.length} images to convert...\n`);

  let totalOrig = 0, totalWebp = 0, totalAvif = 0;

  for (const f of files) {
    await convert(f);
    const origSize = (await stat(f)).size;
    const webpSize = (await stat(f.replace(extname(f), '.webp'))).size;
    const avifSize = (await stat(f.replace(extname(f), '.avif'))).size;
    totalOrig += origSize;
    totalWebp += webpSize;
    totalAvif += avifSize;
  }

  console.log(`\n=== TOTAL ===`);
  console.log(`Original: ${(totalOrig/1024/1024).toFixed(2)} MB`);
  console.log(`WebP:     ${(totalWebp/1024/1024).toFixed(2)} MB (-${((1-totalWebp/totalOrig)*100).toFixed(0)}%)`);
  console.log(`AVIF:     ${(totalAvif/1024/1024).toFixed(2)} MB (-${((1-totalAvif/totalOrig)*100).toFixed(0)}%)`);
}

main().catch(console.error);
