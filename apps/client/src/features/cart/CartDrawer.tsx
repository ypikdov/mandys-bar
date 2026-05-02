import { Button, ScrollArea, Separator, Sheet, SheetContent, SheetHeader, SheetTitle } from '@mandys/ui';
import { lazy, Suspense, useEffect, useState } from "react";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/providers/CartContext";

const CheckoutModal = lazy(() =>
  import("@/features/checkout/CheckoutModal").then((module) => ({ default: module.CheckoutModal }))
);
// We need to extend the useCart context slightly to include an isCartOpen state in App/Navbar
// Or manage the sheet state locally here triggered by an event, but context is cleaner.
// For now, let's assume the cart context controls visibility or we export a standalone component
// that can be controlled from outside.

export const CartDrawer = () => {
    const { items, removeItem, updateQuantity, totalPrice, totalItems, isCartOpen, setIsCartOpen } = useCart();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [shouldRenderCheckoutModal, setShouldRenderCheckoutModal] = useState(isCheckoutOpen);

    useEffect(() => {
        if (isCheckoutOpen) {
            setShouldRenderCheckoutModal(true);
        }
    }, [isCheckoutOpen]);

    const handleOrderSuccess = () => {
        // Todo el flujo post-pedido (PDF y WhatsApp) ahora se maneja explícitamente 
        // a través de los botones en el Paso 3 del CheckoutModal.
        // Esto previene descargas automáticas no deseadas.
    };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-md bg-white border-l border-zinc-200 flex flex-col px-0 sm:px-0">
        <SheetHeader className="px-6 py-4 border-b border-zinc-100">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold uppercase text-black">
            <ShoppingBag className="w-5 h-5 text-primary" />
            Tu Pedido
            <span className="text-sm font-normal text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full ml-auto">
                {totalItems} items
            </span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-zinc-500">
            <ShoppingBag className="w-16 h-16 mb-4 text-zinc-300" />
            <p className="text-lg">Tu carrito está vacío</p>
            <p className="text-sm">Agrega deliciosos platillos de nuestro menú.</p>
            <Button 
                className="mt-6 bg-primary text-white hover:bg-primary/90"
                onClick={() => setIsCartOpen(false)}
            >
                Ver Menú
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="py-6 space-y-6">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                     <div className="w-20 h-20 rounded-lg overflow-hidden border border-zinc-200 shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-1 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                             <div>
                                 <h4 className="font-bold text-black text-sm uppercase leading-tight line-clamp-2">{item.name}</h4>
                                 <p className="text-primary font-bold text-sm mt-1">₡{item.price.toLocaleString("es-CR")}</p>
                             </div>
                             <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1" aria-label="Eliminar item">
                                 <Trash2 className="w-4 h-4" />
                             </button>
                         </div>
                         <div className="flex items-center gap-3 mt-2">
                             <div className="flex items-center border border-zinc-200 rounded-md">
                                 <button 
                                    className="p-1 hover:bg-zinc-100 text-black transition-colors"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    aria-label="Disminuir cantidad"
                                 >
                                    <Minus className="w-4 h-4" />
                                 </button>
                                 <span className="w-8 text-center text-sm font-semibold text-black">{item.quantity}</span>
                                 <button 
                                    className="p-1 hover:bg-zinc-100 text-black transition-colors"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    aria-label="Aumentar cantidad"
                                 >
                                    <Plus className="w-4 h-4" />
                                 </button>
                             </div>
                             <span className="text-sm font-bold text-black ml-auto">
                                ₡{(item.price * item.quantity).toLocaleString("es-CR")}
                             </span>
                         </div>
                     </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-zinc-200 p-6 bg-zinc-50">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-zinc-600 text-sm">
                  <span>Subtotal (Precio Base)</span>
                  <span>₡{(totalPrice / 1.13).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-zinc-600 text-sm">
                  <span>IVA (13%)</span>
                  <span>₡{((totalPrice / 1.13) * 0.13).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <Separator className="bg-zinc-200" />
                <div className="flex justify-between text-black font-black text-lg uppercase">
                  <span>Total <span className="text-xs font-normal text-zinc-500 lowercase">(imp. incluidos)</span></span>
                  <span className="text-primary font-bold">₡{totalPrice.toLocaleString("es-CR")}</span>
                </div>
              </div>

              {/* Información Legal Requerida CR */}
              <div className="mb-6 text-[10px] text-zinc-500 leading-tight space-y-0.5 border border-zinc-200 p-3 rounded-lg bg-white">
                <p className="font-bold text-zinc-800 text-xs mb-1 uppercase tracking-wider">Mandy's Bar & Restaurante</p>
                <p>Cédula Jurídica: 3-101-123456</p>
                <p>Dirección: Cañas. 450m norte de compre bien</p>
                <p>Tel/WhatsApp: <span className="font-semibold text-zinc-700">+506 8666 1940</span></p>
                <p>Email: geraldvill101@gmail.com</p>
                <div className="mt-2 pt-2 border-t border-zinc-100 flex items-center gap-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                   <p className="text-zinc-600 font-medium">Condición: Contribuyente | Moneda: CRC</p>
                </div>
              </div>

              <Button 
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white py-6 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" /> Pagar Pedido
              </Button>

              {shouldRenderCheckoutModal && (
                <Suspense fallback={null}>
                  <CheckoutModal 
                    isOpen={isCheckoutOpen} 
                    onClose={() => setIsCheckoutOpen(false)}
                    items={items}
                    totalPrice={totalPrice}
                    onOrderSuccess={handleOrderSuccess}
                  />
                </Suspense>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
