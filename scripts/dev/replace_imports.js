import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
let changedCount = 0;

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let original = c;
  
  c = c.replace(/import\s*\{\s*Button\s*\}\s*from\s*["']@\/components\/ui\/button["'];?/g, 'import { Button } from "@mandys/ui";');
  c = c.replace(/import\s*\{\s*buttonVariants\s*\}\s*from\s*["']@\/components\/ui\/button["'];?/g, 'import { buttonVariants } from "@mandys/ui";');
  c = c.replace(/import\s*\{\s*cn\s*\}\s*from\s*["']@\/lib\/utils["'];?/g, 'import { cn } from "@mandys/ui";');
  
  if (original !== c) {
    fs.writeFileSync(f, c);
    changedCount++;
  }
});
console.log('Updated files: ' + changedCount);
