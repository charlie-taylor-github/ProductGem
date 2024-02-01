const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const VerifyToken = require('./models/verify-token-model.js');
const users = require('./users.js');
const TOKEN_INTERVAL = Number(process.env.TOKEN_CREATION_INTERVAL);

const createToken = async (username, type) => {
    const { error: fetchUserError, user } = await users.getUser(username);
    if (fetchUserError) return { error: fetchUserError };
    if (!user) return { error: 'INVALID_USERNAME' };

    if (!['reset-password', 'verify-email'].includes(type)) {
        return { error: 'CREATE_TOKEN_ERROR' };
    }

    const { error: fetchTokenTimeError, time } = await getTimeSinceUserToken(username);
    if (fetchTokenTimeError) return { error: fetchTokenTimeError };
    if (time <= TOKEN_INTERVAL) return { error: 'TOO_RECENT_SINCE_PREVIOUS_TOKEN' };

    const token = new VerifyToken({
        username, type
    });
    try {
        const savedToken = await token.save();
        return { token: savedToken };
    } catch (e) {
        return { error: 'CREATE_TOKEN_ERROR' };
    }
};

const getIsValid = async (username, token, type) => {
    try {
        const validToken = await VerifyToken.findOne({
            _id: new ObjectId(token), username, type
        });
        return { validToken };
    } catch (e) {
        return { error: 'FETCH_TOKEN_ERROR' };
    }
};

const getTokenExists = async (token, type) => {
    try {
        const existingToken = await VerifyToken.findOne({
            _id: new ObjectId(token), type
        });
        return { existingToken };
    } catch (e) {
        return { error: 'FETCH_TOKEN_ERROR' };
    }
};

const deleteToken = async token => {
    try {
        const result = await VerifyToken.deleteOne({ _id: new ObjectId(token) });
        if (result.deletedCount === 0) {
            return { error: 'TOKEN_NOT_FOUND' };
        }
        return {};
    } catch (err) {
        return { error: 'DELETE_TOKEN_ERROR' };
    }
}

const getTimeSinceUserToken = async username => {
    try {
        const token = await VerifyToken.findOne({ username }).sort({ createdAt: -1 });
        if (!token) return {};
        const now = new Date();
        const time = (now.getTime() - token.createdAt.getTime()) / 1000;
        return { time };
    } catch (e) {
        return { error: 'FETCH_TOKEN_ERROR' };
    }
};

module.exports = { createToken, getIsValid, getTokenExists, deleteToken };
