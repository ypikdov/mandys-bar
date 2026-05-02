const fs = require('fs');
const path = require('path');

const ADMIN_SRC = path.join(__dirname, '..', '..', 'apps', 'admin', 'src');

// Map of old paths to new paths
const fileMoves = [
  // Providers
  { from: 'context/AuthContext.tsx', to: 'providers/AuthContext.tsx' },
  { from: 'context/CartContext.tsx', to: 'providers/CartContext.tsx' },

  // Auth Feature
  { from: 'components/auth/AdminRoute.tsx', to: 'features/auth/AdminRoute.tsx' },
  { from: 'components/auth/AuthModal.tsx', to: 'features/auth/AuthModal.tsx' },
  { from: 'components/auth/LoginForm.tsx', to: 'features/auth/LoginForm.tsx' },
  { from: 'components/auth/RegisterForm.tsx', to: 'features/auth/RegisterForm.tsx' },
  { from: 'hooks/useProfile.ts', to: 'features/auth/useProfile.ts' },
  { from: 'services/api/authService.ts', to: 'features/auth/authService.ts' },
  { from: 'services/api/profileService.ts', to: 'features/auth/profileService.ts' },

  // Cart & Checkout
  { from: 'components/features/CartDrawer.tsx', to: 'features/cart/CartDrawer.tsx' },
  { from: 'components/features/CheckoutModal.tsx', to: 'features/checkout/CheckoutModal.tsx' },
  { from: 'components/features/StyledOrderButton.tsx', to: 'features/orders/StyledOrderButton.tsx' },
  { from: 'components/features/StyledOrderButton.css', to: 'features/orders/StyledOrderButton.css' },
  { from: 'hooks/useCheckout.ts', to: 'features/checkout/useCheckout.ts' },

  // Catalog
  { from: 'components/features/MenuItemCard.tsx', to: 'features/catalog/MenuItemCard.tsx' },
  { from: 'components/features/CatalogModal.tsx', to: 'features/catalog/CatalogModal.tsx' },
  { from: 'hooks/useProducts.ts', to: 'features/catalog/useProducts.ts' },
  { from: 'services/api/productService.ts', to: 'features/catalog/productService.ts' },
  { from: 'services/api/uploadService.ts', to: 'features/catalog/uploadService.ts' },

  // Orders
  { from: 'hooks/useOrders.ts', to: 'features/orders/useOrders.ts' },
  { from: 'hooks/useRealtimeOrders.ts', to: 'features/orders/useRealtimeOrders.ts' },
  { from: 'services/api/orderService.ts', to: 'features/orders/orderService.ts' },

  // Reservations
  { from: 'components/features/ReservationPDFDocument.tsx', to: 'features/reservations/ReservationPDFDocument.tsx' },
  { from: 'hooks/useReservations.ts', to: 'features/reservations/useReservations.ts' },
  { from: 'hooks/useEventReservation.ts', to: 'features/reservations/useEventReservation.ts' },
  { from: 'services/api/reservationService.ts', to: 'features/reservations/reservationService.ts' },

  // Staff
  { from: 'hooks/useStaff.ts', to: 'features/staff/useStaff.ts' },
  { from: 'services/api/userService.ts', to: 'features/staff/userService.ts' },

  // Reports
  { from: 'components/features/ExcelReport.tsx', to: 'features/reports/ExcelReport.tsx' },
  { from: 'components/features/PDFDownloadButton.tsx', to: 'features/reports/PDFDownloadButton.tsx' },

  // Gallery
  { from: 'components/features/ImmersiveGallery.tsx', to: 'features/gallery/ImmersiveGallery.tsx' },

  // Layouts
  { from: 'components/layout/Navbar.tsx', to: 'layouts/Navbar.tsx' },
  { from: 'components/layout/NavbarUI.tsx', to: 'layouts/NavbarUI.tsx' },
  { from: 'components/layout/Footer.tsx', to: 'layouts/Footer.tsx' },

  // Local UI Components
  { from: 'components/common/OptimizedImage.tsx', to: 'components/ui/OptimizedImage.tsx' }
];

