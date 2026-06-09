import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Elbella | Prodotti Premium per Barbiere & Barbershop",
  description: "Scopri la selezione esclusiva di prodotti per barbiere firmata Elbella. Cere, pomate, lozioni e trattamenti premium con accenti d'oro per uno stile impeccabile.",
  keywords: "barbiere, barbershop, pomate, cere capelli, cura barba, Elbella, prodotti barbiere premium",
  authors: [{ name: "Elbella Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${outfit.variable} ${playfair.variable}`}>
      <body className="bg-background text-foreground font-sans min-h-screen flex flex-col antialiased">
        <CartProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
