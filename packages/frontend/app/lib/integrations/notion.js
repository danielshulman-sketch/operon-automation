/**
 * Notion Integration
 * Actions: create_page, update_database
 */

export const notionIntegration = {
    name: 'Notion',

    /**
     * Create a new page in Notion
     */
    async create_page(credentials, config, context) {
        const { database_id, properties, content } = config;

        if (!database_id || !properties) {
            throw new Error('Database ID and properties are required');
        }

        const response = await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.access_token}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                parent: { database_id },
                properties: this._formatProperties(properties),
                children: content ? [
                    {
                        object: 'block',
                        type: 'paragraph',
                        paragraph: {
                            rich_text: [{ type: 'text', text: { content } }]
                        }
                    }
                ] : []
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Notion API error: ${error.message}`);
        }

        const data = await response.json();

        return {
            success: true,
            page_id: data.id,
            url: data.url
        };
    },

    /**
     * Update a database entry in Notion
     */
    async update_database(credentials, config, context) {
        const { page_id, properties } = config;

        if (!page_id || !properties) {
            throw new Error('Page ID and properties are required');
        }

        const response = await fetch(`https://api.notion.com/v1/pages/${page_id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${credentials.access_token}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify({
                properties: this._formatProperties(properties)
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Notion API error: ${error.message}`);
        }

        const data = await response.json();

        return {
            success: true,
            page_id: data.id,
            url: data.url
        };
    },

    /**
     * Format properties for Notion API
     */
    _formatProperties(properties) {
        const formatted = {};

        for (const [key, value] of Object.entries(properties)) {
            if (typeof value === 'string') {
                formatted[key] = {
                    title: [{ type: 'text', text: { content: value } }]
                };
            } else if (typeof value === 'number') {
                formatted[key] = { number: value };
            } else if (typeof value === 'boolean') {
                formatted[key] = { checkbox: value };
            } else {
                formatted[key] = value;
            }
        }

        return formatted;
    },

    async get_stats(credentials) {
        const { access_token } = credentials;

        try {
            const response = await fetch('https://api.notion.com/v1/search', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${access_token}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ page_size: 100 })
            });

            const data = await response.json();
            const pages = (data.results || []).filter(r => r.object === 'page');
            const databases = (data.results || []).filter(r => r.object === 'database');

            return {
                pages: { total: pages.length },
                databases: { total: databases.length },
                total_items: data.results?.length || 0
            };
        } catch (error) {
            throw new Error(`Notion stats error: ${error.message}`);
        }
    }
};