// Import replacements
const importReplacements = [
  // Providers
  { from: /@\/context\/AuthContext/g, to: '@/providers/AuthContext' },
  { from: /@\/context\/CartContext/g, to: '@/providers/CartContext' },
  
  // Auth Feature
  { from: /@\/components\/auth\/AdminRoute/g, to: '@/features/auth/AdminRoute' },
  { from: /@\/components\/auth\/AuthModal/g, to: '@/features/auth/AuthModal' },
  { from: /@\/components\/auth\/LoginForm/g, to: '@/features/auth/LoginForm' },
  { from: /@\/components\/auth\/RegisterForm/g, to: '@/features/auth/RegisterForm' },
  { from: /@\/hooks\/useProfile/g, to: '@/features/auth/useProfile' },
  { from: /@\/services\/api\/authService/g, to: '@/features/auth/authService' },
  { from: /@\/services\/api\/profileService/g, to: '@/features/auth/profileService' },

  // Cart & Checkout
  { from: /@\/components\/features\/CartDrawer/g, to: '@/features/cart/CartDrawer' },
  { from: /@\/components\/features\/CheckoutModal/g, to: '@/features/checkout/CheckoutModal' },
  { from: /@\/components\/features\/StyledOrderButton/g, to: '@/features/orders/StyledOrderButton' },
  { from: /@\/hooks\/useCheckout/g, to: '@/features/checkout/useCheckout' },

  // Catalog
  { from: /@\/components\/features\/MenuItemCard/g, to: '@/features/catalog/MenuItemCard' },
  { from: /@\/components\/features\/CatalogModal/g, to: '@/features/catalog/CatalogModal' },
  { from: /@\/hooks\/useProducts/g, to: '@/features/catalog/useProducts' },
  { from: /@\/services\/api\/productService/g, to: '@/features/catalog/productService' },
  { from: /@\/services\/api\/uploadService/g, to: '@/features/catalog/uploadService' },

  // Orders
  { from: /@\/hooks\/useOrders/g, to: '@/features/orders/useOrders' },
  { from: /@\/hooks\/useRealtimeOrders/g, to: '@/features/orders/useRealtimeOrders' },
  { from: /@\/services\/api\/orderService/g, to: '@/features/orders/orderService' },

  // Reservations
  { from: /@\/components\/features\/ReservationPDFDocument/g, to: '@/features/reservations/ReservationPDFDocument' },
  { from: /@\/hooks\/useReservations/g, to: '@/features/reservations/useReservations' },
  { from: /@\/hooks\/useEventReservation/g, to: '@/features/reservations/useEventReservation' },
  { from: /@\/services\/api\/reservationService/g, to: '@/features/reservations/reservationService' },

  // Staff
  { from: /@\/hooks\/useStaff/g, to: '@/features/staff/useStaff' },
  { from: /@\/services\/api\/userService/g, to: '@/features/staff/userService' },

  // Reports
  { from: /@\/components\/features\/ExcelReport/g, to: '@/features/reports/ExcelReport' },
  { from: /@\/components\/features\/PDFDownloadButton/g, to: '@/features/reports/PDFDownloadButton' },

  // Gallery
  { from: /@\/components\/features\/ImmersiveGallery/g, to: '@/features/gallery/ImmersiveGallery' },

  // Layouts
  { from: /@\/components\/layout\/Navbar/g, to: '@/layouts/Navbar' },
  { from: /@\/components\/layout\/NavbarUI/g, to: '@/layouts/NavbarUI' },
  { from: /@\/components\/layout\/Footer/g, to: '@/layouts/Footer' },

  // UI Components
  { from: /@\/components\/common\/OptimizedImage/g, to: '@/components/ui/OptimizedImage' }
];

// Additional exact matches that don't have `@/` due to relative paths
const relativeReplacements = [
  // Examples of relative pathing that shouldn't happen much on admin because of aliases,
  // but just in case, we will rely string-replaces on text content.
];

// Helper to recursively find all files in a directory
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });
  return arrayOfFiles;
}

// 1. Move files
console.log('--- Moving files ---');
fileMoves.forEach(move => {
  const sourcePath = path.join(ADMIN_SRC, move.from);
  const targetPath = path.join(ADMIN_SRC, move.to);
  
  if (fs.existsSync(sourcePath)) {
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.renameSync(sourcePath, targetPath);
    console.log(`Moved: ${move.from} -> ${move.to}`);
  } else {
    console.log(`Not found: ${move.from}`);
  }
});

// 2. Cleanup empty directories
console.log('--- Cleaning directories ---');
const dirsToRemove = [
  'context',
  'components/auth',
  'components/features',
  'components/common',
  'components/layout',
  'services/api',
  'services',
  'hooks'
];

dirsToRemove.forEach(dir => {
  const dirPath = path.join(ADMIN_SRC, dir);
  if (fs.existsSync(dirPath)) {
    try {
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`Removed empty dir: ${dir}`);
      }
    } catch (e) {
      // ignore
    }
  }
});

// 3. Update imports in all source files
console.log('--- Updating imports ---');
const allSrcFiles = getAllFiles(ADMIN_SRC).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

allSrcFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  importReplacements.forEach(replacement => {
    content = content.replace(replacement.from, replacement.to);
  });
  
  // Custom relative replacements (if any are still broken)
  // Fix imports related to StyledOrderButton.css
  content = content.replace(/\.\/StyledOrderButton\.css/g, './StyledOrderButton.css');
  
  // Custom patch for layout/Navbar if it gets moved relative
  content = content.replace(/"\.\/NavbarUI"/g, '"@/layouts/NavbarUI"');
  content = content.replace(/'\.\/NavbarUI'/g, "'@/layouts/NavbarUI'");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated imports in: ${file.replace(ADMIN_SRC, '')}`);
  }
});

console.log('Admin restructure script completed.');
