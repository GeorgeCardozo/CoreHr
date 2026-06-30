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
      if (line.includes('"type":"USER_INPUT"')) {
        const data = JSON.parse(line);
        const content = data.content || '';
        if (content.includes('Directorio') || content.includes('directorio') || content.includes('nombres') || content.includes('cargo')) {
          console.log(`FOUND in dir ${d} line ${lineCount}:`);
          console.log(content.substring(0, 300));
          console.log('-----------------------------');
        }
      }
    }
  }
};

search();
