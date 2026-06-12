import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID mancante" }, { status: 400 });
  }

  try {
    // 1. Retrieve the session from Stripe to verify payment
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Pagamento non completato" }, { status: 400 });
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_zip,
      items: itemsString,
    } = session.metadata || {};

    const items = itemsString ? JSON.parse(itemsString) : [];

    // 2. Check if the order is already in Supabase to avoid double entry
    const { data: existingOrder, error: checkError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();

    if (existingOrder) {
      console.log("[~] Ordine già presente nel database per questa sessione. Ritorno i dati dell'ordine.");
      return NextResponse.json({ success: true, order: existingOrder, alreadyProcessed: true });
    }

    // 3. Save order to Supabase
    // If the database has not been migrated (i.e. 'orders' table is missing), we catch the error gracefully
    let savedOrder = null;
    let orderId = sessionId.substring(0, 12); // Fallback order ID
    
    try {
      const orderPayload = {
        customer_name: customer_name || "Cliente Elbella",
        customer_email: customer_email || "cliente@elbella.it",
        customer_phone: customer_phone || "",
        shipping_address: shipping_address || "Indirizzo",
        shipping_city: shipping_city || "Città",
        shipping_zip: shipping_zip || "CAP",
        total_amount: (session.amount_total || 0) / 100, // Convert cents to Euros
        status: "paid",
        items: items,
        stripe_session_id: sessionId,
      };

      const { data: insertedOrder, error: insertError } = await supabaseAdmin
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (insertError) {
        console.error("[!] Errore nell'inserimento dell'ordine su Supabase:", insertError);
        throw insertError;
      }

      savedOrder = insertedOrder;
      orderId = insertedOrder.id;
      console.log("[+] Ordine salvato su Supabase. ID:", orderId);

      // 4. Decrement Stock Quantity
      for (const item of items) {
        try {
          const { data: prod, error: fetchError } = await supabaseAdmin
            .from("products")
            .select("quantity")
            .eq("id", item.id)
            .maybeSingle();

          if (!fetchError && prod && prod.quantity !== undefined && prod.quantity !== null) {
            const newQty = Math.max(0, prod.quantity - item.quantity);
            await supabaseAdmin
              .from("products")
              .update({ quantity: newQty })
              .eq("id", item.id);
            console.log(`  [*] Stock decrementato per ${item.title}: ${prod.quantity} -> ${newQty}`);
          }
        } catch (stockErr) {
          console.error(`  [!] Errore decremento stock per prodotto ${item.id}:`, stockErr);
        }
      }
    } catch (dbErr) {
      console.warn("[!] La tabella 'orders' o le colonne necessarie non sono disponibili nel database. Il checkout proseguirà comunque senza salvare nel DB.");
    }

    // 5. Send Telegram Notification — SOLO se l'ordine è appena stato salvato
    // (previene notifiche duplicate su refresh della success page)
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (savedOrder && botToken && chatId && !botToken.includes("placeholder") && !chatId.includes("123456789")) {
      try {
        // Construct the item list text
        const itemsListText = items
          .map((item: any) => `• ${item.title} x${item.quantity} - €${(item.price * item.quantity).toFixed(2)}`)
          .join("\n");

        const totalPayed = ((session.amount_total || 0) / 100).toFixed(2);

        const telegramMessage = `🛒 <b>NUOVO ORDINE CONFERMATO! #Elbella</b>

📦 <b>Ordine:</b> <code>${orderId}</code>
👤 <b>Cliente:</b> ${customer_name}
📧 <b>Email:</b> ${customer_email}
📞 <b>Telefono:</b> ${customer_phone || 'N/D'}
📍 <b>Indirizzo:</b> ${shipping_address}, ${shipping_city} (CAP ${shipping_zip})

🛍️ <b>Prodotti Ordinati:</b>
${itemsListText}

💰 <b>Totale Pagato:</b> €${totalPayed}`;

        const tgUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const res = await fetch(tgUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
            parse_mode: "HTML",
          }),
        });

        if (!res.ok) {
          const resErr = await res.text();
          console.error("[!] Errore API Telegram:", resErr);
        } else {
          console.log("[+] Notifica Telegram inviata con successo!");
        }
      } catch (tgErr) {
        console.error("[!] Impossibile inviare la notifica Telegram:", tgErr);
      }
    } else {
      console.log("[~] Token o Chat ID Telegram non configurati o ancora impostati come placeholder. Notifica saltata.");
    }

    return NextResponse.json({
      success: true,
      order: savedOrder || {
        id: orderId,
        customer_name: customer_name,
        total_amount: (session.amount_total || 0) / 100,
        items: items,
      },
    });
  } catch (error: any) {
    console.error("Success verification endpoint error:", error);
    return NextResponse.json({ error: error.message || "Errore durante la verifica dell'ordine" }, { status: 500 });
  }
}
