const fs = require('fs');
const path = require('path');

const dir = './pages'; // we run it in src, let's also scan components

const replacements = [
  { regex: /\btext-white\b/g, replace: 'text-gray-900 dark:text-white' },
  { regex: /\bgray-100\b/g, replace: 'gray-900 dark:text-gray-100' }, // wait, text-gray-100
  { regex: /\btext-gray-100\b/g, replace: 'text-gray-900 dark:text-gray-100' },
  { regex: /\btext-gray-300\b/g, replace: 'text-gray-600 dark:text-gray-300' },
  { regex: /\btext-gray-400\b/g, replace: 'text-gray-500 dark:text-gray-400' },
  { regex: /\btext-white\/80\b/g, replace: 'text-gray-700 dark:text-white/80' },
  { regex: /\btext-white\/50\b/g, replace: 'text-gray-500 dark:text-white/50' },
  { regex: /\bbg-surface\b/g, replace: 'bg-white dark:bg-surface' },
  { regex: /\bbg-surface-dark\b/g, replace: 'bg-gray-100 dark:bg-surface-dark' },
  { regex: /\bbg-white\/5\b/g, replace: 'bg-black/[0.03] dark:bg-white/5' },
  { regex: /\bbg-white\/10\b/g, replace: 'bg-black/[0.05] dark:bg-white/10' },
  { regex: /\bborder-white\/10\b/g, replace: 'border-black/[0.08] dark:border-white/10' },
  { regex: /\bborder-white\/20\b/g, replace: 'border-black/10 dark:border-white/20' },
];

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Avoid double-replacements if run multiple times
      if (content.includes('dark:text-white')) continue;
      
      let originalContent = content;
      for (const { regex, replace } of replacements) {
        content = content.replace(regex, replace);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDir('./pages');
processDir('./components');
processDir('./'); // like App.jsx and main.jsx
console.log('Done refactoring components to support light mode!');
