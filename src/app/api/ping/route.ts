import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Chiamato dal cron Vercel ogni giorno per tenere attivo il database Supabase.
// Supabase free tier mette in pausa i progetti dopo 7 giorni di inattività.
export async function GET(req: Request) {
  // Verifica che la chiamata venga da Vercel Cron (header segreto)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Query leggera: conta solo 1 riga dalla tabella categories
    const { error } = await supabase
      .from("categories")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: "Database attivo",
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
