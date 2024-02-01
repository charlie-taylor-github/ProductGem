const express = require('express');
const multer = require('multer');
const products = require('../models/db/products.js');
const middleware = require('./middleware.js');
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/create', middleware.validateAdminRoute, upload.single('image'), async (req, res) => {
    const {
        title, description,
        aliExpressUrl, tikTokUrl
    } = req.body;
    const validRequest = (
        title && description &&
        aliExpressUrl && tikTokUrl &&
        req.file
    );
    if (!validRequest) return res.redirect('/admin?error=INSUFFICIENT_DETAILS');
    const { error, product } = await products.createProduct(
        title, description, aliExpressUrl, tikTokUrl, req.file
    );
    if (error) return res.redirect(`/admin?error=${error}`);
    if (!product) return res.redirect('/admin?error=CREATE_PRODUCT_ERROR');
    res.redirect('/admin');
});

router.post('/delete/:productId', middleware.validateAdminRoute, async (req, res) => {
    const { error } = await products.deleteProduct(req.params.productId);
    if (error) return res.redirect(`/admin?error=${error}`);
    return res.redirect('/admin');
});

router.post('/delete/', async (req, res) => {
    return res.redirect('/admin?error=DELETE_PRODUCT_ERROR')
});

module.exports = router;
