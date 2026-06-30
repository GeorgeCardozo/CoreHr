const fs = require('fs');
const path = require('path');

const brainPath = 'C:\\Users\\BIBLIO\\.gemini\\antigravity\\brain';

try {
  const dirs = fs.readdirSync(brainPath);
  console.log('Dirs in brain:', dirs);
  for (const d of dirs) {
    const logPath = path.join(brainPath, d, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(logPath)) {
      console.log(`Found transcript at ${logPath}, size: ${fs.statSync(logPath).size}`);
    }
  }
} catch (err) {
  console.error('Error listing brains:', err);
}
