const fs = require('fs');
const path = require('path');
const PNG = require('pngjs').PNG;
const jpeg = require('jpeg-js');

function processPng(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(new PNG())
      .on('parsed', function () {
        // Strip white pixels
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const idx = (this.width * y + x) << 2;
            const r = this.data[idx];
            const g = this.data[idx + 1];
            const b = this.data[idx + 2];
            
            // Near-white thresholds
            if (r > 235 && g > 235 && b > 235) {
              this.data[idx + 3] = 0; // Alpha = 0
            }
          }
        }

        // Pack & write back in-place
        this.pack()
          .pipe(fs.createWriteStream(filePath))
          .on('finish', () => {
            console.log(`PNG background stripped successfully: ${path.basename(filePath)}`);
            resolve();
          })
          .on('error', reject);
      })
      .on('error', reject);
  });
}

function processJpegToPng(jpegPath, pngPath) {
  return new Promise((resolve, reject) => {
    try {
      const jpegData = fs.readFileSync(jpegPath);
      const rawImageData = jpeg.decode(jpegData, { useTns: true });
      
      const width = rawImageData.width;
      const height = rawImageData.height;
      const png = new PNG({ width, height });

      // Copy pixels and strip white background
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (width * y + x) << 2;
          const r = rawImageData.data[idx];
          const g = rawImageData.data[idx + 1];
          const b = rawImageData.data[idx + 2];
          
          png.data[idx] = r;
          png.data[idx + 1] = g;
          png.data[idx + 2] = b;

          // If the pixel is near-white, make it transparent
          if (r > 235 && g > 235 && b > 235) {
            png.data[idx + 3] = 0; // Transparent
          } else {
            png.data[idx + 3] = 255; // Opaque
          }
        }
      }

      png.pack()
        .pipe(fs.createWriteStream(pngPath))
        .on('finish', () => {
          console.log(`JPEG converted and background stripped: ${path.basename(jpegPath)} -> ${path.basename(pngPath)}`);
          resolve();
        })
        .on('error', reject);
    } catch (err) {
      reject(err);
    }
  });
}

async function run() {
  const rosePath = path.join(__dirname, 'public', 'decor', 'falling-rose.png');
  const bouquetPath = path.join(__dirname, 'public', 'decor', 'bouquet-icon.png');

  try {
    if (fs.existsSync(rosePath)) {
      await processPng(rosePath);
    }

    if (fs.existsSync(bouquetPath)) {
      // Decode JPEG and write it as a transparent PNG file
      await processJpegToPng(bouquetPath, bouquetPath);
    }
    
    console.log('Background transparency processing completed successfully!');
  } catch (error) {
    console.error('Error processing background transparency:', error);
  }
}

run();
