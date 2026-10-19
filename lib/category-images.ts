/**
 * Curated cover photos for category browse tiles.
 * Used when a category has no live listing to pull a photo from.
 */
export const CATEGORY_IMAGES: Record<string, string> = {
  jackets:
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&h=1000&q=80",
  tops:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&h=1000&q=80",
  denim:
    "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=800&h=1000&q=80",
  dresses:
    "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&h=1000&q=80",
  shoes:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&h=1000&q=80",
  accessories:
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&h=1000&q=80",
  home:
    "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=800&h=1000&q=80",
};

export function categoryImage(slug: string): string | null {
  return CATEGORY_IMAGES[slug] ?? null;
}
