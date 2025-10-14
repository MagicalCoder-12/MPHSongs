const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#000000"/>
  <text x="256" y="256" font-family="Arial, sans-serif" font-size="200" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">🎵</text>
</svg>
`;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write the SVG file
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon.trim());

console.log('SVG icon created successfully!');
console.log('To generate PNG icons, you can use an online converter or image editing software.');
console.log('Required sizes: 192x192, 256x256, 384x384, 512x512');