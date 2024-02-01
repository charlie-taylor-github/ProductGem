const users = require('./models/db/users.js');

const { error } = await users.configureAdminUsers();
if (error) console.error(error);
