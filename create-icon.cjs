const fs = require('fs');
const path = require('path');

// Crear un archivo ICO básico de 256x256 con un icono simple
// Este es un ICO válido mínimo que NSIS puede usar
const createBasicIco = () => {
  // Header ICO (6 bytes)
  const header = Buffer.from([
    0x00, 0x00, // Reserved
    0x01, 0x00, // Type (1 = ICO)
    0x01, 0x00  // Number of images (1)
  ]);

  // Image directory entry (16 bytes)
  const dirEntry = Buffer.from([
    0x20,       // Width (32)
    0x20,       // Height (32)
    0x00,       // Color palette (0 = no palette)
    0x00,       // Reserved
    0x01, 0x00, // Color planes
    0x20, 0x00, // Bits per pixel (32)
    0x30, 0x04, 0x00, 0x00, // Size of image data (1072 bytes)
    0x16, 0x00, 0x00, 0x00  // Offset to image data (22 bytes)
  ]);

  // Bitmap info header (40 bytes)
  const bmpHeader = Buffer.from([
    0x28, 0x00, 0x00, 0x00, // Size of header (40)
    0x20, 0x00, 0x00, 0x00, // Width (32)
    0x40, 0x00, 0x00, 0x00, // Height (64 = 32*2 for ICO format)
    0x01, 0x00,             // Planes
    0x20, 0x00,             // Bits per pixel (32)
    0x00, 0x00, 0x00, 0x00, // Compression (none)
    0x00, 0x04, 0x00, 0x00, // Image size (1024)
    0x00, 0x00, 0x00, 0x00, // X pixels per meter
    0x00, 0x00, 0x00, 0x00, // Y pixels per meter
    0x00, 0x00, 0x00, 0x00, // Colors used
    0x00, 0x00, 0x00, 0x00  // Important colors
  ]);

  // Create a simple shield icon pattern (32x32 pixels, 4 bytes per pixel BGRA)
  const pixels = Buffer.alloc(32 * 32 * 4);

  // Draw a simple shield shape with blue color
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = ((31 - y) * 32 + x) * 4; // ICO format stores bottom-up

      // Simple shield shape logic
      const centerX = 16;
      const centerY = 16;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 12) {
        // Blue shield (#3B82F6)
        pixels[idx + 0] = 0xF6; // B
        pixels[idx + 1] = 0x82; // G
        pixels[idx + 2] = 0x3B; // R
        pixels[idx + 3] = 0xFF; // A
      } else {
        // Transparent
        pixels[idx + 0] = 0x00;
        pixels[idx + 1] = 0x00;
        pixels[idx + 2] = 0x00;
        pixels[idx + 3] = 0x00;
      }
    }
  }

  // AND mask (1 bit per pixel, rounded to 4-byte boundary)
  const andMask = Buffer.alloc(128); // 32 * 32 / 8 = 128 bytes
  andMask.fill(0x00); // All transparent

  // Combine all parts
  const ico = Buffer.concat([header, dirEntry, bmpHeader, pixels, andMask]);

  return ico;
};

const outputPath = path.join(__dirname, 'build', 'icon.ico');
const buildDir = path.join(__dirname, 'build');

// Create build directory if it doesn't exist
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Write the ICO file
const icoBuffer = createBasicIco();
fs.writeFileSync(outputPath, icoBuffer);

console.log('✓ Created valid ICO file: build/icon.ico');
