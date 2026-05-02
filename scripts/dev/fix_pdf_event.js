import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd());

// 1. Create packages/shared/src/constants/events.ts
const pkgSharedConstantsDir = path.join(rootDir, 'packages/shared/src/constants');
if (!fs.existsSync(pkgSharedConstantsDir)) {
  fs.mkdirSync(pkgSharedConstantsDir, { recursive: true });
}

const sharedEventsContent = `export const eventPrices: Record<string, number> = {
  birthday: 45000,
  party: 35000,
  corporate: 75000,
  wedding: 120000,
  other: 30000
};

export const eventTypeLabels: Record<string, string> = {
  birthday: "Cumpleaños",
  party: "Fiesta",
  meeting: "Reunión",
  corporate: "Evento Corporativo",
  wedding: "Boda",
  other: "Otro"
};
`;
fs.writeFileSync(path.join(pkgSharedConstantsDir, 'events.ts'), sharedEventsContent);

// 2. Export from shared
let indexContent = fs.readFileSync(path.join(rootDir, 'packages/shared/index.ts'), 'utf8');
if (!indexContent.includes(`export * from './src/constants/events'`)) {
  indexContent += `export * from './src/constants/events';\n`;
  fs.writeFileSync(path.join(rootDir, 'packages/shared/index.ts'), indexContent);
}

// 3. Fix apps/client/src/data/events.ts
const clientEventsPath = path.join(rootDir, 'apps/client/src/data/events.ts');
if (fs.existsSync(clientEventsPath)) {
  let content = fs.readFileSync(clientEventsPath, 'utf8');
  
  // Remove eventPrices
  const regexPrices = /export const eventPrices: Record<string, number> = \{[\s\S]+?\};/m;
  content = content.replace(regexPrices, '');

  // Remove eventTypeLabels
  const regexLabels = /export const eventTypeLabels: Record<string, string> = \{[\s\S]+?\};/m;
  content = content.replace(regexLabels, '');

  content += `\nexport { eventPrices, eventTypeLabels } from "@mandys/shared";\n`;

  fs.writeFileSync(clientEventsPath, content);
}

const adminEventsPath = path.join(rootDir, 'apps/admin/src/data/events.ts');
if (fs.existsSync(adminEventsPath)) {
  let content = fs.readFileSync(adminEventsPath, 'utf8');
  const regexPrices = /export const eventPrices: Record<string, number> = \{[\s\S]+?\};/m;
  content = content.replace(regexPrices, '');
  const regexLabels = /export const eventTypeLabels: Record<string, string> = \{[\s\S]+?\};/m;
  content = content.replace(regexLabels, '');
  content += `\nexport { eventPrices, eventTypeLabels } from "@mandys/shared";\n`;
  fs.writeFileSync(adminEventsPath, content);
}


// 4. Update pdfEvent.ts in shared
const pdfEventPath = path.join(rootDir, 'packages/shared/src/utils/pdfEvent.ts');
if (fs.existsSync(pdfEventPath)) {
  let content = fs.readFileSync(pdfEventPath, 'utf8');
  content = content.replace(/import \{ eventTypeLabels \} from "\.\.\/data\/events";/g, 'import { eventTypeLabels } from "../constants/events";');
  fs.writeFileSync(pdfEventPath, content);
}

console.log('Fixed pdfEvent.ts dependency!');
