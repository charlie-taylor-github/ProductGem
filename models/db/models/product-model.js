const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageId: {
        type: String,
        required: true
    },
    aliExpressUrl: {
        type: String,
        required: true
    },
    tikTokUrl: {
        type: String,
        required: true
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
