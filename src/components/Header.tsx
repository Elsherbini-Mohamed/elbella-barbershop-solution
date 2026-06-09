"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, Scissors } from "lucide-react";

export default function Header() {
  const { cartCount } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-dark-border bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo (links to catalog / storefront) */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group" aria-label="Elbella Catalogo Home">
              <Scissors className="h-6 w-6 text-gold-500 transform group-hover:rotate-45 transition-transform duration-500" />
              <span className="font-serif text-2xl font-bold tracking-widest text-gold-gradient text-glow uppercase">
                Elbella
              </span>
            </Link>
          </div>

          {/* Clean Right Actions - Shopping Cart with Count Badge */}
          <div className="flex items-center gap-4">
            <Link
              href="/carrello"
              className="relative p-2.5 text-gray-400 hover:text-gold-400 transition-colors duration-300 group rounded-full hover:bg-white/5"
              aria-label="Carrello"
            >
              <ShoppingBag className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold-gradient text-[10px] font-bold text-black shadow-gold-glow animate-pulse-gold">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

