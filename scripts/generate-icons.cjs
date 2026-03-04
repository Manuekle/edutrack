const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [
  { name: 'icon-72x72.png', size: 72 },
  { name: 'icon-96x96.png', size: 96 },
  { name: 'icon-128x128.png', size: 128 },
  { name: 'icon-144x144.png', size: 144 },
  { name: 'icon-152x152.png', size: 152 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-384x384.png', size: 384 },
  { name: 'icon-512x512.png', size: 512 },
];

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const svgPath = path.join(iconsDir, 'icon.svg');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const { name, size } of sizes) {
    await sharp(svgBuffer).resize(size, size).png().toFile(path.join(iconsDir, name));
    console.log(`Generated ${name}`);
  }

  // Also generate apple-touch-icon.png (180x180 for iOS)
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Generate mstile for Windows (144x144)
  await sharp(svgBuffer).resize(144, 144).png().toFile(path.join(iconsDir, 'mstile-144x144.png'));
  console.log('Generated mstile-144x144.png');

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
