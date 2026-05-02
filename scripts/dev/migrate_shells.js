import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd());
const clientShellsDir = path.join(rootDir, 'apps/client/src/components/shells');
const adminShellsDir = path.join(rootDir, 'apps/admin/src/components/shells');
const pkgUiSrcDir = path.join(rootDir, 'packages/ui/src');
const destShellsDir = path.join(pkgUiSrcDir, 'components/shells');

// Create dest dir
if (!fs.existsSync(destShellsDir)) {
  fs.mkdirSync(destShellsDir, { recursive: true });
}

const copyShells = (srcDir) => {
  if (!fs.existsSync(srcDir)) return;
  const files = fs.readdirSync(srcDir);
  files.forEach(file => {
    if (file.endsWith('.tsx')) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destShellsDir, file);
      if (!fs.existsSync(destPath)) {
        console.log(`Copying ${file}...`);
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });
};

copyShells(clientShellsDir);
copyShells(adminShellsDir);

// Update packages/ui/index.ts
let indexContent = fs.readFileSync(path.join(rootDir, 'packages/ui/index.ts'), 'utf8');
const shellFiles = fs.readdirSync(destShellsDir).filter(f => f.endsWith('.tsx'));
shellFiles.forEach(file => {
  const name = file.replace('.tsx', '');
  if (!indexContent.includes(`export * from './src/components/shells/${name}'`)) {
    indexContent = `export * from './src/components/shells/${name}';\n` + indexContent;
  }
});
fs.writeFileSync(path.join(rootDir, 'packages/ui/index.ts'), indexContent);

// Remove local shells dirs
const rimraf = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
rimraf(clientShellsDir);
rimraf(adminShellsDir);

// Fix internal imports inside destShellsDir
shellFiles.forEach(file => {
  const fullPath = path.join(destShellsDir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  // Replace @/components/ui/xyz with ../atomic/xyz
  const regexUI = /@\/components\/ui\/([^'"]+)/g;
  if (regexUI.test(content)) {
    content = content.replace(regexUI, '../atomic/$1');
    changed = true;
  }
  
  if (content.includes('@/lib/utils')) {
    content = content.replace(/@\/lib\/utils/g, '../../utils');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fullPath, content);
  }
});

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

      // Replace: import { PageShell } from "@/components/shells/PageShell"
      // or import PageShell from ...
      const regex1 = /import\s+({[^}]+}|[A-Za-z0-9_]+)\s+from\s+['"]@\/components\/shells\/[^'"]+['"]/g;
      if (regex1.test(content)) {
        content = content.replace(regex1, "import { $1 } from '@mandys/ui'");
        changed = true;
      }

      const regex2 = /import\s+({[^}]+}|[A-Za-z0-9_]+)\s+from\s+['"](?:\.\.\/)+components\/shells\/[^'"]+['"]/g;
      if (regex2.test(content)) {
        content = content.replace(regex2, "import { $1 } from '@mandys/ui'");
        changed = true;
      }
      
      const regex3 = /import\s+({[^}]+}|[A-Za-z0-9_]+)\s+from\s+['"]\.\/shells\/[^'"]+['"]/g;
      if (regex3.test(content)) {
        content = content.replace(regex3, "import { $1 } from '@mandys/ui'");
        changed = true;
      }

      if (changed) {
        // Fix duplicate curly braces cases e.g. import { { PageShell } } that resulted from default imports regex
        content = content.replace(/import\s+{\s*{\s*([^}]+)\s*}\s*}\s*from/g, "import { $1 } from");
       
        // merge all @mandys/ui imports
        let imports = new Set();
        let strippedContent = content.replace(/import\s+{([^}]+)}\s+from\s+['"]@mandys\/ui['"]\s*;?/g, (match, p1) => {
          p1.split(',').forEach(i => imports.add(i.trim()));
          return '';
        });
        
        if (imports.size > 0) {
          const importStr = `import { ${Array.from(imports).filter(Boolean).join(', ')} } from '@mandys/ui';\n`;
          const firstImportGroup = strippedContent.match(/^import .*/m);
          if (firstImportGroup) {
             const idx = strippedContent.indexOf(firstImportGroup[0]);
             strippedContent = strippedContent.substring(0, idx) + importStr + strippedContent.substring(idx);
          } else {
             strippedContent = importStr + strippedContent;
          }
          fs.writeFileSync(fullPath, strippedContent);
          console.log(`Updated shells imports in ${fullPath}`);
        } else {
          fs.writeFileSync(fullPath, content);
          console.log(`Updated shells imports in ${fullPath}`);
        }
      }
    }
  });
};

dirsToScan.forEach(processFiles);

console.log('Shell migration complete!');
