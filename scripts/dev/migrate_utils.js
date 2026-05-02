import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd());
const pkgSharedSrcDir = path.join(rootDir, 'packages/shared/src');
const destUtilsDir = path.join(pkgSharedSrcDir, 'utils');

// Create dest dir
if (!fs.existsSync(destUtilsDir)) {
  fs.mkdirSync(destUtilsDir, { recursive: true });
}

// Files to move
const filesToMove = ['hours.ts', 'invoice.ts', 'pdfEvent.ts', 'pdfGenerator.ts'];

filesToMove.forEach(file => {
  const clientPath = path.join(rootDir, 'apps/client/src/lib', file);
  const adminPath = path.join(rootDir, 'apps/admin/src/lib', file);
  const destPath = path.join(destUtilsDir, file);

  if (fs.existsSync(clientPath)) {
    fs.copyFileSync(clientPath, destPath);
    console.log(`Copied ${file} to shared/utils...`);
  }
  
  // Remove from apps
  if (fs.existsSync(clientPath)) fs.unlinkSync(clientPath);
  if (fs.existsSync(adminPath)) fs.unlinkSync(adminPath);
});

// Update packages/shared/index.ts
let indexContent = fs.existsSync(path.join(rootDir, 'packages/shared/index.ts')) 
  ? fs.readFileSync(path.join(rootDir, 'packages/shared/index.ts'), 'utf8') 
  : '';

filesToMove.forEach(file => {
  const name = file.replace('.ts', '');
  if (!indexContent.includes(`export * from './src/utils/${name}'`)) {
    indexContent += `export * from './src/utils/${name}';\n`;
  }
});

fs.writeFileSync(path.join(rootDir, 'packages/shared/index.ts'), indexContent);

// Search and Replace imports in apps
const dirsToScan = [
  path.join(rootDir, 'apps/client/src'),
  path.join(rootDir, 'apps/admin/src')
];

const processFiles = (dir) => {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      processFiles(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      filesToMove.forEach(file => {
        const name = file.replace('.ts', '');
        // Replace: import { Something } from "@/lib/invoice"
        const regex1 = new RegExp(`import\\s+({[^}]+}|[A-Za-z0-9_]+)\\s+from\\s+['"]@/lib/${name}['"]`, 'g');
        if (regex1.test(content)) {
          content = content.replace(regex1, `import $1 from '@mandys/shared'`);
          changed = true;
        }

        const regex2 = new RegExp(`import\\s+({[^}]+}|[A-Za-z0-9_]+)\\s+from\\s+['"](?:\\.\\./)+lib/${name}['"]`, 'g');
        if (regex2.test(content)) {
          content = content.replace(regex2, `import $1 from '@mandys/shared'`);
          changed = true;
        }
      });

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated utils imports in ${fullPath}`);
      }
    }
  });
};

dirsToScan.forEach(processFiles);

console.log('Shared utils migration complete!');
