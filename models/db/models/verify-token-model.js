const mongoose = require('mongoose');

const TTL = Number(process.env.TOKEN_TTL);

const tokenSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

tokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: TTL });

const VerifyToken = mongoose.model('VerifyToken', tokenSchema);

module.exports = VerifyToken;
