"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Package,
  ShoppingBag,
  Edit,
  Trash2,
  Truck,
  LogOut,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  PlusCircle,
  FileText,
  Search,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  image_url: string;
  category_id: string;
  category_name?: string;
  specifications: Record<string, string>;
  tabs: Record<string, string>;
}

interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_zip: string;
  total_amount: number;
  status: string;
  items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
    image_url: string;
  }>;
}

interface Notification {
  type: "success" | "error";
  message: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Product search
  const [productSearch, setProductSearch] = useState("");

  // Modal + form
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    image_url: "",
    category_id: "",
  });
  const [savingProduct, setSavingProduct] = useState(false);

  // Loading states for individual row actions
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);

  // Inline delete confirmation (replaces window.confirm)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; title: string } | null>(null);

  // Inline notification (replaces alert)
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── Auth check + data fetch ──────────────────────────────────────────
  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      const isLocalAdmin = localStorage.getItem("elbella_admin_logged_in") === "true";

      if (!session && !isLocalAdmin) {
        router.push("/admin/login");
        return;
      }

      const email = session?.user?.email || localStorage.getItem("elbella_admin_email") || "";
      setAdminEmail(email);

      // Fetch categories first, then use the result in fetchProducts
      const cats = await fetchCategories();
      await Promise.all([fetchProducts(cats), fetchOrders()]);

      setLoading(false);
    }
    checkAuthAndFetch();
  }, [router]);

  const fetchCategories = async (): Promise<{ id: string; name: string }[]> => {
    try {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (!error && data) {
        const mapped = data.map((c: any) => ({ id: c.id.toString(), name: c.name }));
        setCategories(mapped);
        return mapped;
      }
    } catch (err) {
      // silent — categories optional
    }
    return [];
  };

  const fetchProducts = async (cats: { id: string; name: string }[]) => {
    try {
      const { data: prodData, error } = await supabase.from("products").select("*");
      if (!error && prodData) {
        const mapped: Product[] = prodData.map((p: any) => {
          const cat = cats.find((c) => c.id === p.category_id?.toString());
          return {
            id: p.id.toString(),
            title: p.title,
            description: p.description || "",
            price: p.price !== undefined && p.price !== null ? parseFloat(p.price) : 19.90,
            quantity: p.quantity !== undefined && p.quantity !== null ? parseInt(p.quantity) : 50,
            image_url: p.image_url || "",
            category_id: p.category_id?.toString() || "",
            category_name: cat ? cat.name : "Barbershop",
            specifications: p.specifications || {},
            tabs: p.tabs || {},
          };
        });
        setProducts(mapped);
      }
    } catch (err) {
      // silent
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        const mapped: Order[] = data.map((o: any) => ({
          id: o.id,
          created_at: o.created_at,
          customer_name: o.customer_name,
          customer_email: o.customer_email,
          customer_phone: o.customer_phone || "",
          shipping_address: o.shipping_address,
          shipping_city: o.shipping_city,
          shipping_zip: o.shipping_zip,
          total_amount: parseFloat(o.total_amount),
          status: o.status,
          items: o.items || [],
        }));
        setOrders(mapped);
        return;
      }
    } catch (err) {
      // silent
    }

    // Fallback: only localStorage mock orders (no hardcoded demo order)
    const localOrdersRaw = localStorage.getItem("elbella_mock_orders");
    if (localOrdersRaw) {
      try {
        const localOrders = JSON.parse(localOrdersRaw) as Order[];
        setOrders(localOrders.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } catch (_) {
        setOrders([]);
      }
    }
  };

  // ── Filtered products (search) ───────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const q = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.category_name || "").toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // ── Order actions ────────────────────────────────────────────────────
  const toggleOrder = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const markAsShipped = async (orderId: string) => {
    setShippingId(orderId);
    try {
      await supabase.from("orders").update({ status: "shipped" }).eq("id", orderId);
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, status: "shipped" } : ord))
      );
      // Update localStorage mock orders if present
      const raw = localStorage.getItem("elbella_mock_orders");
      if (raw) {
        try {
          const local = JSON.parse(raw) as Order[];
          localStorage.setItem(
            "elbella_mock_orders",
            JSON.stringify(local.map((o) => (o.id === orderId ? { ...o, status: "shipped" } : o)))
          );
        } catch (_) {}
      }
      showNotification("success", "Ordine segnato come spedito.");
    } catch (err: any) {
      showNotification("error", "Errore aggiornamento stato ordine.");
    } finally {
      setShippingId(null);
    }
  };

  // ── Product CRUD ──────────────────────────────────────────────────────
  const confirmDeleteProduct = (prodId: string, title: string) => {
    setDeleteConfirm({ id: prodId, title });
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirm) return;
    const { id: prodId } = deleteConfirm;
    setDeletingId(prodId);
    setDeleteConfirm(null);
    try {
      const { error } = await supabase.from("products").delete().eq("id", prodId);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== prodId));
      showNotification("success", "Prodotto eliminato con successo.");
    } catch (err: any) {
      showNotification("error", err.message || "Errore nell'eliminazione. Controlla le policy RLS.");
    } finally {
      setDeletingId(null);
    }
  };

  const openProductForm = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        title: product.title,
        description: product.description,
        price: product.price.toString(),
        quantity: product.quantity.toString(),
        image_url: product.image_url,
        category_id: product.category_id,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        title: "",
        description: "",
        price: "19.90",
        quantity: "50",
        image_url: "",
        category_id: categories[0]?.id || "",
      });
    }
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);

    const priceNum = parseFloat(productForm.price);
    const qtyNum = parseInt(productForm.quantity);

    if (isNaN(priceNum) || priceNum < 0) {
      showNotification("error", "Il prezzo deve essere un numero positivo.");
      setSavingProduct(false);
      return;
    }
    if (isNaN(qtyNum) || qtyNum < 0) {
      showNotification("error", "La quantità deve essere un numero positivo.");
      setSavingProduct(false);
      return;
    }

    const payload = {
      title: productForm.title.trim(),
      description: productForm.description.trim(),
      category_id: productForm.category_id,
      price: priceNum,
      quantity: qtyNum,
      image_url: productForm.image_url.trim(),
    };

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id);
        if (error) throw error;

        const selectedCat = categories.find((c) => c.id === productForm.category_id);
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct.id
              ? {
                  ...p,
                  ...payload,
                  category_name: selectedCat?.name || "Barbershop",
                  specifications: editingProduct.specifications,
                  tabs: editingProduct.tabs,
                }
              : p
          )
        );
        showNotification("success", "Prodotto aggiornato con successo.");
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;

        const selectedCat = categories.find((c) => c.id === productForm.category_id);
        setProducts((prev) => [
          {
            id: data.id.toString(),
            ...payload,
            category_name: selectedCat?.name || "Barbershop",
            specifications: {},
            tabs: {},
          },
          ...prev,
        ]);
        showNotification("success", "Nuovo prodotto aggiunto con successo.");
      }
      setProductModalOpen(false);
    } catch (err: any) {
      showNotification("error", err.message || "Errore nel salvataggio. Controlla le policy RLS.");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem("elbella_admin_logged_in");
    localStorage.removeItem("elbella_admin_email");
    router.push("/admin/login");
  };

  // ── Loading screen ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-gold-500 animate-spin mx-auto mb-4" />
          <p className="text-xs text-dark-muted uppercase tracking-widest">Caricamento Pannello...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ── Inline Notification ── */}
        {notification && (
          <div
            className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 border text-xs font-bold uppercase tracking-wider shadow-lg transition-all duration-300 max-w-sm ${
              notification.type === "success"
                ? "bg-green-950/90 border-green-700 text-green-300"
                : "bg-red-950/90 border-red-700 text-red-300"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 opacity-60 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Inline Delete Confirmation ── */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-dark-card border border-red-800/50 p-6 max-w-sm w-full shadow-lg">
              <div className="flex items-start gap-3 mb-5">
                <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-1">Conferma Eliminazione</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Stai per eliminare <span className="text-white font-semibold">"{deleteConfirm.title}"</span>. Questa azione è irreversibile.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="border border-dark-border text-gray-400 hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleDeleteProduct}
                  className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Elimina
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Admin Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-dark-border mb-8">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider">
              Pannello Amministrativo
            </h1>
            {adminEmail && (
              <p className="text-[10px] text-dark-muted mt-1 flex items-center gap-1.5">
                Accesso come: <span className="text-gold-400 font-bold font-mono">{adminEmail}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="border border-dark-border text-gray-400 hover:text-red-400 hover:border-red-800 px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors duration-300 flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Esci
          </button>
        </div>

        {/* ── Tab selector ── */}
        <div className="flex border-b border-dark-border mb-8 gap-6">
          {(["products", "orders"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs font-bold tracking-widest uppercase transition-all duration-300 border-b-2 flex items-center gap-2 ${
                activeTab === tab
                  ? "border-gold-500 text-gold-400"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              {tab === "products" ? <Package className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
              {tab === "products" ? `Prodotti (${products.length})` : `Ordini (${orders.length})`}
            </button>
          ))}
        </div>

        {/* ══════════════ TAB: PRODOTTI ══════════════ */}
        {activeTab === "products" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Cerca prodotto o categoria..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-dark-surface border border-dark-border px-3 py-2 pl-9 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                />
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-500" />
                {productSearch && (
                  <button
                    onClick={() => setProductSearch("")}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => openProductForm()}
                className="bg-gold-gradient text-black font-bold px-5 py-2.5 text-xs uppercase tracking-widest hover:opacity-90 shadow-gold-glow transition-all duration-300 flex items-center gap-1.5 flex-shrink-0"
              >
                <PlusCircle className="h-4 w-4" />
                Aggiungi Prodotto
              </button>
            </div>

            {productSearch && (
              <p className="text-[10px] text-dark-muted uppercase tracking-wider">
                {filteredProducts.length} risultat{filteredProducts.length === 1 ? "o" : "i"} per &quot;{productSearch}&quot;
              </p>
            )}

            <div className="overflow-x-auto border border-dark-border bg-dark-card">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-dark-border bg-dark-surface text-gray-400 uppercase tracking-widest text-[10px] font-bold">
                    <th className="py-3 px-5">Foto</th>
                    <th className="py-3 px-5">Nome Prodotto</th>
                    <th className="py-3 px-5">Categoria</th>
                    <th className="py-3 px-5 text-right">Prezzo</th>
                    <th className="py-3 px-5 text-right">Stock</th>
                    <th className="py-3 px-5 text-center">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-dark-muted">
                        {productSearch ? "Nessun prodotto trovato per questa ricerca." : "Nessun prodotto nel catalogo."}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod) => (
                      <tr key={prod.id} className="hover:bg-dark-surface/30 transition-colors">
                        <td className="py-3 px-5">
                          <div className="h-10 w-10 bg-dark-surface border border-dark-border overflow-hidden">
                            {prod.image_url ? (
                              <img src={prod.image_url} alt={prod.title} className="h-full w-full object-contain p-0.5" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[8px] text-dark-muted">N/D</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-5 font-semibold text-white max-w-xs truncate" title={prod.title}>
                          {prod.title}
                        </td>
                        <td className="py-3 px-5">
                          <span className="bg-dark-surface border border-dark-border px-2 py-0.5 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                            {prod.category_name}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right font-serif font-bold text-gold-400">
                          €{prod.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-5 text-right font-semibold">
                          <span className={prod.quantity <= 10 ? "text-red-400" : "text-white"}>
                            {prod.quantity} pz
                          </span>
                        </td>
                        <td className="py-3 px-5">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openProductForm(prod)}
                              className="p-1.5 text-dark-muted hover:text-gold-400 transition-colors"
                              title="Modifica"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => confirmDeleteProduct(prod.id, prod.title)}
                              disabled={deletingId === prod.id}
                              className="p-1.5 text-dark-muted hover:text-red-500 transition-colors disabled:opacity-40"
                              title="Elimina"
                            >
                              {deletingId === prod.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════ TAB: ORDINI ══════════════ */}
        {activeTab === "orders" && (
          <div className="space-y-5">
            <h2 className="text-sm font-bold tracking-wider uppercase text-white">
              Log Transazioni Ordini
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-20 bg-dark-card border border-dark-border">
                <ShoppingBag className="h-12 w-12 text-gold-800 mx-auto mb-4" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Nessun ordine ancora</h3>
                <p className="text-xs text-dark-muted mt-2">Gli ordini dei clienti appariranno qui una volta completato il pagamento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-dark-card border border-dark-border overflow-hidden hover:border-gold-800/30 transition-colors duration-300"
                  >
                    {/* Order summary row */}
                    <div
                      onClick={() => toggleOrder(order.id)}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-dark-surface/40 hover:bg-dark-surface cursor-pointer transition-colors"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 flex-grow text-xs">
                        <div>
                          <span className="text-[9px] text-dark-muted uppercase font-bold tracking-wider block mb-0.5">ID Ordine</span>
                          <span className="font-mono text-[10px] text-white font-bold break-all">{order.id.slice(0, 16)}…</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-dark-muted uppercase font-bold tracking-wider block mb-0.5">Data</span>
                          <span className="text-white">
                            {new Date(order.created_at).toLocaleDateString("it-IT", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-dark-muted uppercase font-bold tracking-wider block mb-0.5">Cliente</span>
                          <span className="text-white font-semibold">{order.customer_name}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-dark-muted uppercase font-bold tracking-wider block mb-0.5">Stato</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                            order.status === "shipped"
                              ? "bg-green-950/20 border-green-800 text-green-400"
                              : "bg-gold-950/20 border-gold-800 text-gold-400"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${order.status === "shipped" ? "bg-green-400" : "bg-gold-400"}`} />
                            {order.status === "shipped" ? "Spedito" : "Pagato"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t border-dark-border/40 sm:border-0">
                        <div className="text-right">
                          <span className="text-[9px] text-dark-muted uppercase font-bold tracking-wider block mb-0.5">Totale</span>
                          <span className="font-serif font-bold text-gold-gradient text-glow text-sm">
                            €{order.total_amount.toFixed(2)}
                          </span>
                        </div>
                        {expandedOrderId === order.id
                          ? <ChevronUp className="h-4 w-4 text-gray-500" />
                          : <ChevronDown className="h-4 w-4 text-gray-500" />
                        }
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expandedOrderId === order.id && (
                      <div className="p-5 border-t border-dark-border/60 bg-dark-card grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        {/* Delivery info */}
                        <div className="space-y-3">
                          <h4 className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-dark-border pb-2">
                            Dettagli Consegna
                          </h4>
                          <div className="space-y-1.5">
                            <div>
                              <span className="text-dark-muted">Email: </span>
                              <a href={`mailto:${order.customer_email}`} className="text-gold-400 hover:underline">
                                {order.customer_email}
                              </a>
                            </div>
                            <div>
                              <span className="text-dark-muted">Telefono: </span>
                              <span className="text-white">{order.customer_phone || "—"}</span>
                            </div>
                            <div className="mt-2">
                              <span className="text-dark-muted block mb-1">Indirizzo:</span>
                              <p className="text-white bg-dark-surface p-3 border border-dark-border leading-relaxed">
                                {order.customer_name}<br />
                                {order.shipping_address}<br />
                                {order.shipping_zip} {order.shipping_city}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Items + action */}
                        <div className="flex flex-col justify-between space-y-3">
                          <div>
                            <h4 className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-dark-border pb-2 mb-2">
                              Articoli Ordinati
                            </h4>
                            <div className="divide-y divide-dark-border/20">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-2">
                                  <div className="pr-3">
                                    <span className="text-white font-semibold block leading-snug">{item.title}</span>
                                    <span className="text-[10px] text-dark-muted">
                                      {item.quantity} × €{item.price.toFixed(2)}
                                    </span>
                                  </div>
                                  <span className="font-serif font-bold text-white whitespace-nowrap">
                                    €{(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-4 border-t border-dark-border/40 flex justify-end">
                            {order.status !== "shipped" ? (
                              <button
                                onClick={() => markAsShipped(order.id)}
                                disabled={shippingId === order.id}
                                className="bg-gold-gradient text-black font-bold px-5 py-2.5 text-xs uppercase tracking-widest hover:opacity-90 shadow-gold-glow transition-all duration-300 flex items-center gap-2 disabled:opacity-60"
                              >
                                {shippingId === order.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Truck className="h-4 w-4" />
                                )}
                                Segna come Spedito
                              </button>
                            ) : (
                              <div className="text-green-400 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-green-950/20 border border-green-800/40 px-4 py-2.5 text-xs">
                                <Check className="h-4 w-4" />
                                Spedizione Completata
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════ MODAL: ADD/EDIT PRODUCT ══════════════ */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-dark-card border border-gold-800/40 shadow-gold-glow-strong flex flex-col my-auto max-h-[92vh]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gold-gradient" />

            <button
              onClick={() => setProductModalOpen(false)}
              className="absolute top-4 right-4 z-20 p-1.5 border border-dark-border text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <form onSubmit={handleSaveProduct} className="p-7 space-y-5 overflow-y-auto">
              <h3 className="font-serif text-base font-bold text-white uppercase tracking-wider border-b border-dark-border pb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-gold-500" />
                {editingProduct ? "Modifica Prodotto" : "Aggiungi Nuovo Prodotto"}
              </h3>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Nome del Prodotto *
                </label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="es. Matte Pomade Extreme Tenuta"
                  className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Descrizione
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Descrivi caratteristiche e utilizzo..."
                  className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Prezzo (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm((p) => ({ ...p, price: e.target.value }))}
                    placeholder="19.90"
                    className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Quantità Stock *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={productForm.quantity}
                    onChange={(e) => setProductForm((p) => ({ ...p, quantity: e.target.value }))}
                    placeholder="50"
                    className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Categoria *
                  </label>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm((p) => ({ ...p, category_id: e.target.value }))}
                    className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-gray-300 focus:outline-none focus:border-gold-500 appearance-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    URL Immagine
                  </label>
                  <input
                    type="url"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm((p) => ({ ...p, image_url: e.target.value }))}
                    placeholder="https://esempio.com/foto.png"
                    className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-dark-border flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="border border-dark-border text-gray-400 hover:text-white px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="bg-gold-gradient text-black font-bold px-5 py-2.5 text-xs uppercase tracking-widest hover:opacity-90 shadow-gold-glow transition-all duration-300 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {savingProduct ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Salva Prodotto
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
