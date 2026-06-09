"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Search, SlidersHorizontal, ShoppingCart, Check, Plus } from "lucide-react";

interface ProductImage {
  id: string;
  storage_url: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  image_url: string;
  category_id: string;
  category_name: string;
  specifications: Record<string, string>;
  tabs: Record<string, string>;
  images: string[];
}

interface StoreFrontProps {
  categories: { id: string; name: string }[];
  products: Product[];
}

const PAGE_SIZE = 24;

export default function StoreFront({ categories, products }: StoreFrontProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("default");
  const [isSortOpen, setIsSortOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category_name.toLowerCase().includes(query)
      );
    }

    if (sortBy === "price-asc") result.sort((a, b) => a.price - b.price);
    else if (sortBy === "price-desc") result.sort((a, b) => b.price - a.price);
    else if (sortBy === "title-asc") result.sort((a, b) => a.title.localeCompare(b.title));

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  // Reset pagination whenever filters change
  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSortChange = (val: string) => {
    setSortBy(val);
    setIsSortOpen(false);
    setVisibleCount(PAGE_SIZE);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
    });
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
  };

  const navigateToProduct = (product: Product) => {
    router.push(`/prodotto/${product.id}`);
  };

  const sortLabel =
    sortBy === "price-asc"
      ? "Prezzo: Min"
      : sortBy === "price-desc"
      ? "Prezzo: Max"
      : sortBy === "title-asc"
      ? "Nome: A-Z"
      : "Ordina";

  return (
    <div className="pb-16">
      {/* Compact subtitle bar — no duplicate logo */}
      <section className="border-b border-dark-border bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold-900/20 via-background to-background py-5">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <p className="text-center text-[11px] sm:text-xs text-dark-muted tracking-widest uppercase font-light px-4">
          Cere · Pomate · Lozioni · Accessori professionali per il barber contemporaneo
        </p>
      </section>

      {/* Filter controls */}
      <div id="catalogo" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 scroll-mt-24">
        <div className="border-b border-dark-border pb-3 flex flex-col gap-3">

          {/* Search + Sort */}
          <div className="flex flex-row gap-2 w-full items-center">
            {/* Search */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Cerca un prodotto..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-dark-surface border border-dark-border rounded-none px-3 py-2 pl-9 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
            </div>

            {/* Sort Dropdown */}
            <div
              className="relative w-36 sm:w-44 flex-shrink-0"
              tabIndex={0}
              onBlur={() => setTimeout(() => setIsSortOpen(false), 200)}
            >
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full flex items-center justify-between bg-dark-surface border border-dark-border px-3 py-2 text-[11px] text-gray-400 focus:outline-none focus:border-gold-500 transition-colors uppercase tracking-wider font-bold"
              >
                <span className="truncate">{sortLabel}</span>
                <div
                  className={`transform transition-transform duration-200 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-500 ml-1 flex-shrink-0 ${
                    isSortOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 mt-1 w-full bg-dark-surface border border-dark-border shadow-gold-glow z-30 flex flex-col divide-y divide-dark-border/40">
                  {[
                    { val: "default", label: "Predefinito" },
                    { val: "price-asc", label: "Prezzo: Min" },
                    { val: "price-desc", label: "Prezzo: Max" },
                    { val: "title-asc", label: "Nome: A-Z" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => handleSortChange(opt.val)}
                      className={`w-full text-left px-3 py-2 text-[10px] uppercase font-bold tracking-wider hover:bg-gold-500 hover:text-black transition-colors ${
                        sortBy === opt.val ? "text-gold-400 bg-dark-card/50" : "text-gray-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-nowrap gap-1.5 overflow-x-auto scrollbar-none max-w-full pb-1">
            <button
              onClick={() => handleCategoryChange("all")}
              className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                selectedCategory === "all"
                  ? "bg-gold-500 text-black border-gold-500 shadow-gold-glow"
                  : "bg-dark-surface text-gray-400 border-dark-border hover:border-gold-700 hover:text-white"
              }`}
            >
              Tutti
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase border transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === cat.id
                    ? "bg-gold-500 text-black border-gold-500 shadow-gold-glow"
                    : "bg-dark-surface text-gray-400 border-dark-border hover:border-gold-700 hover:text-white"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product count + reset */}
        <div className="mt-3 flex justify-between items-center text-[10px] text-dark-muted uppercase tracking-wider font-semibold">
          <span>
            {filteredProducts.length} prodott{filteredProducts.length === 1 ? "o" : "i"}
            {visibleCount < filteredProducts.length && (
              <span className="text-gold-600 ml-1">
                — mostrati {Math.min(visibleCount, filteredProducts.length)}
              </span>
            )}
          </span>
          {searchQuery && (
            <button
              onClick={() => handleSearchChange("")}
              className="text-gold-400 hover:underline"
            >
              Resetta ricerca
            </button>
          )}
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-dark-surface border border-dark-border mt-8">
            <SlidersHorizontal className="h-12 w-12 text-gold-800 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white">Nessun prodotto trovato</h3>
            <p className="text-sm text-dark-muted mt-2">Prova a modificare i filtri o la ricerca.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-8">
              {visibleProducts.map((product) => {
                const isAdded = addedProductId === product.id;
                return (
                  <div
                    key={product.id}
                    onClick={() => navigateToProduct(product)}
                    className="group relative flex flex-col bg-dark-card border border-dark-border overflow-hidden hover:border-gold-600/50 hover:shadow-gold-glow transition-all duration-500 cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square w-full overflow-hidden bg-dark-surface border-b border-dark-border">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="h-full w-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-dark-muted bg-dark-surface text-xs">
                          Nessuna immagine
                        </div>
                      )}

                      {/* Category badge */}
                      {product.category_name && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-black/70 text-gold-400 border border-gold-900/60 backdrop-blur-sm">
                          {product.category_name}
                        </span>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col flex-grow p-3 sm:p-4 gap-2">
                      <h3 className="font-sans text-xs sm:text-sm font-semibold text-white tracking-wide leading-snug line-clamp-2 min-h-[32px] sm:min-h-[40px] group-hover:text-gold-400 transition-colors duration-300">
                        {product.title}
                      </h3>

                      {/* Price + Add to cart */}
                      <div className="flex items-center justify-between mt-auto pt-1 gap-2">
                        <span className="font-serif text-sm sm:text-base font-bold text-gold-gradient text-glow">
                          €{product.price.toFixed(2)}
                        </span>

                        <button
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={isAdded}
                          className={`flex items-center justify-center h-7 w-7 flex-shrink-0 border transition-all duration-300 ${
                            isAdded
                              ? "bg-gold-500 border-gold-500 text-black scale-110"
                              : "bg-dark-surface border-dark-border text-gray-400 hover:bg-gold-500 hover:border-gold-500 hover:text-black hover:scale-110"
                          }`}
                          aria-label="Aggiungi al carrello"
                        >
                          {isAdded ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More */}
            {visibleCount < filteredProducts.length && (
              <div className="mt-10 flex flex-col items-center gap-3">
                <p className="text-[10px] text-dark-muted uppercase tracking-wider">
                  Mostrati {visibleCount} di {filteredProducts.length} prodotti
                </p>
                <button
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="px-8 py-3 border border-gold-700 text-gold-400 text-[11px] font-bold uppercase tracking-widest hover:bg-gold-500 hover:text-black hover:border-gold-500 hover:shadow-gold-glow transition-all duration-300"
                >
                  Carica altri prodotti
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
