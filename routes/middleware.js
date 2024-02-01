const users = require('../models/db/users.js');
const stripe = require('../models/stripe.js');

const getValidUser = async req => {
    const { username } = req.session;
    if (!username) return;
    const { error, user } = await users.getUser(username);
    if (error || !user) return;
    return user;
}

const getIsPaying = async username => {
    const { isPaying, error } = await stripe.getIsPayingMember(username);
    return isPaying && !error;
}

const validateVerifyEmailRoute = async (req, res, next) => {
    const validUser = await getValidUser(req);
    if (!validUser) return res.redirect('/');
    if (validUser.isAdmin) return res.redirect('/admin');
    if (validUser.emailVerified) return res.redirect('/products');
    next();
};

const validateCheckoutRoute = async (req, res, next) => {
    const validUser = await getValidUser(req);
    if (!validUser) return res.redirect('/');
    if (validUser.isAdmin) return res.redirect('/admin');
    if (!validUser.emailVerified) return res.redirect('/verify-email');
    const isPaying = await getIsPaying(validUser.username);
    if (isPaying) return res.redirect('/products');
    next();
};

const validateProductsRoute = async (req, res, next) => {
    const validUser = await getValidUser(req);
    if (!validUser) return res.redirect('/');
    if (validUser.isAdmin) return res.redirect('/admin');
    if (!validUser.emailVerified) return res.redirect('/verify-email');
    const isPaying = await getIsPaying(validUser.username);
    if (!isPaying) return res.redirect('/checkout');
    next();
};

const validateAdminRoute = async (req, res, next) => {
    const validUser = await getValidUser(req);
    if (!validUser) return res.redirect('/');
    if (!validUser.isAdmin) return res.redirect('/');
    next();
};

const validateSignUpRoute = async (req, res, next) => {
    const { username, email, password } = req.body;
    if (!(username && email && password)) {
        return res.redirect(`/sign-up?error=INSUFFICIENT_DETAILS`);
    }
    next();
};

const validateSignInRoute = async (req, res, next) => {
    const { username, password } = req.body;
    if (!(username && password)) {
        return res.redirect(`/sign-in?error=INSUFFICIENT_DETAILS`);
    }
    next();
};

const validateSendForgotPasswordRoute = async (req, res, next) => {
    const { email } = req.body;
    if (!email) return res.redirect('/reset-password?error=EMAIL_REQUIRED');
    const { user, error: fetchUserError } = await users.getUserWithEmail(email);
    if (fetchUserError) return res.redirect(`/reset-password?error=${fetchUserError}`);
    if (!user) return res.redirect('/reset-password?error=NO_USER_WITH_EMAIL');
    next();
}

module.exports = {
    validateVerifyEmailRoute, validateCheckoutRoute,
    validateProductsRoute, validateAdminRoute,
    validateSignUpRoute, validateSignInRoute,
    validateSendForgotPasswordRoute
};
