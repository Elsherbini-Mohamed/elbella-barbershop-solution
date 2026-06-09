import fs from "fs";
import path from "path";
import { supabase } from "./supabase";

export interface Product {
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

export interface Category {
  id: string;
  name: string;
}

// Deterministic hashing helper to keep mock pricing and stocks consistent for each product
export function getDeterministicPrice(title: string, categoryName: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  const prices: Record<string, number[]> = {
    "Pomade": [12.90, 14.90, 16.90, 18.90, 19.90],
    "Hair Stylers": [10.90, 12.90, 14.90, 15.90],
    "Hair Care": [14.90, 16.90, 19.90, 24.90],
    "Skin Care": [8.90, 11.90, 14.90, 18.90, 22.90],
    "Beard & Mustache": [14.90, 16.90, 18.90],
    "Wax Products": [9.90, 12.90, 15.90],
    "Saloon Products": [15.90, 19.90, 24.90, 39.90, 49.90]
  };
  
  const categoryPrices = prices[categoryName] || [14.90, 16.90, 19.90];
  return categoryPrices[hash % categoryPrices.length];
}

export function getDeterministicStock(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  return 15 + (hash % 61); // 15 to 75
}

// Fallback loader to parse products directly from the scraped json
export function getLocalFallbackData(): { categories: Category[]; products: Product[] } {
  try {
    const jsonPath = path.join(process.cwd(), "scraper", "prodotti_dettagli.json");
    if (!fs.existsSync(jsonPath)) {
      return { categories: [], products: [] };
    }
    const rawData = fs.readFileSync(jsonPath, "utf8");
    const catalog = JSON.parse(rawData);

    const categoriesList: Category[] = [];
    const productsList: Product[] = [];

    let catIdCounter = 1;
    let prodIdCounter = 1;

    Object.entries(catalog).forEach(([categoryName, products]: [string, any]) => {
      const catId = `cat-fallback-${catIdCounter++}`;
      categoriesList.push({ id: catId, name: categoryName });

      products.forEach((prod: any) => {
        const prodId = `prod-fallback-${prodIdCounter++}`;
        const details = prod.details || {};
        
        // Extract images
        const images = (details.images || []).map((img: any) => {
          return img.remote_url || "";
        }).filter(Boolean);

        const title = details.extracted_title || prod.title;
        const price = getDeterministicPrice(title, categoryName);
        const quantity = getDeterministicStock(title);

        productsList.push({
          id: prodId,
          title: title,
          description: details.description || "",
          price: price,
          quantity: quantity,
          image_url: images[0] || "",
          category_id: catId,
          category_name: categoryName,
          specifications: details.specifications || {},
          tabs: details.tabs || {},
          images: images.length > 0 ? images : ["/favicon.ico"]
        });
      });
    });

    return { categories: categoriesList, products: productsList };
  } catch (err) {
    console.error("Errore nel caricamento del fallback locale:", err);
    return { categories: [], products: [] };
  }
}

// Get all products and categories
export async function getStoreData(): Promise<{ categories: Category[]; products: Product[] }> {
  try {
    // 1. Fetch categories
    const { data: dbCategories, error: catError } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    // 2. Fetch products
    const { data: dbProducts, error: prodError } = await supabase
      .from("products")
      .select("*");

    // 3. Fetch product images
    const { data: dbImages, error: imgError } = await supabase
      .from("product_images")
      .select("*");

    if (catError || prodError || !dbCategories || !dbProducts) {
      console.log("[~] Errore Supabase o tabelle mancanti. Avvio modalità Fallback Locale.");
      return getLocalFallbackData();
    }

    console.log(`[+] Caricamento dati da Supabase riuscito! Categorie: ${dbCategories.length}, Prodotti: ${dbProducts.length}`);
    
    const categories = dbCategories.map(c => ({ id: c.id.toString(), name: c.name }));
    
    const products = dbProducts.map(p => {
      const cat = dbCategories.find(c => c.id === p.category_id);
      const catName = cat ? cat.name : "Barbershop";
      
      const prodImages = dbImages?.filter(img => img.product_id === p.id) || [];
      const imagesUrls = prodImages.map(img => img.storage_url || img.remote_url).filter(Boolean);
      
      const price = p.price !== undefined && p.price !== null ? parseFloat(p.price) : getDeterministicPrice(p.title, catName);
      const quantity = p.quantity !== undefined && p.quantity !== null ? parseInt(p.quantity) : getDeterministicStock(p.title);
      const image_url = p.image_url || imagesUrls[0] || "";

      return {
        id: p.id.toString(),
        title: p.title,
        description: p.description || "",
        price: price,
        quantity: quantity,
        image_url: image_url,
        category_id: p.category_id.toString(),
        category_name: catName,
        specifications: p.specifications || {},
        tabs: p.tabs || {},
        images: imagesUrls.length > 0 ? imagesUrls : [image_url].filter(Boolean)
      };
    });

    return { categories, products };
  } catch (err) {
    console.error("[!] Errore imprevisto durante il fetch. Utilizzo dei dati locali:", err);
    return getLocalFallbackData();
  }
}

// Find a single product by ID
export async function getProductById(id: string): Promise<Product | null> {
  // If it's a fallback ID, resolve immediately from fallback data
  if (id.startsWith("prod-fallback-")) {
    const { products } = getLocalFallbackData();
    return products.find(p => p.id === id) || null;
  }

  try {
    // 1. Fetch product
    const { data: p, error: prodError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (prodError || !p) {
      console.log(`[~] Prodotto con ID ${id} non trovato in Supabase. Ricerca nei fallback.`);
      const { products } = getLocalFallbackData();
      return products.find(prod => prod.id === id) || null;
    }

    // 2. Fetch product category
    let catName = "Barbershop";
    if (p.category_id) {
      const { data: cat } = await supabase
        .from("categories")
        .select("name")
        .eq("id", p.category_id)
        .maybeSingle();
      if (cat) {
        catName = cat.name;
      }
    }

    // 3. Fetch product images
    const { data: dbImages } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", p.id);

    const imagesUrls = dbImages?.map(img => img.storage_url || img.remote_url).filter(Boolean) || [];
    
    const price = p.price !== undefined && p.price !== null ? parseFloat(p.price) : getDeterministicPrice(p.title, catName);
    const quantity = p.quantity !== undefined && p.quantity !== null ? parseInt(p.quantity) : getDeterministicStock(p.title);
    const image_url = p.image_url || imagesUrls[0] || "";

    return {
      id: p.id.toString(),
      title: p.title,
      description: p.description || "",
      price: price,
      quantity: quantity,
      image_url: image_url,
      category_id: p.category_id?.toString() || "",
      category_name: catName,
      specifications: p.specifications || {},
      tabs: p.tabs || {},
      images: imagesUrls.length > 0 ? imagesUrls : [image_url].filter(Boolean)
    };
  } catch (err) {
    console.error(`[!] Errore imprevisto cercando il prodotto ${id}. Utilizzo fallback:`, err);
    const { products } = getLocalFallbackData();
    return products.find(prod => prod.id === id) || null;
  }
}
