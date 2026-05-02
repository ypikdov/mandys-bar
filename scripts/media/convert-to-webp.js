import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import webp from 'webp-converter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Grant permissions to the webp executable (needed in some environments)
webp.grant_permission();

const imageDir = path.join(__dirname, '../public/images/menu');
const menuFile = path.join(__dirname, '../src/data/menu.ts');

const convertImages = async () => {
  try {
    const files = fs.readdirSync(imageDir);
    let convertedCount = 0;

    for (const file of files) {
      if (file.toLowerCase().endsWith('.jpg') || file.toLowerCase().endsWith('.jpeg') || file.toLowerCase().endsWith('.png')) {
        const inputPath = path.join(imageDir, file);
        const outputFilename = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const outputPath = path.join(imageDir, outputFilename);

        console.log(`Converting ${file} to WebP...`);
        // q = 80 for good quality and small size
        await webp.cwebp(inputPath, outputPath, "-q 80");
        
        // Remove original to save space
        fs.unlinkSync(inputPath);
        convertedCount++;
      }
    }

    console.log(`Converted ${convertedCount} images to WebP.`);

    // Update menu.ts
    let menuContent = fs.readFileSync(menuFile, 'utf8');
    menuContent = menuContent.replace(/\.(jpg|jpeg|png)(")/ig, '.webp$2');
    fs.writeFileSync(menuFile, menuContent);
    console.log('Updated src/data/menu.ts references.');

  } catch (error) {
    console.error('Error during conversion:', error);
  }
};

convertImages();
