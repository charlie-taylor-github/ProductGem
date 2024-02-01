const stripe = require('stripe')(process.env.STRIPE_API_KEY);
const users = require('./db/users.js');

const getUserCustomerId = async username => {
    let customerId, error;
    try {
        const { user, error: usersError } = await users.getUser(username);
        customerId = user?.customerId;
        error = usersError;
    } catch (e) {
        if (!error) error = "CUSTOMER_ID_ERROR";
        return { error };
    }
    return { customerId, error };
};

const getUserSubscriptions = async customerId => {
    let subscriptions, error;
    try {
        const customer = await stripe.customers.retrieve(customerId, {
            expand: ['subscriptions']
        });
        subscriptions = customer?.subscriptions?.data;
    } catch (e) {
        if (!error) error = "RETRIEVE_SUBSCRIPTION_ERROR";
        return { error };
    }
    return { subscriptions, error };
};

const getIsPayingMember = async username => {
    let isPaying = true, error;
    try {
        const { customerId, customerIdError } = await getUserCustomerId(username);
        if (customerIdError || !customerId) error = customerIdError;
        const { subscriptions, getSubscriptionsError } = await getUserSubscriptions(customerId);
        if (getSubscriptionsError) error = getSubscriptionsError;
        if (!subscriptions) isPaying = false;
        if (subscriptions.length <= 0) isPaying = false;
        const correctSubscription = subscriptions.find(
            s => s?.plan?.id == process.env.STRIPE_PRODUCT_ID
        );
        if (!correctSubscription) isPaying = false;
    } catch (e) {
        if (!error) error = "SUBSCRIPTION_VALIDATION_ERROR";
        return { error };
    }
    return { isPaying, error }
};

const registerNewCustomer = async (username, email) => {
    let customer, error;
    try {
        customer = await stripe.customers.create({
            name: username,
            email
        });
    } catch (e) {
        if (!error) error = "STRIPE_REGISTRATION_ERROR";
        return { error };
    }
    return { customer, error };
};

const createCheckoutSession = async username => {
    let session, error;
    try {
        const { customerId, customerIdError } = await getUserCustomerId(username);
        if (customerIdError) error = customerIdError;
        session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: process.env.STRIPE_PRODUCT_ID,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
            success_url: `${process.env.DOMAIN}/products`,
            cancel_url: `${process.env.DOMAIN}/`,
            customer: customerId
        });
    } catch (e) {
        if (!error) error = "STRIPE_CHECKOUT_ERROR";
        return { error };
    }
    return { session, error };
};

const deleteCustomerSubscriptions = async username => {
    let error;
    try {
        const { customerId, customerIdError } = await getUserCustomerId(username);
        if (customerIdError) error = customerIdError;
        const { subscriptions } = await getUserSubscriptions(customerId);
        subscriptions.map(async s => {
            const deleted = await stripe.subscriptions.cancel(s.id);
            if (!deleted) error = "DELETE_SUBSCRIPTION_ERROR";
        });
    } catch (e) {
        error = "DELETE_SUBSCRIPTION_ERROR"
    }
    return { error };
};

const getActiveSubscriptions = async () => {
    let totalCount = 0, error;
    try {
        let hasMore = true;
        let startingAfter = null;
        while (hasMore) {
            const options = {
                limit: 10,
                status: 'active',
                price: process.env.STRIPE_PRODUCT_ID
            }
            if (startingAfter) options.starting_after = startingAfter;
            const subscriptions = await stripe.subscriptions.list(options);
            totalCount += subscriptions.data.length;
            if (subscriptions.has_more) {
                startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
            } else {
                hasMore = false;
            }
        }
    } catch (e) {
        error = "FETCHING_SUBSCRIPTIONS_ERROR";
        return { error }
    }
    return { subscriptions: totalCount, error }
}

module.exports = {
    getIsPayingMember, registerNewCustomer,
    createCheckoutSession, deleteCustomerSubscriptions,
    getActiveSubscriptions
};
