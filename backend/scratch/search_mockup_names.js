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
      if (line.toLowerCase().includes('elena vance') || line.toLowerCase().includes('jaime reyes') || line.toLowerCase().includes('carlos mendoza')) {
        console.log(`FOUND in dir ${d} line ${lineCount}, line length: ${line.length}`);
        fs.writeFileSync(`scratch/found_names_${d}_line_${lineCount}.json`, line);
        console.log(`Saved line content to scratch/found_names_${d}_line_${lineCount}.json`);
      }
    }
  }
};

search();
