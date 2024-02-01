require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const users = require('./models/db/users.js');
const sassMiddleware = require('node-sass-middleware');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const sessionOptions = {
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
};
const sassSettings = {
    src: path.join(__dirname, 'scss'),
    dest: path.join(__dirname, 'public/styles'),
    debug: true,
    outputStyle: 'compressed',
    prefix: '/styles'
};

const dbUrl = process.env.DB_URL;

mongoose.connect(dbUrl);
(async () => {
    const { error } = await users.configureAdminUsers();
    if (error) console.error(error);
})();

app.use(session(sessionOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sassMiddleware(sassSettings));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

const indexRouter = require('./routes/index.js');
app.use('/', indexRouter);
const productRouter = require('./routes/product.js');
app.use('/product', productRouter);
const stripeRouter = require('./routes/stripe.js');
app.use('/stripe', stripeRouter);
const verifyEmailRouter = require('./routes/verify-email.js');
app.use('/verify-email', verifyEmailRouter);
const resetPasswordRouter = require('./routes/reset-password.js');
app.use('/reset-password', resetPasswordRouter);

app.listen(PORT, () => {
    console.log(`Server listening... [port: ${PORT}]`);
});
