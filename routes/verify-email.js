const express = require('express');
const router = express.Router();
const middleware = require('./middleware.js');
const tokens = require('../models/db/verify-tokens.js');
const users = require('../models/db/users.js');

router.get('/verify', async (req, res) => {
    const token = req.query.token;
    if (!token) return res.redirect('/verify-email?error=INVALID_VERIFICATION_LINK');
    const { error: validationError, existingToken } = await tokens.getTokenExists(token, "verify-email");
    if (validationError || !existingToken) return res.redirect('/verify-email?error=INVALID_VERIFICATION_LINK');
    const username = existingToken.username;
    const { error: deleteTokenError } = await tokens.deleteToken(token);
    if (deleteTokenError) return res.redirect(`/verify-email?error=${deleteTokenError}`);
    const { error: usersError } = await users.verifyEmail(username);
    if (usersError) return res.redirect('/verify-email?error=DB_ERROR');
    req.session.username = username;
    res.redirect('/products')
});

module.exports = router;
