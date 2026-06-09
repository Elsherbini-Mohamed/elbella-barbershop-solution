"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ChevronLeft, ChevronRight, ChevronDown, Check, ShoppingBag } from "lucide-react";
import { Product } from "@/lib/products";

interface ProductDetailViewProps {
  product: Product;
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const router = useRouter();
  const { addToCart } = useCart();

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [addedToCart, setAddedToCart] = useState<boolean>(false);
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleAccordion = (key: string) => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image_url: product.image_url,
    });
    router.push("/carrello");
  };

  const scrollToImage = (index: number) => {
    setActiveImageIndex(index);
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({ left: index * width, behavior: "smooth" });
    }
  };

  const nextImage = () => {
    const len = product.images.length;
    if (len <= 1) return;
    scrollToImage(activeImageIndex === len - 1 ? 0 : activeImageIndex + 1);
  };

  const prevImage = () => {
    const len = product.images.length;
    if (len <= 1) return;
    scrollToImage(activeImageIndex === 0 ? len - 1 : activeImageIndex - 1);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const index = Math.round(container.scrollLeft / container.clientWidth);
    if (index !== activeImageIndex && index >= 0 && index < product.images.length) {
      setActiveImageIndex(index);
    }
  };

  const displayDescription =
    product.description ||
    "Formula premium per professionisti. Garantisce una tenuta eccezionale ed un look impeccabile per tutta la giornata. Realizzato con ingredienti scelti per nutrire i capelli ed esaltare lo stile.";

  const isLongDescription = displayDescription.length > 180;
  const descriptionText =
    isLongDescription && !isDescExpanded
      ? `${displayDescription.slice(0, 180)}...`
      : displayDescription;

  const validSpecs = product.specifications
    ? Object.entries(product.specifications).filter(([key, val]) => {
        if (!key || key.trim() === "") return false;
        if (val === null || val === undefined) return false;
        if (typeof val === "string" && val.trim() === "") return false;
        return true;
      })
    : [];
  const hasSpecs = validSpecs.length > 0;

  const filteredTabs = product.tabs
    ? Object.entries(product.tabs).filter(([title, content]) => {
        const isDescription =
          title.toLowerCase() === "description" || title.toLowerCase() === "descrizione";
        const isEmpty = !content || (typeof content === "string" && content.trim() === "");
        return !isDescription && !isEmpty;
      })
    : [];
  const hasAnyAccordion = hasSpecs || filteredTabs.length > 0;

  return (
    <div className="min-h-screen bg-background text-white flex flex-col">
      <div className="mx-auto max-w-4xl w-full px-4 sm:px-6 lg:px-8 pt-3 pb-28 md:pb-8 flex-1 flex flex-col">

        {/* Back link */}
        <div className="mb-5">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gold-400 hover:text-gold-300 transition-colors duration-300 group"
          >
            <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-300" />
            <span>Torna alla lista</span>
          </button>
        </div>

        {/* Main two-column grid — fills remaining height on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 flex-1">

          {/* ── LEFT: Image gallery ── */}
          <div className="md:col-span-6 flex flex-col gap-3">

            {/* Image viewer with overlay arrows */}
            <div className="relative aspect-square w-full bg-dark-surface border border-dark-border overflow-hidden">
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="w-full h-full flex overflow-x-auto scrollbar-none snap-x snap-mandatory scroll-smooth"
              >
                {product.images.length > 0 ? (
                  product.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="w-full h-full flex-shrink-0 flex items-center justify-center snap-start"
                    >
                      <img
                        src={img}
                        alt={`${product.title} - ${idx + 1}`}
                        className="max-h-full max-w-full object-contain select-none"
                        draggable="false"
                      />
                    </div>
                  ))
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark-muted text-sm font-light">
                    Nessuna immagine disponibile
                  </div>
                )}
              </div>

              {/* Overlay arrow buttons — only when multiple images */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 border border-dark-border/60 text-gold-400 hover:bg-black/80 hover:text-white transition-colors backdrop-blur-sm"
                    aria-label="Immagine precedente"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 border border-dark-border/60 text-gold-400 hover:bg-black/80 hover:text-white transition-colors backdrop-blur-sm"
                    aria-label="Immagine successiva"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Dot indicators overlaid at bottom */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {product.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => scrollToImage(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          activeImageIndex === idx
                            ? "w-4 bg-gold-500 shadow-gold-glow"
                            : "w-1.5 bg-white/30 hover:bg-white/60"
                        }`}
                        aria-label={`Vai alla foto ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail tray */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToImage(idx)}
                    className={`relative w-14 h-14 border flex-shrink-0 bg-dark-card overflow-hidden p-1.5 transition-all duration-300 ${
                      activeImageIndex === idx
                        ? "border-gold-500 shadow-gold-glow"
                        : "border-dark-border hover:border-gray-500"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Anteprima ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Info + accordions + actions ── */}
          <div className="md:col-span-6 flex flex-col gap-4">

            {/* Title + price */}
            <div className="pb-3 border-b border-dark-border/40">
              <span className="inline-block bg-gold-900/40 border border-gold-800/40 text-gold-400 text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider">
                {product.category_name}
              </span>
              <div className="flex items-start justify-between gap-4 mt-1.5">
                <h2 className="font-serif text-lg sm:text-xl font-extrabold text-white tracking-wide uppercase leading-tight">
                  {product.title}
                </h2>
                <span className="font-serif text-xl font-extrabold text-gold-gradient text-glow whitespace-nowrap pt-0.5">
                  €{product.price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h3 className="text-[10px] font-bold tracking-widest text-gold-400 uppercase">
                Descrizione
              </h3>
              <p className="text-xs text-gray-300 font-light leading-relaxed">{descriptionText}</p>
              {isLongDescription && (
                <button
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-gold-400 hover:text-gold-300 font-semibold text-[10px] transition-colors hover:underline"
                >
                  {isDescExpanded ? "Mostra meno" : "Leggi di più"}
                </button>
              )}
            </div>

            {/* Accordions */}
            {hasAnyAccordion && (
              <div className="border-t border-dark-border/40 pt-3 space-y-1.5 flex-1">
                {hasSpecs && (
                  <div className="border border-dark-border/40 bg-dark-surface/30 overflow-hidden">
                    <button
                      onClick={() => toggleAccordion("specs")}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-[11px] font-bold text-gold-400 uppercase tracking-widest hover:bg-dark-surface/50 transition-colors"
                    >
                      <span>Specifiche Tecniche</span>
                      <ChevronDown
                        className={`h-3.5 w-3.5 text-gold-500 transition-transform duration-300 ${
                          openAccordion === "specs" ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openAccordion === "specs" && (
                      <div className="px-4 pb-4 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          {validSpecs.map(([key, val]) => (
                            <div
                              key={key}
                              className="bg-dark-surface/75 border border-dark-border/20 p-2 text-[10px]"
                            >
                              <span className="text-dark-muted font-bold block uppercase tracking-wider mb-0.5 text-[8px]">
                                {key}
                              </span>
                              <span className="text-gray-200 font-light">{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {filteredTabs.map(([tabTitle, tabContent]) => {
                  const accordionId = `tab-${tabTitle.toLowerCase().replace(/\s+/g, "-")}`;
                  const isOpen = openAccordion === accordionId;
                  return (
                    <div
                      key={tabTitle}
                      className="border border-dark-border/40 bg-dark-surface/30 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleAccordion(accordionId)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left text-[11px] font-bold text-gold-400 uppercase tracking-widest hover:bg-dark-surface/50 transition-colors"
                      >
                        <span>{tabTitle}</span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 text-gold-500 transition-transform duration-300 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 text-[11px] text-gray-300 font-light leading-relaxed whitespace-pre-line">
                          {tabContent}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Action buttons — desktop only (inline, bottom of right col) ── */}
            <div className="hidden md:flex items-center gap-3 pt-2 border-t border-dark-border/40 mt-auto">
              {/* Buy Now */}
              <button
                onClick={handleBuyNow}
                className="px-5 h-12 border border-gold-700 text-gold-400 text-[11px] font-bold uppercase tracking-widest hover:bg-gold-500 hover:text-black hover:border-gold-500 hover:shadow-gold-glow transition-all duration-300 whitespace-nowrap flex-shrink-0"
              >
                Compra Subito
              </button>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                className={`flex-grow h-12 font-extrabold tracking-widest text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
                  addedToCart
                    ? "bg-green-700 text-white scale-95"
                    : "bg-gold-gradient text-black hover:opacity-95 shadow-gold-glow hover:shadow-gold-glow-strong hover:scale-[1.01] active:scale-95"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="h-4 w-4" />
                    Aggiunto!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Aggiungi al Carrello
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile fixed bottom bar (hidden on md+) ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 border-t border-dark-border/80 backdrop-blur-lg px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Buy Now compact */}
          <button
            onClick={handleBuyNow}
            className="px-4 h-12 border border-gold-700 text-gold-400 text-[10px] font-bold uppercase tracking-widest hover:bg-gold-500 hover:text-black transition-all duration-300 whitespace-nowrap flex-shrink-0"
          >
            Compra Subito
          </button>

          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className={`flex-grow h-12 font-extrabold tracking-widest text-xs uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              addedToCart
                ? "bg-green-700 text-white scale-95"
                : "bg-gold-gradient text-black shadow-gold-glow active:scale-95"
            }`}
          >
            {addedToCart ? (
              <>
                <Check className="h-4 w-4" />
                Aggiunto!
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                Aggiungi al Carrello
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
