const express = require('express');
const router = express.Router();
const middleware = require('./middleware.js');
const users = require('../models/db/users.js');
const products = require('../models/db/products.js');
const stripe = require('../models/stripe.js');
const { handleSendEmail } = require('../models/utils.js');

// GET requests
router.get('/', (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('index', { error, message, loggedIn });
});

router.get('/sign-in', (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('sign-in', { error, message, loggedIn });
});

router.get('/sign-up', (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('sign-up', { error, message, loggedIn });
});

router.get('/verify-email', middleware.validateVerifyEmailRoute, async (req, res) => {
    const queryError = req.query.error;
    let message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    const { error: sendError } = await handleSendEmail(req.session.username);
    const error = queryError ? queryError : sendError;
    if (!error && !message) message = 'EMAIL_SENT';
    res.render('verify-email', { error, message, loggedIn });
});

router.get('/checkout', middleware.validateCheckoutRoute, (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('checkout', { error, message, loggedIn });
});

router.get('/products', middleware.validateProductsRoute, async (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const { error: productsError, products: p } = await products.getProducts();
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('products', {
        error: error ? error : productsError, products: p,
        message, loggedIn
    });
});

router.get('/admin', middleware.validateAdminRoute, async (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const { error: productsError, products: p } = await products.getProducts();
    const { error: subscriptionsError, subscriptions } = await stripe.getActiveSubscriptions();
    const totalError = error ? error : (
        productsError ? productsError : subscriptionsError
    );
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('admin', {
        error: totalError, products: p, subscriptions, message, loggedIn
    });
});

router.get('/reset-password', (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('reset-password', { error, message, loggedIn });
});


// Footer Pages
router.get('/terms-of-service', (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('terms-of-service', { error, message, loggedIn });
});

router.get('/contact', (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('contact', { error, message, loggedIn });
});

router.get('/refund-policy', (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('refund-policy', { error, message, loggedIn });
});

router.get('/privacy-policy', (req, res) => {
    const error = req.query.error;
    const message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;
    res.render('privacy-policy', { error, message, loggedIn });
});


// POST requests
router.post('/sign-up', middleware.validateSignUpRoute, async (req, res) => {
    const { username, email, password } = req.body;

    // Register Stripe Customer
    let stripeError;
    const { customer, error: registerError } = await stripe.registerNewCustomer(username, email);
    if (!customer?.id) stripeError = 'STRIPE_ERROR';
    if (registerError) stripeError = registerError;
    if (stripeError) return res.redirect(`/sign-up?error=${stripeError}`);

    // Create New User
    let dbError;
    const { error: createError, user } = await users.createUser(
        username, email, password, customer.id
    );
    if (!user) dbError = 'DB_ERROR';
    if (createError) dbError = createError;
    if (dbError) return res.redirect(`/sign-up?error=${dbError}`);

    req.session.username = username;
    res.redirect(`/products`);
});

router.post('/sign-in', middleware.validateSignInRoute, async (req, res) => {
    const { username, password } = req.body;
    const { error, user } = await users.getIsValidLogin(username, password);
    if (error) return res.redirect(`/sign-in?error=${error}`);
    if (!user) return res.redirect(`/sign-in?error=SIGN_IN_ERROR`);
    req.session.username = username;
    res.redirect('/products');
});

router.post('/sign-out', (req, res) => {
    req.session.username = null;
    res.redirect('/');
});

router.post('/delete-account', async (req, res) => {
    const { error: stripeError } = await stripe.deleteCustomerSubscriptions(req.session.username);
    if (stripeError) return res.redirect(`/products?error=${stripeError}`);
    const { error: dbError } = users.deleteUser(req.session.username);
    if (dbError) return res.redirect(`/products?error=${dbError}`);
    req.session.username = null;
    res.redirect('/');
});

module.exports = router;
