import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const SUPABASE_URL = "https://gtrrqsnesloxowlzrloc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cnJxc25lc2xveG93bHpybG9jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MTQwMDAsImV4cCI6MjA5ODM5MDAwMH0.ZHmR-e1fY1Ctsb2ZhZxyXDaM70D9ssLACFQykV4YD_U";

export const handler = async (event) => {
  const sig = event.headers["stripe-signature"];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object;
    const userId = session.client_reference_id;
    if (userId) {
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "Prefer": "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify({
            user_id: userId,
            paid: true,
            status: "confirmed",
            paid_at: new Date().toISOString(),
          }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error("Supabase update failed:", res.status, text);
          return { statusCode: 500, body: "Failed to record payment" };
        }
      } catch (err) {
        console.error("Failed to update Supabase payment:", err);
        return { statusCode: 500, body: "Failed to record payment" };
      }
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
