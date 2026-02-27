/**
 * Facebook Page Integration
 * Uses the Facebook Graph API v21.0 to manage Pages
 */

const GRAPH_API = 'https://graph.facebook.com/v21.0';

/**
 * Get a Page Access Token from the user-level token.
 * Facebook OAuth returns a user token; Page actions need a page token.
 */
async function getPageAccessToken(pageId, userAccessToken) {
    const res = await fetch(`${GRAPH_API}/${pageId}?fields=access_token&access_token=${userAccessToken}`);
    const data = await res.json();
    if (data.error) {
        throw new Error(`Facebook Error: ${data.error.message || 'Failed to get page access token'}`);
    }
    return data.access_token;
}

export const facebookPageIntegration = {
    name: 'Facebook Page',

    /**
     * Publish a post to a Facebook Page
     */
    async publish_post(credentials, config) {
        const { pageId, message } = config;
        if (!pageId || !message) {
            throw new Error('pageId and message are required');
        }

        const pageToken = await getPageAccessToken(pageId, credentials.access_token);

        const res = await fetch(`${GRAPH_API}/${pageId}/feed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                access_token: pageToken
            })
        });

        const data = await res.json();
        if (data.error) {
            throw new Error(`Facebook Error: ${data.error.message || 'Failed to publish post'}`);
        }
        return { success: true, postId: data.id };
    },

    /**
     * Get information about a Facebook Page
     */
    async get_page_info(credentials, config) {
        const { pageId } = config;
        if (!pageId) {
            throw new Error('pageId is required');
        }

        const res = await fetch(
            `${GRAPH_API}/${pageId}?fields=id,name,about,fan_count,followers_count,category,website,link&access_token=${credentials.access_token}`
        );

        const data = await res.json();
        if (data.error) {
            throw new Error(`Facebook Error: ${data.error.message || 'Failed to get page info'}`);
        }
        return data;
    },

    /**
     * Get recent posts from a Facebook Page
     */
    async get_posts(credentials, config) {
        const { pageId, limit = 10 } = config;
        if (!pageId) {
            throw new Error('pageId is required');
        }

        const res = await fetch(
            `${GRAPH_API}/${pageId}/posts?fields=id,message,created_time,story,full_picture&limit=${limit}&access_token=${credentials.access_token}`
        );

        const data = await res.json();
        if (data.error) {
            throw new Error(`Facebook Error: ${data.error.message || 'Failed to get posts'}`);
        }
        return data.data || [];
    },

    /**
     * Get Facebook Page statistics (called after connection)
     */
    async get_stats(credentials) {
        const { access_token } = credentials;

        try {
            // List all pages the user manages
            const pagesRes = await fetch(
                `${GRAPH_API}/me/accounts?fields=id,name,fan_count,followers_count,category&access_token=${access_token}`
            );
            const pagesData = await pagesRes.json();

            if (pagesData.error) {
                throw new Error(pagesData.error.message);
            }

            const pages = pagesData.data || [];
            return {
                pages_managed: pages.length,
                pages: pages.map(p => ({
                    id: p.id,
                    name: p.name,
                    category: p.category,
                    fans: p.fan_count || 0
                }))
            };
        } catch (error) {
            console.error('Facebook stats error:', error);
            throw new Error(`Failed to fetch Facebook statistics: ${error.message}`);
        }
    }
};
