// Node.js script to generate extension icons
// Run with: node generate-icons.js
// Requires: npm install canvas

const fs = require('fs');
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// For a simple solution without canvas dependency, create a note
const note = `
ICON SETUP INSTRUCTIONS
=======================

The extension needs icon files at:
- icons/icon16.png
- icons/icon48.png  
- icons/icon128.png

OPTION 1: Use the HTML generator
1. Open create-icons.html in a browser
2. It will automatically download the icon files
3. Move them to the icons/ folder

OPTION 2: Create manually
1. Create 16x16, 48x48, and 128x128 pixel PNG images
2. Use a purple gradient background (#667eea to #764ba2)
3. Add an "@" symbol or email icon in white
4. Save as icon16.png, icon48.png, icon128.png in the icons/ folder

OPTION 3: Use online tools
- Use an icon generator like https://www.favicon-generator.org/
- Or use any image editor to create the icons

The extension will work without icons, but Chrome will show a default icon.
`;

console.log(note);
fs.writeFileSync(path.join(__dirname, 'ICON_INSTRUCTIONS.txt'), note);

