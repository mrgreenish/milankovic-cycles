/**
 * This is a guide for generating the apple-icon.png for your website
 * 
 * You can use the following steps:
 * 
 * 1. Install Sharp if you don't have it:
 *    npm install sharp
 * 
 * 2. Run this script:
 *    node scripts/generate-apple-icon.js
 * 
 * 3. This will create an apple-icon.png in your public directory
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Path to the source image
const sourcePath = path.join(__dirname, '../public/miltin-milankovic.png');
// Path for the output
const outputPath = path.join(__dirname, '../public/apple-icon.png');

// Ensure the scripts directory exists
if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

// Generate the apple icon (180x180 px is recommended for Apple)
sharp(sourcePath)
  .resize(180, 180)
  .toFile(outputPath)
  .then(() => {
    console.log('Apple icon generated successfully!');
  })
  .catch(err => {
    console.error('Error generating Apple icon:', err);
  }); 