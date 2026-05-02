import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './providers/CartContext.tsx'

const appTree = (
  <CartProvider>
    <App />
  </CartProvider>
);

createRoot(document.getElementById('root')!).render(
  import.meta.env.PROD ? appTree : appTree,
);
