const fs = require('fs');
const readline = require('readline');

const path = require('path');

const walkDir = (dir, callback) => {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
};

const main = () => {
  const srcDir = 'C:\\Users\\BIBLIO\\Documents\\antigravity\\CoreHr\\frontend\\src';
  walkDir(srcDir, (filePath) => {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.html')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('lh3.googleusercontent.com') || content.includes('lh3.google')) {
        console.log(`FOUND IN FILE: ${filePath}`);
        // find exact lines
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('lh3.google')) {
            console.log(`  L${idx+1}: ${l.trim().substring(0, 100)}...`);
          }
        });
      }
    }
  });
};

main();
