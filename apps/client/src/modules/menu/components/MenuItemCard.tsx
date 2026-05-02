import { Button, Card, CardContent, CardFooter, CardHeader, Badge } from '@mandys/ui';
import React, { useState } from "react";
import { Plus, Minus, Heart } from "lucide-react";
import { useCart } from "@/providers/CartContext";
import { useFavorites } from "@/providers/FavoritesContext";
import type { Product } from "@/data/menuData";
import { OptimizedImage } from "@/components/common/OptimizedImage";

interface MenuItemCardProps {
  product: Product;
  priority?: boolean;
}

export const MenuItemCard = React.memo<MenuItemCardProps>(({ product, priority = false }) => {
  const { items, addItem, removeItem, updateQuantity } = useCart();
  const [showDescription, setShowDescription] = useState(false);
  const { isFavorite, toggleFavorite: toggleFavoriteProduct } = useFavorites();

  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const favorite = isFavorite(product.id);

  const handleIncrement = () => {
    addItem(product);
  };

  const handleDecrement = () => {
    if (cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(product.id, cartItem.quantity - 1);
      } else {
        removeItem(product.id);
      }
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavoriteProduct(product);
  };

  return (
    <Card className="flex flex-col overflow-hidden border-none shadow-md transition-all hover:shadow-lg dark:bg-card/50 relative">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 group">
        <OptimizedImage
          src={product.image}
          alt={product.name}
          priority={priority}
          width={480}
          height={360}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Favorite Button */}
        <button 
          onClick={handleToggleFavorite}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full cursor-pointer transition-all duration-300 ${favorite ? 'bg-white shadow-sm scale-110' : 'bg-white/80 hover:bg-white'} `}
          aria-label={favorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
        >
          <Heart 
            className={`w-6 h-6 transition-colors duration-300 ${favorite ? 'fill-primary text-primary' : 'text-zinc-600'}`} 
          />
        </button>

        {quantity > 0 && (
          <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground shadow-sm px-3 py-1 text-xs">
            {quantity} en pedido
          </Badge>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex flex-col gap-1 items-center text-center">
          <h3 className="line-clamp-2 text-lg font-black uppercase text-black">
            {product.name}
          </h3>
          <span className="font-bold text-primary text-xl">
            ₡{product.price.toLocaleString()}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 pt-0 text-sm text-muted-foreground">
         {showDescription && (
           <div className="overflow-hidden">
             <p className="py-2">{product.description}</p>
           </div>
         )}
         
         <Button 
            variant="link" 
            className="h-auto p-0 text-xs text-muted-foreground underline-offset-4"
            onClick={() => setShowDescription(!showDescription)}
         >
            {showDescription ? "Ocultar detalles" : "Ver detalles e ingredientes"}
         </Button>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {quantity === 0 ? (
          <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold" onClick={handleIncrement}>
            Agregar al pedido
          </Button>
        ) : (
          <div className="flex w-full items-center justify-between gap-2 rounded-md bg-secondary/50 p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-background"
              onClick={handleDecrement}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-bold">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-background"
              onClick={handleIncrement}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
});

MenuItemCard.displayName = "MenuItemCard";
