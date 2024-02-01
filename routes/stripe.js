const stripe = require('../models/stripe.js');
const express = require('express');
const router = express.Router();

router.post('/create-checkout-session', async (req, res) => {
    const { session, error } = await stripe.createCheckoutSession(req.session.username);
    if (error) return res.redirect(`/?error=${error}`);
    if (!session?.url) return res.redirect('/?error=STRIPE_ERROR');
    res.redirect(session.url);
});


module.exports = router;
