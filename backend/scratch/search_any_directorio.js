const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainPath = 'C:\\Users\\BIBLIO\\.gemini\\antigravity\\brain';
const dirs = fs.readdirSync(brainPath).filter(d => fs.existsSync(path.join(brainPath, d, '.system_generated', 'logs', 'transcript.jsonl')));

const search = async () => {
  for (const d of dirs) {
    const logPath = path.join(brainPath, d, '.system_generated', 'logs', 'transcript.jsonl');
    
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineCount = 0;
    for await (const line of rl) {
      lineCount++;
      if (line.toLowerCase().includes('directorio') && line.includes('"type":"USER_INPUT"')) {
        console.log(`USER INPUT in dir ${d} at line ${lineCount}:`);
        console.log(line.substring(0, 1000));
        console.log('---');
      }
    }
  }
};

search();
