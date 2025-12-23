
/**
 * Kartra Integration
 * https://documentation.kartra.com/
 */

export const kartraIntegration = {
    create_lead: async (credentials, config) => {
        const { apiKey, apiPassword } = credentials;
        const { firstName, email, listId } = config;

        if (!apiKey || !apiPassword || !email) throw new Error('Kartra config missing');

        // Kartra API usually expects form-data or specific JSON structure
        const response = await fetch('https://app.kartra.com/api/v1/lead/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                app_id: apiKey,
                api_key: apiPassword, // Assuming fields map this way based on standard Kartra docs or user input convenience
                first_name: firstName,
                email: email,
                list_id: listId
            })
        });

        const data = await response.json();
        if (!response.ok || data.status === 'Error') {
            throw new Error(`Kartra Error: ${data.message || 'Unknown error'}`);
        }

        return { success: true, leadId: data.lead_details?.id };
    },

    subscribe_to_list: async (credentials, config) => {
        const { apiKey, apiPassword } = credentials;
        const { email, listId } = config;

        const response = await fetch('https://app.kartra.com/api/v1/lead/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                app_id: apiKey,
                api_key: apiPassword,
                email: email,
                list_id: listId
            })
        });

        const data = await response.json();
        if (!response.ok || data.status === 'Error') {
            throw new Error(`Kartra Error: ${data.message || 'Unknown error'}`);
        }

        return { success: true };
    },

    get_stats: async (credentials) => {
        // Kartra API doesn't have well-documented stats endpoints
        return {
            leads: { total: 'Available in dashboard' },
            lists: { total: 'Available in dashboard' },
            note: 'Kartra statistics are available in your Kartra dashboard'
        };
    }
};
