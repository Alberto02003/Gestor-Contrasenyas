const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputPath = path.join(__dirname, 'public', 'icon.png');
const outputDir = path.join(__dirname, 'build');
const icnsPath = path.join(outputDir, 'icon.icns');
const iconsetDir = path.join(outputDir, 'icon.iconset');

// Ensure directories exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(iconsetDir)) {
  fs.mkdirSync(iconsetDir, { recursive: true });
}

async function createMacIcon() {
  try {
    console.log('🍎 Creating macOS icon (ICNS format)...');

    // macOS icon sizes required
    const sizes = [
      { size: 16, name: 'icon_16x16.png' },
      { size: 32, name: 'icon_16x16@2x.png' },
      { size: 32, name: 'icon_32x32.png' },
      { size: 64, name: 'icon_32x32@2x.png' },
      { size: 128, name: 'icon_128x128.png' },
      { size: 256, name: 'icon_128x128@2x.png' },
      { size: 256, name: 'icon_256x256.png' },
      { size: 512, name: 'icon_256x256@2x.png' },
      { size: 512, name: 'icon_512x512.png' },
      { size: 1024, name: 'icon_512x512@2x.png' },
    ];

    // Generate all required sizes
    console.log('📐 Generating icon sizes for macOS...');
    for (const { size, name } of sizes) {
      const outputPath = path.join(iconsetDir, name);
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      console.log(`  ✓ Created ${name} (${size}x${size})`);
    }

    // Check if we're on macOS to use iconutil
    const isMac = process.platform === 'darwin';

    if (isMac) {
      console.log('🔨 Converting to ICNS using iconutil...');
      execSync(`iconutil -c icns "${iconsetDir}" -o "${icnsPath}"`);
      console.log('✓ Created icon.icns using iconutil');

      // Clean up iconset directory
      fs.rmSync(iconsetDir, { recursive: true, force: true });
    } else {
      console.log('⚠️  Not on macOS - iconset created but ICNS conversion requires macOS');
      console.log('ℹ️  The iconset directory will be used during build on macOS');
      console.log('ℹ️  Or you can convert manually on a Mac with:');
      console.log(`    iconutil -c icns "build/icon.iconset" -o "build/icon.icns"`);
    }

    console.log('✅ macOS icon preparation complete!');

  } catch (err) {
    console.error('❌ Error creating macOS icon:', err);
    process.exit(1);
  }
}

createMacIcon();
