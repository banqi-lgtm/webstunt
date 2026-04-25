const fs = require('fs');
const babel = require('@babel/parser');

const code = fs.readFileSync('c:/Users/walte/OneDrive/Escritorio - copia/Escritorio/webstunt/webstunt/src/app/(dashboard)/inscripcion/page.tsx', 'utf8');

try {
  babel.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("Success! No syntax errors.");
} catch (e) {
  console.error("Syntax Error:", e.message);
  console.error("Location:", e.loc);
  
  // Print the 5 lines before and after the error
  const lines = code.split('\n');
  const lineNum = e.loc.line - 1;
  const start = Math.max(0, lineNum - 5);
  const end = Math.min(lines.length - 1, lineNum + 5);
  for (let i = start; i <= end; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
