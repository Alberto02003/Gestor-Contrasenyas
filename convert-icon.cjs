const sharp = require('sharp');
const toIco = require('to-ico');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'icon.png');
const outputPath = path.join(__dirname, 'build', 'icon.ico');

// Ensure build directory exists
const buildDir = path.join(__dirname, 'build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

async function convertIcon() {
  try {
    // Generate multiple sized PNGs
    const sizes = [16, 24, 32, 48, 64, 128, 256];
    const pngBuffers = await Promise.all(
      sizes.map(size =>
        sharp(inputPath)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer()
      )
    );

    // Convert to ICO
    const icoBuffer = await toIco(pngBuffers);
    fs.writeFileSync(outputPath, icoBuffer);

    console.log('✓ Icon converted successfully: build/icon.ico');
    console.log('✓ Icon includes sizes: 16, 24, 32, 48, 64, 128, 256');
  } catch (err) {
    console.error('Error converting icon:', err);
    process.exit(1);
  }
}

convertIcon();
