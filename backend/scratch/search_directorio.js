const fs = require('fs');
const readline = require('readline');

const logFilePath = 'C:\\Users\\BIBLIO\\.gemini\\antigravity\\brain\\259e345f-ef01-40d6-a4b4-9b8c88d1e7ad\\.system_generated\\logs\\transcript.jsonl';

const main = async () => {
  const fileStream = fs.createReadStream(logFilePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (line.toLowerCase().includes('directorio') || line.toLowerCase().includes('arrayanes')) {
      console.log(`\nLine ${lineCount}:`);
      if (line.length > 500) {
        const index = line.toLowerCase().indexOf('directorio');
        const start = Math.max(0, index - 100);
        const end = Math.min(line.length, index + 600);
        console.log('...', line.substring(start, end).replace(/\n/g, ' '), '...');
      } else {
        console.log(line);
      }
    }
  }
};

main();
