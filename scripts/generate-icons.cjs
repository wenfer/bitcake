const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sizes = [192, 512];
const inputSvg = process.argv[2] || 'public/cake.svg';
const outputDir = process.argv[3] || 'public/icons';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const chromePath = '/usr/bin/google-chrome';

sizes.forEach(size => {
  const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
  
  // Create HTML file for Chrome to render
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
<style>
body { margin: 0; display: flex; justify-content: center; align-items: center; background: transparent; }
svg { width: ${size}px; height: ${size}px; }
</style>
</head>
<body>
${fs.readFileSync(inputSvg, 'utf8')}
</body>
</html>`;
  
  const tempHtml = path.join(outputDir, `temp-${size}.html`);
  fs.writeFileSync(tempHtml, htmlContent);
  
  try {
    execSync(`${chromePath} --headless --disable-gpu --no-sandbox --screenshot="${outputFile}" --window-size=${size},${size} --hide-scrollbars "file://${path.resolve(tempHtml)}"`, {
      timeout: 30000
    });
    console.log(`Generated: ${outputFile}`);
    
    // Clean up temp file
    fs.unlinkSync(tempHtml);
  } catch (err) {
    console.error(`Failed to generate ${size}x${size}:`, err.message);
    process.exit(1);
  }
});

console.log('All icons generated successfully!');
