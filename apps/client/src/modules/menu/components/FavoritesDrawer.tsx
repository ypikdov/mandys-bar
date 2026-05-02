import { Button, ScrollArea, Sheet, SheetContent, SheetHeader, SheetTitle } from '@mandys/ui';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '@/providers/CartContext';
import { useFavorites } from '@/providers/FavoritesContext';

export const FavoritesDrawer = () => {
  const { addItem } = useCart();
  const {
    favorites,
    totalFavorites,
    isFavoritesOpen,
    setIsFavoritesOpen,
    removeFavorite,
    clearFavorites,
  } = useFavorites();

  return (
    <Sheet open={isFavoritesOpen} onOpenChange={setIsFavoritesOpen}>
      <SheetContent className="flex w-full flex-col border-l border-zinc-200 bg-white px-0 sm:max-w-md sm:px-0">
        <SheetHeader className="border-b border-zinc-100 px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold uppercase text-black">
            <Heart className="h-5 w-5 text-primary" />
            Favoritos
            <span className="ml-auto rounded-full bg-zinc-100 px-2 py-0.5 text-sm font-normal text-zinc-500">
              {totalFavorites} items
            </span>
          </SheetTitle>
        </SheetHeader>

        {favorites.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-zinc-500">
            <Heart className="mb-4 h-16 w-16 text-zinc-300" />
            <p className="text-lg">Todavía no tienes favoritos</p>
            <p className="text-sm">Marca productos con el corazón para tenerlos a mano.</p>
            <Button className="mt-6 bg-primary text-white hover:bg-primary/90" onClick={() => setIsFavoritesOpen(false)}>
              Ver menú
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 px-6">
              <div className="space-y-5 py-6">
                {favorites.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="line-clamp-2 text-sm font-bold uppercase leading-tight text-black">{item.name}</h4>
                          <p className="mt-1 text-sm font-bold text-primary">₡{item.price.toLocaleString('es-CR')}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-400">{item.categoryId}</p>
                        </div>
                        <button
                          onClick={() => removeFavorite(item.id)}
                          className="p-1 text-zinc-400 transition-colors hover:text-red-500"
                          aria-label={`Quitar ${item.name} de favoritos`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button
                          className="flex-1 bg-primary text-white hover:bg-primary/90"
                          onClick={() => addItem({ id: item.id, name: item.name, price: item.price, image: item.image, details: item.description })}
                        >
                          <ShoppingBag className="mr-2 h-4 w-4" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-zinc-200 bg-zinc-50 p-6">
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={clearFavorites}>
                  Limpiar
                </Button>
                <Button asChild className="flex-1 bg-primary text-white hover:bg-primary/90">
                  <Link to="/menu" onClick={() => setIsFavoritesOpen(false)}>
                    Ir al menú
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
