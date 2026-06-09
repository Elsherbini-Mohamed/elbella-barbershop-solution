import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { getProductById } from "@/lib/products";
import ProductDetailView from "@/components/ProductDetailView";
import { AlertTriangle, Home } from "lucide-react";

export const revalidate = 0; // Disable static caching to allow real-time stock edits

interface PageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const product = await getProductById(params.id);
  if (!product) {
    return {
      title: "Prodotto Non Trovato | Elbella",
      description: "Il prodotto cercato non è disponibile nel nostro catalogo.",
    };
  }
  return {
    title: `${product.title} | Elbella Barbershop`,
    description: product.description || `Acquista ${product.title} su Elbella. Prodotti premium d'oro per parrucchieri e barbieri professionali.`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const product = await getProductById(params.id);

  if (!product) {
    return (
      <main className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4">
        <div className="bg-dark-card border border-red-500/20 max-w-md w-full rounded-3xl p-8 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-500">
            <AlertTriangle className="h-8 w-8 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-wider text-red-400">
              Prodotto Non Trovato
            </h2>
            <p className="text-sm text-dark-muted font-light leading-relaxed">
              Siamo spiacenti, il prodotto che stai cercando non esiste o non è più disponibile nel catalogo Elbella.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gold-gradient text-black font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity uppercase tracking-widest text-xs shadow-gold-glow"
          >
            <Home className="h-4 w-4" />
            Torna alla Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <ProductDetailView product={product} />
    </main>
  );
}
