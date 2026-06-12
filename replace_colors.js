const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { regex: /#39FF14/gi, replacement: '#E60000' },
  { regex: /#32E011/gi, replacement: '#CC0000' },
  { regex: /#00ff88/gi, replacement: '#E60000' },
  { regex: /#00e67a/gi, replacement: '#CC0000' },
  { regex: /rgba\(57,\s*255,\s*20/g, replacement: 'rgba(230, 0, 0' },
  { regex: /rgba\(0,\s*255,\s*136/g, replacement: 'rgba(230, 0, 0' },
  { regex: /#39ff1415/gi, replacement: '#e6000015' },
  { regex: /#00ff8815/gi, replacement: '#e6000015' },
  { regex: /green-500/g, replacement: 'red-600' },
  { regex: /green-400/g, replacement: 'red-500' },
  { regex: /text-\[\#39FF14\]/gi, replacement: 'text-[#E60000]' },
  { regex: /bg-\[\#39FF14\]/gi, replacement: 'bg-[#E60000]' },
  { regex: /border-\[\#39FF14\]/gi, replacement: 'border-[#E60000]' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;
      
      for (const r of replacements) {
        content = content.replace(r.regex, r.replacement);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated:', fullPath);
      }
    }
  }
}

processDir(srcDir);
console.log('Done replacing colors.');
