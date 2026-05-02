import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd());
const clientUiDir = path.join(rootDir, 'apps/client/src/components/ui');
const adminUiDir = path.join(rootDir, 'apps/admin/src/components/ui');
const pkgUiSrcDir = path.join(rootDir, 'packages/ui/src');
const atomicDir = path.join(pkgUiSrcDir, 'components/atomic');

// Create atomic dir
if (!fs.existsSync(atomicDir)) {
  fs.mkdirSync(atomicDir, { recursive: true });
}

// Move files from client to packages/ui
const files = fs.existsSync(clientUiDir) ? fs.readdirSync(clientUiDir) : [];
files.forEach(file => {
  if (file.endsWith('.tsx')) {
    const srcPath = path.join(clientUiDir, file);
    const destPath = path.join(atomicDir, file);
    console.log(`Copying ${file}...`);
    fs.copyFileSync(srcPath, destPath);
  }
});

// Update packages/ui/index.ts
let indexContent = '';
const atomicFiles = fs.readdirSync(atomicDir).filter(f => f.endsWith('.tsx'));
atomicFiles.forEach(file => {
  const name = file.replace('.tsx', '');
  indexContent += `export * from './src/components/atomic/${name}';\n`;
});
indexContent += `export { cn } from './src/utils';\n`;
fs.writeFileSync(path.join(rootDir, 'packages/ui/index.ts'), indexContent);

// Remove duplicates
const rimraf = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};
rimraf(clientUiDir);
rimraf(adminUiDir);
if (fs.existsSync(path.join(pkgUiSrcDir, 'button.tsx'))) {
  fs.unlinkSync(path.join(pkgUiSrcDir, 'button.tsx'));
}

// Search and Replace imports
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

      // Replace: import { Something } from "@/components/ui/xyz"
      const regex1 = /import\s+({[^}]+})\s+from\s+['"]@\/components\/ui\/[^'"]+['"]/g;
      if (regex1.test(content)) {
        content = content.replace(regex1, "import $1 from '@mandys/ui'");
        changed = true;
      }

      // Replace: import { Something } from "../../components/ui/xyz"
      const regex2 = /import\s+({[^}]+})\s+from\s+['"](?:\.\.\/)+components\/ui\/[^'"]+['"]/g;
      if (regex2.test(content)) {
        content = content.replace(regex2, "import $1 from '@mandys/ui'");
        changed = true;
      }
      
      // Update @mandys/ui imports to make sure they use the package name correctly
      // Wait, some components might import from "../ui/xyz" inside components
      const regex3 = /import\s+({[^}]+})\s+from\s+['"]\.\/ui\/[^'"]+['"]/g;
      if (regex3.test(content)) {
        content = content.replace(regex3, "import $1 from '@mandys/ui'");
        changed = true;
      }

      const regex4 = /import\s+({[^}]+})\s+from\s+['"]\.\.\/ui\/[^'"]+['"]/g;
      if (regex4.test(content)) {
        content = content.replace(regex4, "import $1 from '@mandys/ui'");
        changed = true;
      }

      if (changed) {
        // Dedup consecutive imports from @mandys/ui
        let imports = new Set();
        let strippedContent = content.replace(/import\s+{([^}]+)}\s+from\s+['"]@mandys\/ui['"]\s*;?/g, (match, p1) => {
          p1.split(',').forEach(i => imports.add(i.trim()));
          return '';
        });
        
        if (imports.size > 0) {
          const importStr = `import { ${Array.from(imports).filter(Boolean).join(', ')} } from '@mandys/ui';\n`;
          // Find first import position to inject
          const firstImportGroup = strippedContent.match(/^import .*/m);
          if (firstImportGroup) {
             const idx = strippedContent.indexOf(firstImportGroup[0]);
             strippedContent = strippedContent.substring(0, idx) + importStr + strippedContent.substring(idx);
          } else {
             strippedContent = importStr + strippedContent;
          }
          fs.writeFileSync(fullPath, strippedContent);
          console.log(`Updated imports in ${fullPath}`);
        } else {
          fs.writeFileSync(fullPath, content);
          console.log(`Updated imports in ${fullPath}`);
        }
      }
    }
  });
};

dirsToScan.forEach(processFiles);

// Fix internal `@/lib/utils` inside packages/ui/src/components/atomic/
const atomicFiles2 = fs.readdirSync(atomicDir).filter(f => f.endsWith('.tsx'));
atomicFiles2.forEach(file => {
  const fullPath = path.join(atomicDir, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  if (content.includes('@/lib/utils')) {
    content = content.replace(/@\/lib\/utils/g, '../../utils');
    fs.writeFileSync(fullPath, content);
    console.log(`Updated internal utils import in ${file}`);
  }
});

console.log('Done!');
