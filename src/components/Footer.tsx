import React from "react";
import { Scissors } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-dark border-t border-dark-border mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-gold-500" />
            <span className="font-serif text-lg font-bold tracking-widest text-gold-gradient text-glow uppercase">
              Elbella
            </span>
          </div>

          {/* Copyright & Info */}
          <p className="text-xs text-dark-muted text-center sm:text-left">
            &copy; {new Date().getFullYear()} Elbella Barbershop. Tutti i diritti riservati.
          </p>

          {/* Clean minimal links with elegant underline animations */}
          <div className="flex gap-6 text-xs text-dark-muted">
            <a href="#" className="hover:text-white transition-colors duration-300 relative group">
              <span>Privacy Policy</span>
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#" className="hover:text-white transition-colors duration-300 relative group">
              <span>Termini di Servizio</span>
              <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gold-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
