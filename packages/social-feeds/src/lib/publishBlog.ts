const normalizeEnv = (value?: string | null) =>
    (value || "")
        .trim()
        .replace(/^["']|["']$/g, "")
        .replace(/\\r\\n|\\n|\\r/g, "")
        .trim();

const EASY_AI_BLOG_API_URL = (
    normalizeEnv(process.env.EASY_AI_BLOG_API_URL) ||
    "https://www.easy-ai.co.uk/api/post-blog"
).replace(/\/+$/, "");
const EASY_AI_BLOG_API_SECRET = normalizeEnv(process.env.EASY_AI_BLOG_API_SECRET);
const EASY_AI_VERCEL_BYPASS_SECRET = normalizeEnv(
    process.env.EASY_AI_VERCEL_BYPASS_SECRET || process.env.EASY_AI_VERCEL_AUTOMATION_BYPASS_SECRET
);
const GH_TOKEN = normalizeEnv(
    process.env.EASY_AI_GH_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_TOKEN
);
const GH_REPO =
    normalizeEnv(process.env.EASY_AI_GH_REPO || process.env.GH_REPO) || "danielshulman1/easyaiwebsite";
const GH_BRANCH = normalizeEnv(process.env.EASY_AI_GH_BRANCH || process.env.GH_BRANCH) || "main";
const VERCEL_DEPLOY_HOOK = normalizeEnv(process.env.VERCEL_DEPLOY_HOOK);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export type PublishBlogPayload = {
    title?: string;
    content?: string;
    slug?: string;
    excerpt?: string;
    featured_image?: string;
    date?: string;
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "untitled-post";

const formatDate = (date = new Date()) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const encodeGitHubPath = (value: string) =>
    value.split("/").map(encodeURIComponent).join("/");

const getGitHubApiError = async (response: Response) => {
    const text = await response.text().catch(() => "");
    if (!text) return response.statusText || "GitHub API error";

    try {
        const parsed = JSON.parse(text) as { message?: string };
        return parsed.message || text;
    } catch {
        return text;
    }
};

async function publishBlogViaGitHub(body: PublishBlogPayload) {
    if (!GH_TOKEN) return null;

    const slug = body.slug || slugify(body.title || "");
    const payload = {
        title: body.title,
        slug,
        excerpt: body.excerpt || "",
        featured_image: body.featured_image || "",
        date: body.date || formatDate(),
        content: body.content,
    };
    const path = `content/blogs/${slug}.json`;
    const encodedPath = encodeGitHubPath(path);
    const baseHeaders = {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${GH_TOKEN}`,
        "User-Agent": "social-feeds-app",
        "X-GitHub-Api-Version": "2022-11-28",
    };

    let sha: string | undefined;
    const existing = await fetch(
        `https://api.github.com/repos/${GH_REPO}/contents/${encodedPath}?ref=${encodeURIComponent(GH_BRANCH)}`,
        { headers: baseHeaders, cache: "no-store" }
    );

    if (existing.ok) {
        const existingData = await existing.json().catch(() => ({}));
        sha = existingData?.sha;
    } else if (existing.status !== 404) {
        return {
            status: existing.status,
            data: { error: await getGitHubApiError(existing) },
        };
    }

    const writeRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${encodedPath}`, {
        method: "PUT",
        headers: {
            ...baseHeaders,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: `${sha ? "Update" : "Publish"} blog post ${slug}`,
            content: Buffer.from(JSON.stringify(payload, null, 2)).toString("base64"),
            branch: GH_BRANCH,
            ...(sha ? { sha } : {}),
        }),
        cache: "no-store",
    });

    if (!writeRes.ok) {
        return {
            status: writeRes.status,
            data: { error: await getGitHubApiError(writeRes) },
        };
    }

    const writeData = await writeRes.json().catch(() => ({}));
    return {
        status: 200,
        data: {
            success: true,
            slug,
            path,
            commit: writeData?.commit?.sha || null,
            source: "github-direct",
        },
    };
}

export async function publishBlogToEasyAi(body: PublishBlogPayload) {
    if (!EASY_AI_BLOG_API_SECRET) {
        const githubFallback = await publishBlogViaGitHub(body);
        if (githubFallback) return githubFallback;

        return {
            status: 500,
            data: { error: "Missing EASY_AI_BLOG_API_SECRET" },
        };
    }

    if (!body?.title || !body?.content) {
        return {
            status: 400,
            data: { error: "Missing required fields: title, content" },
        };
    }

    if (body.date && !DATE_PATTERN.test(body.date)) {
        return {
            status: 400,
            data: { error: "Invalid date format. Expected YYYY-MM-DD HH:MM:SS" },
        };
    }

    const githubFallback = await publishBlogViaGitHub(body);
    if (githubFallback?.status && githubFallback.status >= 200 && githubFallback.status < 300) {
        return githubFallback;
    }
    if (githubFallback) {
        console.error("GitHub blog publish fallback failed, continuing to Easy AI API:", githubFallback);
    }

    const payload = {
        title: body.title,
        content: body.content,
        ...(body.slug ? { slug: body.slug } : {}),
        ...(body.excerpt ? { excerpt: body.excerpt } : {}),
        ...(body.featured_image ? { featured_image: body.featured_image } : {}),
        ...(body.date ? { date: body.date } : {}),
    };

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EASY_AI_BLOG_API_SECRET}`,
    };

    if (EASY_AI_VERCEL_BYPASS_SECRET) {
        headers["x-vercel-protection-bypass"] = EASY_AI_VERCEL_BYPASS_SECRET;
    }

    try {
        const upstream = await fetch(EASY_AI_BLOG_API_URL, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
            cache: "no-store",
        });

        const text = await upstream.text();
        const lowerText = text.toLowerCase();

        if (
            (upstream.status === 401 || upstream.status === 403) &&
            (
                lowerText.includes("authentication required") ||
                lowerText.includes("vercel authentication") ||
                lowerText.includes("vercel protection") ||
                lowerText.includes("vercel security checkpoint")
            )
        ) {
            return {
                status: 502,
                data: {
                    error: EASY_AI_VERCEL_BYPASS_SECRET
                        ? "Easy AI is protected by Vercel Authentication and still rejected the server request. Verify the protection bypass secret or disable deployment protection for that endpoint."
                        : "Easy AI is protected by Vercel Authentication. Add EASY_AI_VERCEL_BYPASS_SECRET in this app or disable Vercel protection on the Easy AI project.",
                },
            };
        }

        if (upstream.status === 404 && lowerText.includes("not found")) {
            return {
                status: 502,
                data: {
                    error: "Easy AI blog publish endpoint accepted the request but returned Not Found. Verify EASY_AI_BLOG_API_URL and the Easy AI site's server-side blog publish configuration.",
                    ...(githubFallback ? { githubFallbackError: githubFallback.data } : {}),
                },
            };
        }

        try {
            const data = JSON.parse(text);
            
            // Trigger a redeploy if a hook is provided
            if (VERCEL_DEPLOY_HOOK) {
                console.log("Triggering Vercel Deploy Hook...");
                fetch(VERCEL_DEPLOY_HOOK, { method: "POST" }).catch(e => console.error("Deploy hook failed:", e));
            }

            return {
                status: upstream.status,
                data: githubFallback
                    ? {
                        ...data,
                        githubFallbackError: githubFallback.data,
                    }
                    : data,
            };
        } catch {
            return {
                status: upstream.status,
                data: githubFallback
                    ? {
                        response: text,
                        githubFallbackError: githubFallback.data,
                    }
                    : text,
            };
        }

    } catch (error) {
        return {
            status: 500,
            data: {
                error: error instanceof Error ? error.message : "Unknown server error",
                ...(githubFallback ? { githubFallbackError: githubFallback.data } : {}),
            },
        };
    }
}
