
export interface PostParams {
    platform: string;
    accessToken: string;
    content: string;
    imageUrl?: string;
    pageId?: string; // For Facebook/LinkedIn
}

export async function postToSocialMedia(params: PostParams) {
    console.log(`Posting to ${params.platform}...`);

    try {
        switch (params.platform) {
            case 'facebook':
                return await postToFacebook(params);
            case 'linkedin':
                return await postToLinkedIn(params);
            case 'instagram':
                return await postToInstagram(params);
            default:
                throw new Error(`Unsupported platform: ${params.platform}`);
        }
    } catch (error: any) {
        console.error(`Failed to post to ${params.platform}`, error);
        throw new Error(`Social Post Failed: ${error.message}`);
    }
}

async function postToFacebook(params: PostParams) {
    const { pageId, accessToken, content, imageUrl } = params;
    // If username is stored as pageId, use it. But in our store we saved `username: page.id`.
    // The `pageId` param here might come from the account username/id.

    // Facebook Graph API: POST /me/feed or /{page-id}/feed
    // If we have a Page Access Token, /me/feed posts to the Page.

    const url = `https://graph.facebook.com/v19.0/me/feed`;

    const body: any = {
        message: content,
        access_token: accessToken
    };

    if (imageUrl) {
        // If image, use /photos endpoint instead?
        // Or link? For now, let's assume link or just text.
        // If we want to upload valid images, we use /me/photos with 'url' param.
        if (imageUrl.startsWith('http')) {
            const photoUrl = `https://graph.facebook.com/v19.0/me/photos`;
            body.url = imageUrl;
            // body.caption = content; // Facebook uses 'caption' or 'message' depending on endpoint? 
            // actually for photos, it's 'caption' usually, or 'message'. 
            // Let's use 'message' for feed, but check docs.
            // For /photos, 'message' is the caption.

            const res = await fetch(photoUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: imageUrl,
                    caption: content,
                    access_token: accessToken
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            return { id: data.id, url: `https://facebook.com/${data.id}` };
        }

        body.link = imageUrl; // As a link attachment
    }

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    return { id: data.id, url: `https://facebook.com/${data.id}` };
}

async function postToLinkedIn(params: PostParams) {
    // Basic LinkedInugcPost implementation
    const { accessToken, content, imageUrl, pageId } = params;

    // User or Organization URN is needed. 
    // We assume the 'pageId' or 'username' in our store is the URN (e.g., urn:li:person:...)
    // If we only have the token, we might need to fetch the URN first via /v2/me

    let authorUrn = pageId;
    if (!authorUrn || !authorUrn.startsWith('urn:')) {
        // Fetch user URN
        const meRes = await fetch('https://api.linkedin.com/v2/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const meData = await meRes.json();
        if (meData.id) {
            authorUrn = `urn:li:person:${meData.id}`;
        } else {
            throw new Error("Could not determine LinkedIn Author URN");
        }
    }

    const url = 'https://api.linkedin.com/v2/ugcPosts';

    const body = {
        "author": authorUrn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": {
                    "text": content
                },
                "shareMediaCategory": imageUrl ? "IMAGE" : "NONE",
                // Media handling requires asset upload which is complex (initialize, upload, finalize).
                // For simplicity, we might just include image as a link or skip if separate upload needed.
                // We'll skip complex image upload for now and just do text.
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        }
    };

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0'
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`LinkedIn Error: ${err}`);
    }

    const data = await res.json();
    return { id: data.id };
}

async function postToInstagram(params: PostParams) {
    // Start with basic container creation for IG
    throw new Error("Instagram posting requires media upload flow. Not fully implemented.");
}
