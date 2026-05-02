import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(process.cwd());
const clientSrc = path.join(rootDir, 'apps/client/src');
const featuresDir = path.join(clientSrc, 'features');
const providersDir = path.join(clientSrc, 'providers');

// 1. Define moves
const moves = [
  // Providers
  { src: 'context/AuthContext.tsx', dest: 'providers/AuthContext.tsx' },
  { src: 'context/CartContext.tsx', dest: 'providers/CartContext.tsx' },
  
  // Auth
  { src: 'components/auth/AuthModal.tsx', dest: 'features/auth/AuthModal.tsx' },
  { src: 'components/auth/LoginForm.tsx', dest: 'features/auth/LoginForm.tsx' },
  { src: 'components/auth/RegisterForm.tsx', dest: 'features/auth/RegisterForm.tsx' },
  
  // Cart
  { src: 'components/features/CartDrawer.tsx', dest: 'features/cart/CartDrawer.tsx' },
  
  // Checkout
  { src: 'components/features/CheckoutModal.tsx', dest: 'features/checkout/CheckoutModal.tsx' },
  { src: 'hooks/useCheckout.ts', dest: 'features/checkout/useCheckout.ts' },
  
  // Menu
  { src: 'components/features/MenuItemCard.tsx', dest: 'features/menu/MenuItemCard.tsx' },
  { src: 'components/features/CatalogModal.tsx', dest: 'features/menu/CatalogModal.tsx' },
  { src: 'hooks/useProducts.ts', dest: 'features/menu/useProducts.ts' },
  
  // Orders
  { src: 'components/features/ExcelReport.tsx', dest: 'features/orders/ExcelReport.tsx' },
  { src: 'components/features/PDFDownloadButton.tsx', dest: 'features/orders/PDFDownloadButton.tsx' },
  { src: 'components/features/StyledOrderButton.tsx', dest: 'features/orders/StyledOrderButton.tsx' },
  { src: 'components/features/StyledOrderButton.css', dest: 'features/orders/StyledOrderButton.css' },
  { src: 'hooks/useOrders.ts', dest: 'features/orders/useOrders.ts' },
  { src: 'hooks/useRealtimeOrders.ts', dest: 'features/orders/useRealtimeOrders.ts' },

  // Reservations
  { src: 'components/features/ReservationPDFDocument.tsx', dest: 'features/reservations/ReservationPDFDocument.tsx' },
  { src: 'hooks/useEventReservation.ts', dest: 'features/reservations/useEventReservation.ts' },
  { src: 'hooks/useReservations.ts', dest: 'features/reservations/useReservations.ts' },

  // Profile
  { src: 'hooks/useProfile.ts', dest: 'features/profile/useProfile.ts' },
];

const deadCode = [
  'hooks/useStaff.ts'
];

// Perform moves
moves.forEach(({ src, dest }) => {
  const srcPath = path.join(clientSrc, src);
  const destPath = path.join(clientSrc, dest);

  if (fs.existsSync(srcPath)) {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.renameSync(srcPath, destPath);
    console.log(`Moved ${src} -> ${dest}`);
  }
});

// Remove dead code
deadCode.forEach(file => {
  const p = path.join(clientSrc, file);
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Removed dead code ${file}`);
  }
});

// Remove old folders if empty
const dirsToRemove = [
  'context',
  'components/auth',
  'components/features',
];

dirsToRemove.forEach(d => {
  const dp = path.join(clientSrc, d);
  if (fs.existsSync(dp) && fs.readdirSync(dp).length === 0) {
    fs.rmdirSync(dp);
    console.log(`Removed empty dir ${d}`);
  }
});

// 2. Refactor imports
const refactorMap = {
  // context -> providers
  '@/context/AuthContext': '@/providers/AuthContext',
  '@/context/CartContext': '@/providers/CartContext',

  // auth
  '@/components/auth/AuthModal': '@/features/auth/AuthModal',
  '@/components/auth/LoginForm': '@/features/auth/LoginForm',
  '@/components/auth/RegisterForm': '@/features/auth/RegisterForm',

  // cart
  '@/components/features/CartDrawer': '@/features/cart/CartDrawer',

  // checkout
  '@/components/features/CheckoutModal': '@/features/checkout/CheckoutModal',
  '@/hooks/useCheckout': '@/features/checkout/useCheckout',

  // menu
  '@/components/features/MenuItemCard': '@/features/menu/MenuItemCard',
  '@/components/features/CatalogModal': '@/features/menu/CatalogModal',
  '@/hooks/useProducts': '@/features/menu/useProducts',

  // orders
  '@/components/features/ExcelReport': '@/features/orders/ExcelReport',
  '@/components/features/PDFDownloadButton': '@/features/orders/PDFDownloadButton',
  '@/components/features/StyledOrderButton': '@/features/orders/StyledOrderButton',
  '@/hooks/useOrders': '@/features/orders/useOrders',
  '@/hooks/useRealtimeOrders': '@/features/orders/useRealtimeOrders',

  // reservations
  '@/components/features/ReservationPDFDocument': '@/features/reservations/ReservationPDFDocument',
  '@/hooks/useEventReservation': '@/features/reservations/useEventReservation',
  '@/hooks/useReservations': '@/features/reservations/useReservations',

  // profile
  '@/hooks/useProfile': '@/features/profile/useProfile'
};

const processImports = (dir) => {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir);
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) {
      processImports(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Object.entries handles specific exact paths.
      // E.g., import X from "@/context/AuthContext" -> "@/providers/AuthContext"
      for (const [oldPath, newPath] of Object.entries(refactorMap)) {
        const regexStr = oldPath.replace(/[.*+?^$\/{}()|[\\]\\]/g, '\\$&');
        // match from "${oldPath}" or '${oldPath}'
        const regex = new RegExp(`(['"])${regexStr}(['"])`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, `$1${newPath}$2`);
          changed = true;
        }
      }

      // Also fix relative imports. e.g. import from "../../context/AuthContext"
      // Since it's complicated, wait, in this codebase they almost exclusively use @/ mapping!
      // I'll check if relative imports exist using standard replace but generally `@/` is dominant.
      // Let's also do a pass for `./StyledOrderButton.css` -> it should be `./StyledOrderButton.css` natively.
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated imports in ${fullPath}`);
      }
    }
  });
};

processImports(clientSrc);

console.log('Client restructuring complete!');
