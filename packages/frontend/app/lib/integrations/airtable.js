/**
 * Airtable Integration
 * Actions: read_records, create_record, update_record, delete_record
 */

export const airtableIntegration = {
    name: 'Airtable',

    /**
     * Read records from an Airtable base/table
     */
    async read_records(credentials, config, context) {
        const { base_id, table_name, view, max_records, filter_formula } = config;

        if (!base_id || !table_name) {
            throw new Error('Base ID and table name are required');
        }

        const params = new URLSearchParams();
        if (view) params.set('view', view);
        if (max_records) params.set('maxRecords', max_records);
        if (filter_formula) params.set('filterByFormula', filter_formula);

        const url = `https://api.airtable.com/v0/${base_id}/${encodeURIComponent(table_name)}${params.toString() ? '?' + params.toString() : ''}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${credentials.access_token || credentials.api_key}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Airtable API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();

        return {
            success: true,
            records: data.records || [],
            record_count: (data.records || []).length,
            offset: data.offset
        };
    },

    /**
     * Create a new record in Airtable
     */
    async create_record(credentials, config, context) {
        const { base_id, table_name, fields } = config;

        if (!base_id || !table_name || !fields) {
            throw new Error('Base ID, table name, and fields are required');
        }

        const response = await fetch(
            `https://api.airtable.com/v0/${base_id}/${encodeURIComponent(table_name)}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${credentials.access_token || credentials.api_key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: typeof fields === 'string' ? JSON.parse(fields) : fields
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Airtable API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();

        return {
            success: true,
            record_id: data.id,
            fields: data.fields,
            created_time: data.createdTime
        };
    },

    /**
     * Update an existing record
     */
    async update_record(credentials, config, context) {
        const { base_id, table_name, record_id, fields } = config;

        if (!base_id || !table_name || !record_id || !fields) {
            throw new Error('Base ID, table name, record ID, and fields are required');
        }

        const response = await fetch(
            `https://api.airtable.com/v0/${base_id}/${encodeURIComponent(table_name)}/${record_id}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${credentials.access_token || credentials.api_key}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: typeof fields === 'string' ? JSON.parse(fields) : fields
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Airtable API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();

        return {
            success: true,
            record_id: data.id,
            fields: data.fields
        };
    },

    /**
     * Delete a record
     */
    async delete_record(credentials, config, context) {
        const { base_id, table_name, record_id } = config;

        if (!base_id || !table_name || !record_id) {
            throw new Error('Base ID, table name, and record ID are required');
        }

        const response = await fetch(
            `https://api.airtable.com/v0/${base_id}/${encodeURIComponent(table_name)}/${record_id}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${credentials.access_token || credentials.api_key}`
                }
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Airtable API error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();

        return {
            success: true,
            deleted: data.deleted,
            record_id: data.id
        };
    },

    /**
     * Get Airtable base statistics
     */
    async get_stats(credentials) {
        // Note: Airtable doesn't have a direct stats API
        // This would require reading from a specific base/table
        // For now, return basic info
        try {
            return {
                connected: true,
                message: 'Airtable connected. Use specific base actions to interact with data.'
            };
        } catch (error) {
            throw new Error(`Airtable stats error: ${error.message}`);
        }
    }
};
