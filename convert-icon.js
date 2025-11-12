const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'icon.png');
const outputPath = path.join(__dirname, 'public', 'icon.ico');

pngToIco(inputPath)
  .then(buf => {
    fs.writeFileSync(outputPath, buf);
    console.log('✓ Icon converted successfully: public/icon.ico');
  })
  .catch(err => {
    console.error('Error converting icon:', err);
    process.exit(1);
  });
