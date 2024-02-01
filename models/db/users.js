const bcrypt = require('bcrypt');
const validator = require('validator');
const User = require('./models/user-model.js');
const adminUsernames = process?.env?.ADMIN_USERS?.split(',');
const SALT_ROUNDS = Number(process?.env?.SALT_ROUNDS);

const getPasswordHash = async password => {
    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        return { hashedPassword };

    } catch (e) {
        return { error: 'PASSWORD_HASH_ERROR' };
    }
}

const getPasswordValid = async (passwordAttempt, passwordHash) => {
    try {
        const isValid = await bcrypt.compare(passwordAttempt, passwordHash);
        return { isValid };
    } catch (err) {
        return { error: 'PASSWORD_HASH_ERROR' };
    }
};

const isValidUsername = username => {
    const regex = /^[a-zA-Z0-9_]{1,14}$/;
    return regex.test(username);
}

const createUser = async (username, email, password, customerId) => {
    if (!(username && email && password && customerId)) {
        return { error: 'INSUFFICIENT_DETAILS' };
    }

    if (!isValidUsername(username)) {
        return { error: 'INVALID_USERNAME' };
    }

    if (!validator.isEmail(email)) {
        return { error: 'INVALID_EMAIL' };
    }

    const { error: fetchUsernameError, user: usernameExists } = await getUser(username);
    if (fetchUsernameError) return { error: fetchUsernameError };
    if (usernameExists) return { error: 'USERNAME_EXISTS' };

    const { error: fetchEmailError, user: emailExists } = await getUserWithEmail(email);
    if (fetchEmailError) return { error: fetchEmailError };
    if (emailExists) return { error: 'EMAIL_EXISTS' };

    const { error: hashError, hashedPassword } = await getPasswordHash(password);
    if (hashError) return { error: hashError };

    const user = new User({
        username,
        email,
        password: hashedPassword,
        customerId
    });

    try {
        const savedUser = await user.save();
        return { user: savedUser };
    } catch (err) {
        return { error: 'SAVING_USER_ERROR' };
    }
};

const getUser = async username => {
    try {
        const user = await User.findOne({ username });
        return { user };
    } catch (err) {
        return { error: 'FETCH_USER_ERROR' };
    }
}

const getIsValidLogin = async (username, password) => {
    try {
        const user = await User.findOne({ username });
        if (!user) return { error: 'INVALID_USERNAME' };
        const { isValid, error: hashError } = await getPasswordValid(password, user.password);
        if (hashError) return { error: hashError };
        if (!isValid) return { error: 'INVALID_PASSWORD' };
        return { user };
    } catch (err) {
        return { error: 'FETCH_USER_ERROR' };
    }
};

const verifyEmail = async username => {
    try {
        const result = await User.updateOne({ username },
            { $set: { emailVerified: true } }
        );
        if (result.matchedCount === 0) {
            return { error: 'USER_NOT_FOUND' };
        }
        return {};
    } catch (err) {
        return { error: 'UPDATE_USER_ERROR' };
    }
};

const deleteUser = async username => {
    try {
        const result = await User.deleteOne({ username });
        if (result.deletedCount === 0) {
            return { error: 'USER_NOT_FOUND' };
        }
        return {};
    } catch (err) {
        return { error: 'DELETE_USER_ERROR' };
    }
}

const getUserWithEmail = async email => {
    try {
        const user = await User.findOne({ email });
        return { user };
    } catch (err) {
        return { error: 'FETCH_USER_ERROR' };
    }
}

const setPassword = async (username, password) => {
    try {

        const { error: hashError, hashedPassword } = await getPasswordHash(password);
        if (hashError) return { error: hashError };

        const result = await User.updateOne({ username },
            { $set: { password: hashedPassword } }
        );
        if (result.matchedCount === 0) {
            return { error: 'USER_NOT_FOUND' };
        }
        return {};
    } catch (err) {
        return { error: 'UPDATE_USER_ERROR' };
    }
};

const makeAdmin = async username => {
    try {
        const result = await User.updateOne({ username }, { $set: { isAdmin: true } });
        if (result.matchedCount === 0) {
            return { error: 'USER_NOT_FOUND' };
        }
        return {};
    } catch (error) {
        return { error: 'UPDATE_USER_ERROR' };
    }
};

const configureAdminUsers = async () => {
    try {
        for (const username of adminUsernames) {
            await User.updateOne({ username },
                { $set: { isAdmin: true } }
            );
        }
        await User.updateMany(
            { username: { $nin: adminUsernames } },
            { $set: { isAdmin: false } }
        );
        return {};
    } catch (err) {
        return { error: 'UPDATE_USER_ERROR' };
    }
};

module.exports = {
    createUser, getIsValidLogin,
    getUser, deleteUser,
    verifyEmail, getUserWithEmail,
    setPassword, configureAdminUsers
};
