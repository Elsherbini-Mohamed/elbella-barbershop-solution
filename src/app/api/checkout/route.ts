import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16" as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { cart, shippingInfo } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ error: "Il carrello è vuoto" }, { status: 400 });
    }

    if (!shippingInfo) {
      return NextResponse.json({ error: "Informazioni di spedizione mancanti" }, { status: 400 });
    }

    // Determine the base URL dynamically based on headers if APP_URL is not set
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Build line items for Stripe
    const lineItems = cart.map((item: any) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.title,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round(item.price * 100), // Cents
      },
      quantity: item.quantity,
    }));

    // Add shipping cost if total < 50
    const cartTotal = cart.reduce((tot: number, item: any) => tot + item.price * item.quantity, 0);
    if (cartTotal < 50) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Spedizione Standard Espresso",
            description: "Corriere espresso rapido 24/48h",
          },
          unit_amount: 590, // €5.90
        },
        quantity: 1,
      });
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/carrello`,
      customer_email: shippingInfo.email,
      metadata: {
        customer_name: shippingInfo.name,
        customer_email: shippingInfo.email,
        customer_phone: shippingInfo.phone,
        shipping_address: shippingInfo.address,
        shipping_city: shippingInfo.city,
        shipping_zip: shippingInfo.zip,
        items: JSON.stringify(
          cart.map((item: any) => ({
            id: item.id,
            title: item.title.slice(0, 60), // truncate long titles
            price: item.price,
            quantity: item.quantity,
            // image_url omessa: le URL Supabase superano il limite 500 char di Stripe
          }))
        ),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe session creation error:", error);
    return NextResponse.json(
      { error: error.message || "Errore durante la creazione della sessione di pagamento" },
      { status: 500 }
    );
  }
}
