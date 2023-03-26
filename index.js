#!/usr/bin/env node

const sharp = require('sharp');
const yargs = require('yargs');
const fs = require('fs');
const path = require('path');

const options = yargs
 .usage('Usage: -i <input> -w <width> -h <height> -q <quality> -c <crop> -o <output> -s <sizes>')
 .option('i', { alias: 'input', describe: 'Input image file path', type: 'string', demandOption: true })
 .option('w', { alias: 'width', describe: 'Width for resizing', type: 'number', demandOption: false })
 .option('s', { alias: 'sizes', describe: 'list of size (format: size-1x, size-2x)', type: 'string', demandOption: true })
 .option('h', { alias: 'height', describe: 'Height for resizing', type: 'number', demandOption: false })
 .option('q', { alias: 'quality', describe: 'Quality for the output image (1-100)', type: 'number', demandOption: false, default: 75 })
 .option('c', { alias: 'crop', describe: 'Crop to aspect ratio (format: W:H)', type: 'string', demandOption: false })
 .option('o', { alias: 'output', describe: 'Output image file path', type: 'string', demandOption: false })
 .argv;

(async () => {
  const { input, width, height, quality, crop, output, sizes } = options;

  if (!fs.existsSync(input)) {
    console.error('Input file does not exist.');
    return;
  }

  const ext = path.extname(input);
  if (ext !== '.jpg' && ext !== '.jpeg' && ext !== '.png') {
    console.error('Invalid input file format. Only JPG and PNG files are supported.');
    return;
  }

  const outputFile = output || `${path.basename(input, ext)}.webp`;

  try {
    let image = sharp(input);

    if (sizes) {
      sizes.split(',')
        .forEach(size => {
          const width = parseInt(size.trim(), 10),
            ext = path.extname(outputFile);
          if (!Number.isNaN(width)) {
            image.resize({
              width,
            }).webp({
              quality
            }).toFile(outputFile.replace(ext, `_${size}${ext}`));
          }
        })
    } else {
      // ToDo: combine if and else by considering width as single instance of size
      if (width || height) {
        image = image.resize({
          width: width || null,
          height: height || null,
          fit: 'inside',
          withoutEnlargement: true,
        });
      }
  
      if (crop) {
        const [cropWidth, cropHeight] = crop.split(':').map(Number);
        if (cropWidth && cropHeight) {
          image = image.resize({
            width: cropWidth,
            height: cropHeight,
            fit: 'cover',
          });
        } else {
          console.error('Invalid crop aspect ratio. Please provide in the format W:H');
          return;
        }
      }
  
      await image
        .webp({ quality: quality })
        .toFile(outputFile);
    }


    console.log(`Image has been converted and saved as ${outputFile}`);
  } catch (error) {
    console.error('Error processing the image:', error.message);
  }
})();
