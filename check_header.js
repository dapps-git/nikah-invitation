const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'decor', 'bouquet-icon.png');
if (fs.existsSync(filePath)) {
  const buffer = fs.readFileSync(filePath);
  console.log('First 8 bytes:', buffer.slice(0, 8));
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    console.log('It is a PNG!');
  } else if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    console.log('It is a JPEG!');
  } else {
    console.log('Unknown format!');
  }
} else {
  console.log('File not found!');
}
