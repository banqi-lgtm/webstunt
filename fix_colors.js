const fs = require('fs');
const path = './src/app/page.tsx';
let code = fs.readFileSync(path, 'utf8');

// Global color replacements to convert the Neon/Yellow theme to Racing Red
code = code.replace(/#B4FF00/g, '#E60000');
code = code.replace(/#9fe000/g, '#CC0000'); 
code = code.replace(/#FFD200/g, '#E60000'); 
code = code.replace(/#FF3B1F/g, '#E60000'); 
code = code.replace(/#FF553D/g, '#CC0000'); 

// Revert the neon glowing buttons to match the solid flat design from the image
code = code.replace(/bg-\[#E60000\] hover:bg-\[#CC0000\] text-white font-inter font-bold text-\[12px\] px-8 py-4 tracking-widest uppercase flex items-center gap-3 transition-transform hover:-translate-y-1 rounded-full shadow-\[0_0_15px_rgba\(255,255,255,0\.6\)\] border border-white\/50/g, 
  "bg-[#E60000] hover:bg-[#CC0000] text-white font-inter font-bold text-[12px] px-8 py-4 tracking-widest uppercase flex items-center gap-3 transition-transform hover:-translate-y-1 rounded-sm");

code = code.replace(/bg-\[#E60000\] hover:bg-\[#CC0000\] text-white font-inter font-bold text-xs px-8 py-3 tracking-widest uppercase transition-colors rounded-full shadow-\[0_0_15px_rgba\(255,255,255,0\.6\)\] border border-white\/50 flex items-center gap-2 w-max/g, 
  "bg-transparent border border-[#E60000] text-[#E60000] hover:bg-[#E60000] hover:text-white font-inter font-bold text-xs px-8 py-3 tracking-widest uppercase transition-colors rounded-sm flex items-center gap-2 w-max");

code = code.replace(/bg-\[#E60000\] hover:bg-\[#CC0000\] text-white shadow-\[0_0_15px_rgba\(255,255,255,0\.6\)\] border border-white\/50/g, 
  "bg-transparent border border-[#E60000] text-white hover:bg-[#E60000] hover:text-white");

code = code.replace(/rounded-full transition-colors flex items-center gap-2 \$\{portal\.btnColor\}/g, 
  "rounded-sm transition-colors flex items-center gap-2 ${portal.btnColor}");

// Also ensure "CONOCE PKNX" says "ACCESO PKNX" in the header if it says PKNX
// And ensure the specific styling for "VER SHOWREEL" is not neon if it was modified

fs.writeFileSync(path, code);
console.log('Colors and buttons updated successfully');
