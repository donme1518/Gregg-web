// Vercel serverless function: POST /api/donate  { amount: <pesos> }
//
// Creates a PayMongo Checkout Session (QR Ph by default) and returns
// { checkout_url }, which the website redirects the donor to. The donor scans
// the QR Ph code with any bank or e-wallet app (GCash, Maya, BPI, BDO ...).
//
// Needs ONE server-side env var in Vercel (NOT prefixed with VITE_, and kept as
// type "Secret"):
//   PAYMONGO_SECRET_KEY   sk_test_... (testing) or sk_live_... (real money)
//
// Optional env vars:
//   SITE_URL         e.g. https://gregg-web.vercel.app  (defaults to this request's host)
//   DONATE_METHODS   comma list, default "qrph" (QR Ph only). Add more, e.g.
//                    "qrph,gcash", only if they're activated in your PayMongo
//                    dashboard.

const MIN_PESOS = 20;
const MAX_PESOS = 50000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.PAYMONGO_SECRET_KEY;

  if (!secretKey) {
    console.error("PAYMONGO_SECRET_KEY is not set");
    return res.status(500).json({ error: "Donations are not configured" });
  }

  // Vercel parses JSON bodies for us; handle a raw string just in case.
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const pesos = Math.floor(Number(body?.amount));

  if (!Number.isFinite(pesos) || pesos < MIN_PESOS || pesos > MAX_PESOS) {
    return res
      .status(400)
      .json({ error: `Amount must be ₱${MIN_PESOS} – ₱${MAX_PESOS}` });
  }

  const siteUrl = (
    process.env.SITE_URL || `https://${req.headers.host}`
  ).replace(/\/$/, "");

  const methods = (process.env.DONATE_METHODS || "qrph")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  try {
    // /v2 is the Checkout Session version PayMongo recommends for new integrations.
    const response = await fetch("https://api.paymongo.com/v2/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // PayMongo uses HTTP Basic auth: secret key as username, empty password.
        Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            description: "Donation to Gregg Dictionary",
            line_items: [
              {
                name: "Donation to Gregg Dictionary",
                description: "Thank you for supporting the project!",
                currency: "PHP",
                amount: pesos * 100, // PayMongo uses centavos
                quantity: 1,
              },
            ],
            payment_method_types: methods,
            success_url: `${siteUrl}/?donation=success#donate`,
            cancel_url: `${siteUrl}/?donation=cancelled#donate`,
            metadata: { source: "gregg-web-donation" },
          },
        },
      }),
    });

    const json = await response.json().catch(() => ({}));
    const checkoutUrl = json?.data?.attributes?.checkout_url;

    if (!response.ok || !checkoutUrl) {
      console.error("PayMongo error:", response.status, JSON.stringify(json));
      return res.status(502).json({ error: "Couldn't create the checkout" });
    }

    return res.status(200).json({ checkout_url: checkoutUrl });
  } catch (error) {
    console.error("PayMongo request failed:", error);
    return res.status(502).json({ error: "Couldn't reach PayMongo" });
  }
}