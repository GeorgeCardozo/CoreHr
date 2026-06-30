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
    if (line.includes('contrasena') || line.includes('password') || line.includes('1001089215')) {
      console.log(`\nLine ${lineCount}:`);
      if (line.length > 800) {
        // Find index of one of these keywords
        const keywords = ['contrasena', 'password', '1001089215'];
        let index = -1;
        for (const kw of keywords) {
          index = line.indexOf(kw);
          if (index !== -1) break;
        }
        const start = Math.max(0, index - 150);
        const end = Math.min(line.length, index + 250);
        console.log('...', line.substring(start, end).replace(/\n/g, ' '), '...');
      } else {
        console.log(line);
      }
    }
  }
};

main();
