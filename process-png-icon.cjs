const sharp = require('sharp');
const path = require('path');

async function processPngIcon() {
  try {
    const inputPath = path.join(__dirname, 'public/logo/light-mode.png');
    const outputPath = path.join(__dirname, 'public/logo/light-mode-processed.png');

    // Get metadata to understand current dimensions
    const metadata = await sharp(inputPath).metadata();
    console.log('Input image metadata:', metadata.width, 'x', metadata.height);

    // Scale the original logo to 280x280 (smaller for less zoom effect)
    const scaledLogo = await sharp(inputPath)
      .resize(280, 280, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toBuffer();

    // Create a 512x512 white background and composite the scaled logo in the center
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 3,
        background: { r: 255, g: 255, b: 255 } // white background
      }
    })
      .composite([
        {
          input: scaledLogo,
          top: 116, // adjusted for better vertical centering
          left: 128 // adjusted for better horizontal centering
        }
      ])
      .png()
      .toFile(outputPath);

    console.log('✓ Icon processed successfully: ' + outputPath);
    console.log('✓ Output dimensions: 512x512');
  } catch (error) {
    console.error('Error processing icon:', error.message);
    process.exit(1);
  }
}

processPngIcon();
