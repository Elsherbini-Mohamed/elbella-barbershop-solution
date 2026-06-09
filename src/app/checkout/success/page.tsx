"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { CheckCircle2, Scissors, Calendar, MapPin, Package, ArrowRight, Loader2, AlertCircle } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const apiCalled = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setError("Session ID mancante. Transazione non valida.");
      setLoading(false);
      return;
    }

    // Call success API only once
    if (apiCalled.current) return;
    apiCalled.current = true;

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/checkout/success?session_id=${sessionId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Errore nella verifica dell'ordine.");
        }

        if (data.success) {
          setOrder(data.order);
          setLoading(false);
          clearCart(); // Safe to clear cart now!

          // Fire confetti celebration dynamically to avoid SSR errors
          const confetti = (await import("canvas-confetti")).default;
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#D4AF37", "#FFFFFF", "#C5A880", "#1A1A1A"]
          });

          // Continuous small bursts
          const duration = 2 * 1000;
          const end = Date.now() + duration;

          (function frame() {
            confetti({
              particleCount: 3,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ["#D4AF37", "#FFFFFF"]
            });
            confetti({
              particleCount: 3,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ["#D4AF37", "#FFFFFF"]
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Errore durante la convalida della transazione.");
        setLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId, clearCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-dark-card border border-dark-border p-12 text-center max-w-md w-full shadow-gold-glow">
          <Loader2 className="h-10 w-10 text-gold-500 animate-spin mx-auto mb-6" />
          <h2 className="font-serif text-lg font-bold text-white uppercase tracking-wider">
            Verifica Pagamento in Corso
          </h2>
          <p className="text-xs text-dark-muted mt-3 leading-relaxed">
            Stiamo convalidando in modo sicuro la transazione con Stripe e preparando la ricevuta digitale del tuo ordine. Attendi un momento...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-dark-card border border-red-900/60 p-12 text-center max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-6" />
          <h2 className="font-serif text-lg font-bold text-white uppercase tracking-wider">
            Errore di Convalida
          </h2>
          <p className="text-xs text-red-400 mt-3 leading-relaxed bg-red-950/20 p-3 border border-red-900/40">
            {error}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/"
              className="bg-dark-surface border border-dark-border text-gray-400 hover:text-white font-bold py-3 text-xs uppercase tracking-widest transition-colors duration-300"
            >
              Torna alla Home
            </Link>
            <Link
              href="/carrello"
              className="bg-gold-gradient text-black font-bold py-3.5 text-xs uppercase tracking-widest hover:opacity-90 transition-all duration-300"
            >
              Riprova Checkout
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="bg-dark-card border border-gold-800/40 p-8 sm:p-12 shadow-gold-glow relative overflow-hidden text-center sm:text-left">
          {/* Top aesthetic border line */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gold-gradient" />

          {/* Success Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-8 border-b border-dark-border/60">
            <CheckCircle2 className="h-16 w-16 text-gold-500 flex-shrink-0 animate-pulse" />
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-800 bg-gold-950/20 px-3 py-1 text-[10px] font-bold text-gold-400 uppercase tracking-widest mb-2">
                ✓ Transazione Approvata
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider">
                Grazie per il Tuo Ordine!
              </h1>
              <p className="text-xs text-dark-muted mt-1">
                Il tuo pagamento è andato a buon fine. Riceverai presto un'email con i dettagli della spedizione.
              </p>
            </div>
          </div>

          {/* Order Details Grid */}
          <div className="py-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-left border-b border-dark-border/60">
            <div className="space-y-4">
              <div className="flex items-start gap-2.5">
                <Package className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-400 uppercase tracking-wider">Riferimento Ordine</h4>
                  <p className="text-white font-mono mt-1 font-semibold break-all text-[11px]">{order?.id}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-400 uppercase tracking-wider">Data di Acquisto</h4>
                  <p className="text-white mt-1">
                    {order?.created_at ? new Date(order.created_at).toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    }) : new Date().toLocaleDateString("it-IT", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-gold-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-gray-400 uppercase tracking-wider">Indirizzo di Spedizione</h4>
                  <p className="text-white mt-1 leading-normal">
                    {order?.customer_name}<br />
                    {order?.shipping_address}<br />
                    {order?.shipping_zip} - {order?.shipping_city}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="py-8 text-left border-b border-dark-border/60">
            <h3 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Scissors className="h-4 w-4 text-gold-500" />
              <span>Prodotti Acquistati</span>
            </h3>

            <div className="space-y-3">
              {order?.items?.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-xs py-2 border-b border-dark-border/20">
                  <div className="min-w-0 pr-4">
                    <p className="text-white font-semibold truncate leading-normal">{item.title}</p>
                    <p className="text-[10px] text-dark-muted mt-0.5">Quantità: {item.quantity}</p>
                  </div>
                  <div className="font-serif font-bold text-white whitespace-nowrap">
                    €{(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Paid Display */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-dark-border/40 text-sm font-bold">
              <span className="text-white uppercase tracking-wider">Totale Transazione (EUR)</span>
              <span className="text-gold-gradient text-glow text-lg font-serif">€{order?.total_amount?.toFixed(2)}</span>
            </div>
          </div>

          {/* Button actions */}
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="text-xs text-dark-muted text-center sm:text-left leading-normal max-w-sm">
              ℹ️ Abbiamo inviato una copia della ricevuta digitale e il codice di tracking alla tua casella email.
            </div>
            <Link
              href="/"
              className="bg-gold-gradient text-black font-bold px-8 py-4 text-xs uppercase tracking-widest hover:opacity-90 shadow-gold-glow hover:shadow-gold-glow-strong transition-all duration-300 flex items-center gap-2"
            >
              <span>Torna allo Store</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-dark-card border border-dark-border p-12 text-center max-w-md w-full shadow-gold-glow">
          <Loader2 className="h-10 w-10 text-gold-500 animate-spin mx-auto mb-6" />
          <h2 className="font-serif text-lg font-bold text-white uppercase tracking-wider">
            Inizializzazione Ricevuta
          </h2>
          <p className="text-xs text-dark-muted mt-3 leading-relaxed">
            Stiamo preparando i dettagli del tuo ordine. Attendi...
          </p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

