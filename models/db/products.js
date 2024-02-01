const Product = require('./models/product-model.js');
const utils = require('../utils.js');
const gcs = require('../gcs.js');

const uploadImage = async file => {
    const { id: imageId, error: imageIdError } = utils.getId();
    if (imageIdError) return { error: imageIdError };
    const { error: uploadError } = await gcs.uploadImage(file, imageId);
    if (uploadError) return { error: uploadError };
    return { id: imageId };
}

const isValidUrl = string => {
    try {
        new URL(string);
        return true;
    } catch (err) {
        return false;
    }
}

const createProduct = async (
    title, description, aliExpressUrl,
    tikTokUrl, imageFile
) => {
    if (!(title && description && aliExpressUrl && tikTokUrl && imageFile)
    ) return { error: 'INSUFFICIENT_DETAILS' };

    if (!(isValidUrl(aliExpressUrl) && isValidUrl(tikTokUrl))
    ) return { error: 'INVALID_URL' };

    const { error: uploadError, id: imageId } = await uploadImage(imageFile);
    if (uploadError) return { error: uploadError };
    const product = new Product({
        title,
        description,
        imageId,
        aliExpressUrl,
        tikTokUrl
    });

    try {
        const savedProduct = await product.save();
        return { product: savedProduct };
    } catch (err) {
        return { error: 'SAVING_PRODUCT_ERROR' };
    }
};

const getProducts = async () => {
    let formattedProducts;
    try {
        const products = await Product.find({}).lean();
        const formattedProductsPromises = products.map(async p => {
            const { url: imageUrl, error: e } = await gcs.getImageUrl(p.imageId);
            if (e) throw new Error(e);
            return { ...p, imageUrl };
        });
        formattedProducts = await Promise.all(formattedProductsPromises);
        return { products: formattedProducts };
    } catch (err) {
        return { error: 'FETCH_PRODUCTS_ERROR' };
    }
};

const deleteProduct = async productId => {
    try {
        const product = await Product.findOne({ _id: productId });
        const imageId = product.imageId;
        const { error: deleteImageError } = await gcs.deleteImage(imageId);
        if (deleteImageError) return { error: deleteImageError };
        const result = await Product.deleteOne({ _id: productId });
        if (result.deletedCount === 0) {
            return { error: 'PRODUCT_NOT_FOUND' };
        }
        return {};
    } catch (err) {
        return { error: 'DELETE_PRODUCT_ERROR' };
    }
};

module.exports = { createProduct, getProducts, deleteProduct };
