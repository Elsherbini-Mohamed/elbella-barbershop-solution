import React from "react";
import { getStoreData } from "@/lib/products";
import StoreFront from "@/components/StoreFront";

export const revalidate = 0; // Disable static caching for live updates

export default async function HomePage() {
  const { categories, products } = await getStoreData();

  return (
    <main className="min-h-screen bg-background">
      <StoreFront categories={categories} products={products} />
    </main>
  );
}
