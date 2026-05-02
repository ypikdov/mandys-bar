import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd());
const pkgSharedSrcDir = path.join(rootDir, 'packages/shared/src');
const destTypesDir = path.join(pkgSharedSrcDir, 'types');

// Create dest dir
if (!fs.existsSync(destTypesDir)) {
  fs.mkdirSync(destTypesDir, { recursive: true });
}

// Move models.ts
const clientModelsPath = path.join(rootDir, 'apps/client/src/types/models.ts');
const adminModelsPath = path.join(rootDir, 'apps/admin/src/types/models.ts');
const destModelsPath = path.join(destTypesDir, 'models.ts');

if (fs.existsSync(clientModelsPath)) {
  fs.copyFileSync(clientModelsPath, destModelsPath);
  console.log(`Copied models.ts to shared...`);
}

// Update packages/shared/index.ts
let indexContent = fs.existsSync(path.join(rootDir, 'packages/shared/index.ts')) 
  ? fs.readFileSync(path.join(rootDir, 'packages/shared/index.ts'), 'utf8') 
  : '';
if (!indexContent.includes(`export * from './src/types/models'`)) {
  indexContent = `export * from './src/types/models';\n` + indexContent;
}
fs.writeFileSync(path.join(rootDir, 'packages/shared/index.ts'), indexContent);

// Remove local types dirs if they only contain models.ts
const removeLocalModels = (modelsPath) => {
  if (fs.existsSync(modelsPath)) {
    fs.unlinkSync(modelsPath);
  }
};
removeLocalModels(clientModelsPath);
removeLocalModels(adminModelsPath);

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

      // Replace: import type { Order } from "@/types/models"
      // or import { OrderStatus } from "../../types/models"
      const regex1 = /import\s+(type\s+)?({[^}]+})\s+from\s+['"]@\/types\/models['"]/g;
      if (regex1.test(content)) {
        content = content.replace(regex1, "import $1$2 from '@mandys/shared'");
        changed = true;
      }

      const regex2 = /import\s+(type\s+)?({[^}]+})\s+from\s+['"](?:\.\.\/)+types\/models['"]/g;
      if (regex2.test(content)) {
        content = content.replace(regex2, "import $1$2 from '@mandys/shared'");
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated models imports in ${fullPath}`);
      }
    }
  });
};

dirsToScan.forEach(processFiles);
console.log('Shared models migration complete!');
