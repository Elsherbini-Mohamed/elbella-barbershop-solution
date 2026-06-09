"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ChevronLeft, CreditCard, Shield, Lock, Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const { cart, cartTotal } = useCart();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  });

  useEffect(() => {
    if (cart.length === 0) {
      router.push("/carrello");
    }
  }, [cart, router]);

  const shippingCost = cartTotal >= 50 ? 0 : 5.90;
  const grandTotal = cartTotal + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!form.name || !form.email || !form.address || !form.city || !form.zip) {
      setError("Si prega di compilare tutti i campi obbligatori.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, shippingInfo: form }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Qualcosa è andato storto. Riprova.");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL di pagamento non ricevuto.");
      }
    } catch (err: any) {
      setError(err.message || "Impossibile avviare il pagamento. Riprova più tardi.");
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 sm:py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Header compatto */}
        <div className="mb-6">
          <Link
            href="/carrello"
            className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-gold-400 hover:text-gold-300 transition-colors duration-300 group"
          >
            <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform duration-300" />
            Torna al Carrello
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider mt-2">
            Spedizione &amp; Pagamento
          </h1>
          <p className="text-[11px] text-dark-muted mt-1">
            Inserisci i dettagli di spedizione per completare la transazione sicura su Stripe.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-950/20 border border-red-900 text-red-400 text-xs">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Form spedizione + pagamento */}
          <div className="lg:col-span-3 bg-dark-card border border-dark-border p-6">
            <h2 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-5 pb-2 border-b border-dark-border">
              1. Dati di Consegna
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Nome e Cognome *
                  </label>
                  <input
                    type="text" id="name" name="name" required
                    value={form.name} onChange={handleChange}
                    placeholder="es. Marco Rossi"
                    className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Indirizzo Email *
                  </label>
                  <input
                    type="email" id="email" name="email" required
                    value={form.email} onChange={handleChange}
                    placeholder="es. marco@gmail.com"
                    className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="phone" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Telefono / Cellulare *
                  </label>
                  <input
                    type="tel" id="phone" name="phone" required
                    value={form.phone} onChange={handleChange}
                    placeholder="es. 3471234567"
                    className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Indirizzo di Spedizione *
                  </label>
                  <input
                    type="text" id="address" name="address" required
                    value={form.address} onChange={handleChange}
                    placeholder="es. Via Roma 12"
                    className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <div className="col-span-2">
                  <label htmlFor="city" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Città *
                  </label>
                  <input
                    type="text" id="city" name="city" required
                    value={form.city} onChange={handleChange}
                    placeholder="es. Roma"
                    className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="zip" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    C.A.P. *
                  </label>
                  <input
                    type="text" id="zip" name="zip" required
                    value={form.zip} onChange={handleChange}
                    placeholder="00100"
                    className="w-full bg-dark-surface border border-dark-border px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
                  />
                </div>
              </div>

              {/* Sezione pagamento */}
              <div className="border-t border-dark-border pt-5 mt-2 space-y-3">
                <h2 className="font-serif text-sm font-bold text-white uppercase tracking-wider">
                  2. Pagamento Sicuro
                </h2>
                <p className="text-[10px] text-dark-muted leading-relaxed">
                  Sarai reindirizzato sulla pagina ufficiale di Stripe per pagare con carta di credito, prepagata o wallet digitali.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-gradient text-black font-bold py-3.5 text-xs uppercase tracking-widest hover:opacity-90 shadow-gold-glow hover:shadow-gold-glow-strong transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Inizializzazione Pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Paga Ora con Stripe
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Colonna destra — sticky */}
          <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-24">

            {/* Riepilogo ordine */}
            <div className="bg-dark-surface border border-dark-border p-5">
              <h2 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 pb-3 border-b border-dark-border">
                Riepilogo dell&apos;Ordine
              </h2>

              <div className="max-h-56 overflow-y-auto space-y-3 pr-1 mb-4 scrollbar-none">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="h-11 w-11 flex-shrink-0 bg-dark-surface border border-dark-border overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-contain p-0.5" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-dark-muted">N/D</div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-[11px] text-white font-semibold truncate">{item.title}</p>
                      <p className="text-[9px] text-dark-muted mt-0.5">Qtà: {item.quantity}</p>
                    </div>
                    <div className="text-xs font-serif font-bold text-white whitespace-nowrap">
                      €{(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 border-t border-dark-border/60 pt-4 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Totale Prodotti</span>
                  <span className="text-white">€{cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Spedizione</span>
                  {shippingCost === 0 ? (
                    <span className="text-green-400 font-semibold text-[10px] uppercase">Gratuita</span>
                  ) : (
                    <span className="text-white">€{shippingCost.toFixed(2)}</span>
                  )}
                </div>
                <div className="border-t border-dark-border/60 pt-3 flex justify-between font-bold">
                  <span className="text-white uppercase tracking-wider text-xs">Totale da Pagare</span>
                  <span className="text-gold-gradient text-glow text-sm font-serif">€{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Badge fiducia */}
            <div className="bg-dark-card border border-dark-border p-4 space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <Lock className="h-4 w-4 text-gold-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-[11px]">Transazione Protetta</h4>
                  <p className="text-dark-muted mt-0.5 leading-normal text-[10px]">
                    Connessione crittografata SSL 256 bit. Le tue informazioni non risiedono sui nostri server.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-dark-border/40 pt-3">
                <Shield className="h-4 w-4 text-gold-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white text-[11px]">Garanzia Elbella</h4>
                  <p className="text-dark-muted mt-0.5 leading-normal text-[10px]">
                    Prodotti originali al 100%, controllati a mano e spediti in imballaggi premium.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
