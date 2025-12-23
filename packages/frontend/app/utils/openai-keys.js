import { query } from './db';

export async function getOrgOpenAIKey(orgId) {
    const result = await query(
        `SELECT openai_api_key FROM org_api_keys WHERE org_id = $1`,
        [orgId]
    );

    return result.rows[0]?.openai_api_key || null;
}
