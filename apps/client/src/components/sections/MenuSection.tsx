
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@mandys/ui';
import { categories, products } from "@/data/menuData";
import { MenuItemCard } from "@/modules/menu/components/MenuItemCard";
import { useFavorites } from "@/providers/FavoritesContext";

export const MenuSection = () => {
  const { isFavorite } = useFavorites();

  return (
    <section id="menu" className="py-16 bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="mb-10 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            Nuestro Menú
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Disfruta de nuestra selección de bocas, platos fuertes y bebidas refrescantes.
          </p>
        </div>

        <Tabs defaultValue={categories[0].id} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="flex flex-wrap h-auto justify-center bg-transparent gap-2">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="rounded-full px-6 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border bg-background"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-8">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
                {products
                  .filter((p) => p.categoryId === category.id)
                  .sort((a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id)))
                  .map((product) => (
                    <MenuItemCard key={product.id} product={product} />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};
