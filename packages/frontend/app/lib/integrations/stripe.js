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
    },

    /**
     * Get Stripe account statistics
     */
    async get_stats(credentials) {
        const { api_key } = credentials;

        try {
            // Fetch customers
            const customersResponse = await fetch('https://api.stripe.com/v1/customers?limit=1', {
                headers: { 'Authorization': `Bearer ${api_key}` }
            });
            const customersData = await customersResponse.json();

            // Fetch recent charges
            const chargesResponse = await fetch('https://api.stripe.com/v1/charges?limit=100', {
                headers: { 'Authorization': `Bearer ${api_key}` }
            });
            const chargesData = await chargesResponse.json();

            const successfulCharges = (chargesData.data || []).filter(c => c.paid && c.status === 'succeeded');
            const totalRevenue = successfulCharges.reduce((sum, c) => sum + c.amount, 0) / 100;

            // Fetch balance
            const balanceResponse = await fetch('https://api.stripe.com/v1/balance', {
                headers: { 'Authorization': `Bearer ${api_key}` }
            });
            const balanceData = await balanceResponse.json();

            return {
                customers: {
                    total: customersData.has_more ? '1000+' : customersData.data?.length || 0
                },
                revenue: {
                    total: totalRevenue,
                    currency: balanceData.available?.[0]?.currency || 'usd',
                    successful_charges: successfulCharges.length
                },
                balance: {
                    available: (balanceData.available?.[0]?.amount || 0) / 100,
                    pending: (balanceData.pending?.[0]?.amount || 0) / 100
                }
            };
        } catch (error) {
            console.error('Stripe stats error:', error);
            throw new Error(`Failed to fetch Stripe statistics: ${error.message}`);
        }
    }
};
