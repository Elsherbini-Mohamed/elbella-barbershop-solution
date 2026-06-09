"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Plus, Minus, Trash2, ChevronLeft, ShoppingBag, CreditCard } from "lucide-react";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();

  const shippingCost = cartTotal >= 50 || cartTotal === 0 ? 0 : 5.90;
  const grandTotal = cartTotal + shippingCost;

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Header compatto */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gold-400 hover:text-gold-300 transition-colors duration-300 group"
          >
            <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-300" />
            Torna al Catalogo
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider mt-2">
            Il Tuo Carrello
          </h1>
          <p className="text-[11px] text-dark-muted mt-1">
            Rivedi i tuoi prodotti prima di procedere al pagamento sicuro.
          </p>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-20 bg-dark-card border border-dark-border">
            <ShoppingBag className="h-14 w-14 text-gold-800 mx-auto mb-5 animate-bounce" />
            <h2 className="font-serif text-xl font-semibold text-white uppercase tracking-wider">
              Il carrello è vuoto
            </h2>
            <p className="text-sm text-dark-muted mt-2 max-w-md mx-auto">
              Non hai ancora aggiunto alcun prodotto al carrello. Torna allo store per scoprire la selezione.
            </p>
            <Link
              href="/"
              className="inline-block mt-8 bg-gold-gradient text-black font-bold px-8 py-4 text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-300"
            >
              Esplora i Prodotti
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

            {/* Lista prodotti */}
            <div className="lg:col-span-2 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 bg-dark-card border border-dark-border p-4 hover:border-gold-800/40 transition-colors duration-300"
                >
                  {/* Thumbnail */}
                  <div className="h-[72px] w-[72px] flex-shrink-0 bg-dark-surface border border-dark-border overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-dark-muted">
                        N/D
                      </div>
                    )}
                  </div>

                  {/* Colonna destra: nome + controlli */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2 justify-between">

                    {/* Riga 1: nome + cestino */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-sans text-xs sm:text-sm font-semibold text-white leading-snug line-clamp-2 flex-1 min-w-0">
                        {item.title}
                      </h3>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-dark-muted hover:text-red-500 transition-colors duration-300 flex-shrink-0 mt-0.5"
                        aria-label="Rimuovi prodotto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Riga 2: prezzo/pz + quantità + subtotale */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gold-400 font-serif font-semibold whitespace-nowrap">
                        €{item.price.toFixed(2)}/pz
                      </span>

                      <div className="flex items-center gap-3">
                        {/* Quantity selector */}
                        <div className="flex items-center border border-dark-border bg-dark-surface">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors border-r border-dark-border"
                            aria-label="Diminuisci"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-semibold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors border-l border-dark-border"
                            aria-label="Aumenta"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Subtotale */}
                        <span className="font-serif text-sm font-bold text-white whitespace-nowrap">
                          €{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>

            {/* Riepilogo ordine — sticky su desktop */}
            <div className="lg:sticky lg:top-24">
              <div className="bg-dark-surface border border-dark-border p-5 shadow-gold-glow">
                <h2 className="font-serif text-base font-bold text-white uppercase tracking-wider mb-5 pb-3 border-b border-dark-border">
                  Riepilogo Ordine
                </h2>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-gray-400">
                    <span>Prodotti ({cartCount})</span>
                    <span className="text-white">€{cartTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-400">
                    <span>Spedizione Corriere</span>
                    {shippingCost === 0 ? (
                      <span className="text-green-400 font-semibold uppercase tracking-wider text-[10px]">Gratuita</span>
                    ) : (
                      <span className="text-white">€{shippingCost.toFixed(2)}</span>
                    )}
                  </div>

                  {shippingCost > 0 && (
                    <div className="text-[10px] text-gold-400 bg-gold-950/20 border border-gold-900/50 p-2.5 leading-normal">
                      💡 Aggiungi <span className="font-bold">€{(50 - cartTotal).toFixed(2)}</span> per la <span className="font-bold uppercase">Spedizione Gratuita</span>
                    </div>
                  )}

                  <div className="border-t border-dark-border/60 pt-3 flex justify-between font-bold">
                    <span className="text-white uppercase tracking-wider text-xs">Totale Complessivo</span>
                    <span className="text-gold-gradient text-glow text-sm font-serif">€{grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <Link
                    href="/checkout"
                    className="w-full bg-gold-gradient text-black font-bold py-3.5 text-xs uppercase tracking-widest hover:opacity-90 shadow-gold-glow hover:shadow-gold-glow-strong transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Procedi al Checkout
                  </Link>

                  <Link
                    href="/"
                    className="w-full block text-center border border-dark-border text-gray-400 hover:text-white font-bold py-2.5 text-[10px] uppercase tracking-widest transition-colors duration-300"
                  >
                    Continua lo Shopping
                  </Link>
                </div>

                <p className="mt-4 text-[9px] text-dark-muted text-center leading-normal">
                  🔒 Pagamento protetto SSL — elaborato con Stripe
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
