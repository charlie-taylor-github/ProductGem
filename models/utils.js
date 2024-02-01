const tokens = require('./db/verify-tokens.js');
const users = require('./db/users.js');
const mailer = require('./mailer.js');
const { v4: uuid } = require('uuid');

const handleSendEmail = async (username) => {
  let error;
  const { token, error: tokenError } = await tokens.createToken(username, "verify-email");
  error = tokenError;
  if (!error && !token) error = "VERIFY_TOKEN_ERROR";
  if (error) return { error };;

  const { error: fetchUserError, user } = await users.getUser(username);
  if (fetchUserError) return { error: fetchUserError };
  if (!user?.email) return { error: 'DB_ERROR' };

  const { error: mailError } = mailer.sendVerificationEmail(
    user.email, token._id
  );
  if (mailError) return { error: mailError };
  return {};
};

const getId = () => {
  return { id: uuid() }
}

module.exports = { handleSendEmail, getId };
