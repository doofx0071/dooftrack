const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconDir = path.join(__dirname, 'public', 'icons');
const svgPath = path.join(__dirname, 'public', 'logo', 'light-mode.svg');

// Ensure icons directory exists
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Generate icons
(async () => {
  try {
    console.log('Generating PWA icons from light-mode.svg...');

    // Read SVG file
    const svgBuffer = fs.readFileSync(svgPath);

    // Standard icons (no padding)
    console.log('Creating icon-192.png...');
    await sharp(svgBuffer)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(iconDir, 'icon-192.png'));

    console.log('Creating icon-512.png...');
    await sharp(svgBuffer)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .png()
      .toFile(path.join(iconDir, 'icon-512.png'));

    // Maskable icons (with 20% padding = safe zone)
    // 192×192 with padding → actual icon is ~154×154
    console.log('Creating icon-192-maskable.png...');
    await sharp(svgBuffer)
      .resize(154, 154, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 19,
        bottom: 19,
        left: 19,
        right: 19,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(iconDir, 'icon-192-maskable.png'));

    // 512×512 with padding → actual icon is ~410×410
    console.log('Creating icon-512-maskable.png...');
    await sharp(svgBuffer)
      .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: 51,
        bottom: 51,
        left: 51,
        right: 51,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(path.join(iconDir, 'icon-512-maskable.png'));

    console.log('✅ All icons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
})();
