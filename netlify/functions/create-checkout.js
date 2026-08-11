import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  try {
    const { userId, entriesTotal = 0, entriesCount = 0, campingTotal = 0, paymentRef, origin } = JSON.parse(event.body || "{}");
    const total = entriesTotal + campingTotal;

    if (!userId || total <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Nothing to charge." }) };
    }

    const description = [
      entriesCount ? `${entriesCount} ${entriesCount === 1 ? "entry" : "entries"}` : null,
      campingTotal ? "Camping/Yards" : null,
    ].filter(Boolean).join(" + ") || "Show fees";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: userId,
      line_items: [{
        price_data: {
          currency: "aud",
          unit_amount: Math.round(total * 100),
          product_data: {
            name: `Warrego Park Show — ${description}`,
            description: `Payment ref: ${paymentRef || userId}`,
          },
        },
        quantity: 1,
      }],
      metadata: { userId, paymentRef: paymentRef || "" },
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
