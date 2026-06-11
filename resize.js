const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const images = [
  "DSC05568.JPG", "DSC05571.JPG", "DSC05598.JPG",
  "DSC05616.JPG", "DSC05624.JPG", "DSC05641.JPG",
  "DSC05644.JPG", "DSC05654.JPG", "DSC05659.JPG",
  "DSC05692.JPG", "DSC05699.JPG", "DSC05763.JPG",
  "DSC05791.JPG", "DSC05806.JPG", "DSC05809.JPG"
];

const baseDir = path.join(__dirname, 'public', 'sponsors', 'SPORNS');

async function processImages() {
  for (const imgName of images) {
    const imgPath = path.join(baseDir, imgName);
    const optPath = path.join(baseDir, `opt_${imgName}`);
    if (fs.existsSync(imgPath)) {
      try {
        await sharp(imgPath)
          .resize({ width: 1920, withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true })
          .toFile(optPath);
        console.log(`Optimized ${imgName}`);
      } catch (e) {
        console.error(`Error optimizing ${imgName}:`, e);
      }
    }
  }
}

processImages();
