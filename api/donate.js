// POST /api/donate
// Body: { amount: number } — dollars (e.g. 5)
// Returns: { url: string } — redirect to Stripe Checkout
//
// Use a restricted key (rk_ prefix) for production — set STRIPE_SECRET_KEY in Vercel env vars.

const Stripe = require('stripe');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-05-27.dahlia',
  });

  try {
    const { amount } = req.body ?? {};

    const parsed = Number(amount);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 1000) {
      return res.status(400).json({
        error: 'Amount must be a whole number between 1 and 1000.',
      });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: parsed * 100,
            product_data: {
              name: 'Fox Rehabilitation Fund 🦊',
              description:
                "Help De'Aaron Fox practice his dribbling and avoid Game 4 meltdowns",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/success.html?amount={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cancel.html`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[donate] Stripe error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};
