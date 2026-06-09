"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, Key, Loader2, Scissors } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      const isLocalAdmin = localStorage.getItem("elbella_admin_logged_in") === "true";
      if (session || isLocalAdmin) router.push("/admin");
    }
    checkUser();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Inserisci email e password.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (!authError && data.session) {
        router.push("/admin");
        return;
      }

      setError("Credenziali non valide. Controlla email e password e riprova.");
    } catch (err: any) {
      setError(err.message || "Errore sconosciuto durante il login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-20 px-4">
      {/* Brand logo */}
      <div className="flex items-center gap-2 mb-8">
        <Scissors className="h-6 w-6 text-gold-500" />
        <span className="font-serif text-2xl font-bold tracking-widest text-gold-gradient text-glow uppercase">
          Elbella Admin
        </span>
      </div>

      <div className="w-full max-w-md bg-dark-card border border-dark-border p-8 sm:p-10 shadow-gold-glow relative">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gold-gradient" />

        <h2 className="font-serif text-xl font-bold text-white uppercase tracking-wider text-center mb-1">
          Area Riservata
        </h2>
        <p className="text-[10px] text-dark-muted uppercase tracking-widest text-center mb-8">
          Accesso riservato all&apos;amministratore
        </p>

        {error && (
          <div className="mb-6 p-3.5 bg-red-950/20 border border-red-900 text-red-400 text-xs">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Indirizzo Email
            </label>
            <div className="relative">
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@elbella.it"
                className="w-full bg-dark-surface border border-dark-border px-4 py-3 pl-11 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
              />
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-surface border border-dark-border px-4 py-3 pl-11 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors"
              />
              <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-gradient text-black font-bold py-3.5 text-xs uppercase tracking-widest hover:opacity-90 shadow-gold-glow hover:shadow-gold-glow-strong transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Autenticazione...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Accedi al Pannello
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
