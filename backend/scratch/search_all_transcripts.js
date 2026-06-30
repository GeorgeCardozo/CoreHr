const fs = require('fs');
const path = require('path');
const readline = require('readline');

const brainPath = 'C:\\Users\\BIBLIO\\.gemini\\antigravity\\brain';
const dirs = ['09d1340a-82d7-4643-ac76-b7b7fde4b39f', '12849ac3-1369-46cf-83f6-b972e9d681f4', '259e345f-ef01-40d6-a4b4-9b8c88d1e7ad', 'cb7ecbff-242d-4af9-9c55-43d05b1c51e7', 'f5993db4-5b97-406a-ba9a-9a739476b566', 'fc9ed2fa-051f-4e47-8b5a-b521de3a6dc4'];

const search = async () => {
  for (const d of dirs) {
    const logPath = path.join(brainPath, d, '.system_generated', 'logs', 'transcript.jsonl');
    if (!fs.existsSync(logPath)) continue;
    
    const fileStream = fs.createReadStream(logPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let lineCount = 0;
    for await (const line of rl) {
      lineCount++;
      if (line.includes('Directorio de Empleados') || line.includes('Gimnasio Los Arrayanes Bilingüe')) {
        // Look for JSX content
        if (line.includes('className=') && line.length > 3000) {
          console.log(`FOUND in dir ${d} at line ${lineCount}, length ${line.length}`);
          // Let's write the first 500 characters and write the full line to a file so we can read it
          fs.writeFileSync(`scratch/found_${d}_line_${lineCount}.json`, line);
          console.log(`Saved line content to scratch/found_${d}_line_${lineCount}.json`);
        }
      }
    }
  }
};

search();
