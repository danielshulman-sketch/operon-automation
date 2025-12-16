/**
 * Stripe Integration
 * Actions: create_customer, create_payment
 */

export const stripeIntegration = {
    name: 'Stripe',

    /**
     * Create a new Stripe customer
     */
    async create_customer(credentials, config, context) {
        const { email, name, description } = config;

        if (!email) {
            throw new Error('Email is required');
        }

        const params = new URLSearchParams();
        params.append('email', email);
        if (name) params.append('name', name);
        if (description) params.append('description', description);

        const response = await fetch('https://api.stripe.com/v1/customers', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.api_key}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Stripe API error: ${error.error.message}`);
        }

        const data = await response.json();

        return {
            success: true,
            customer_id: data.id,
            email: data.email
        };
    },

    /**
     * Create a payment intent
     */
    async create_payment(credentials, config, context) {
        const { amount, currency, customer_id, description } = config;

        if (!amount || !currency) {
            throw new Error('Amount and currency are required');
        }

        const params = new URLSearchParams();
        params.append('amount', Math.round(amount * 100)); // Convert to cents
        params.append('currency', currency.toLowerCase());
        if (customer_id) params.append('customer', customer_id);
        if (description) params.append('description', description);

        const response = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.api_key}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Stripe API error: ${error.error.message}`);
        }

        const data = await response.json();

        return {
            success: true,
            payment_intent_id: data.id,
            amount: data.amount / 100,
            currency: data.currency,
            status: data.status
        };
    }
};
