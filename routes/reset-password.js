const express = require('express');
const router = express.Router();
const middleware = require('./middleware.js');
const users = require('../models/db/users.js');
const tokens = require('../models/db/verify-tokens.js');
const mailer = require('../models/mailer.js');

router.post('/send-email', middleware.validateSendForgotPasswordRoute, async (req, res) => {
    const { email } = req.body;

    const { user, error: fetchUserError } = await users.getUserWithEmail(email);
    if (fetchUserError) return res.redirect(`/reset-password?error=${fetchUserError}`);

    const { token, error: createTokenError } = await tokens.createToken(user.username, "reset-password");
    if (createTokenError) return res.redirect(`/reset-password?error=${createTokenError}`);
    if (!token) return res.redirect('/reset-password?error=DB_ERROR');

    const { error: mailError } = await mailer.sendResetPasswordEmail(email, token._id);
    if (mailError) return res.redirect(`/reset-password?error=${mailError}`);

    res.redirect('/reset-password?message=EMAIL_SENT');
});

router.post('/set', async (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) return res.redirect('/reset-password?error=INVALID_PASSWORD_CHANGE');

    const { error, existingToken } = await tokens.getTokenExists(token, 'reset-password');
    if (error) return res.redirect(`/reset-password?error=${error}`);
    if (!existingToken) return res.redirect('/reset-password?error=INVALID_VERIFICATION_LINK');

    const { error: setPasswordError } = await users.setPassword(existingToken.username, password);
    if (setPasswordError) return res.redirect(`/reset-password?${setPasswordError}`);

    const { error: deleteTokenError } = await tokens.deleteToken(token);
    if (deleteTokenError) return res.redirect(`/reset-password?error=${deleteTokenError}`);

    res.redirect('/?message=PASSWORD_RESET');
});

router.get('/verify', async (req, res) => {
    const token = req.query.token;
    if (!token) return res.redirect('/reset-password?error=INVALID_VERIFICATION_LINK');

    const { error, existingToken } = await tokens.getTokenExists(token, 'reset-password');
    if (error) return res.redirect(`/reset-password?error=${error}`);
    if (!existingToken) return res.redirect('/reset-password?error=INVALID_VERIFICATION_LINK');

    const queryError = req.query.error;
    const message = req.query.message;
    const loggedIn = req.session.username !== undefined && req.session.username !== null;

    res.render('new-password', { token, error: queryError, message, loggedIn });
})

module.exports = router;
