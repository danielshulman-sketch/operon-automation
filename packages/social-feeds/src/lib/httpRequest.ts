export type WorkflowHttpTemplateContext = {
    content: string;
    ai_output: string;
    output: string;
    html_content: string;
    image_url: string;
    featured_image: string;
    workflow_id: string;
    execution_id: string;
    user_id: string;
    title: string;
    slug: string;
    excerpt: string;
    date: string;
};

const normalizeEnv = (value?: string | null) =>
    (value || "").trim().replace(/^["']|["']$/g, "");

const EMAIL_LIKE_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getAppBaseUrl = (requestUrl?: string) => {
    const configuredBase =
        normalizeEnv(process.env.NEXTAUTH_URL) ||
        normalizeEnv(process.env.NEXT_PUBLIC_APP_URL);

    if (configuredBase) return configuredBase;

    const vercelUrl = normalizeEnv(process.env.VERCEL_URL);
    if (vercelUrl) {
        return vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    }

    if (!requestUrl) return "";

    try {
        return new URL(requestUrl).origin;
    } catch {
        return "";
    }
};

export const resolveHttpRequestUrl = (rawUrl: string, requestUrl?: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return "";

    if (/^https?:\/\//i.test(trimmed)) return trimmed;

    const baseUrl = getAppBaseUrl(requestUrl);
    if (!baseUrl) return trimmed;

    try {
        return new URL(trimmed, baseUrl).toString();
    } catch {
        return trimmed;
    }
};

export const validateHttpRequestTarget = (rawUrl: string, requestUrl?: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return "HTTP Request node: No URL configured.";

    if (EMAIL_LIKE_PATTERN.test(trimmed)) {
        return `HTTP Request node: "${trimmed}" looks like an email address, not a URL. Use an HTTPS endpoint or an internal path like /api/publish-blog.`;
    }

    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) {
        return null;
    }

    const resolved = resolveHttpRequestUrl(trimmed, requestUrl);
    if (/^https?:\/\//i.test(resolved)) {
        return null;
    }

    return `HTTP Request node: "${trimmed}" is not a valid target. Use a full https:// URL or an internal path starting with /.`;
};

export const resolvePublishBlogRequestUrl = (rawUrl: string, requestUrl?: string) => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return "";

    if (isEasyAiPostBlogRequest(trimmed)) {
        return resolveHttpRequestUrl("/api/publish-blog", requestUrl);
    }

    return resolveHttpRequestUrl(trimmed, requestUrl);
};

export const isInternalHttpRequest = (targetUrl: string, requestUrl?: string) => {
    if (!targetUrl) return false;
    if (targetUrl.startsWith("/")) return true;

    const baseUrl = getAppBaseUrl(requestUrl);
    if (!baseUrl) return false;

    try {
        return new URL(targetUrl).origin === new URL(baseUrl).origin;
    } catch {
        return false;
    }
};

export const getWorkflowInternalSecret = () =>
    normalizeEnv(process.env.WORKFLOW_INTERNAL_SECRET || process.env.CRON_SECRET);

const stripMarkup = (value: string) =>
    value
        .replace(/<[^>]+>/g, " ")
        .replace(/^#{1,6}\s+/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
        .replace(/\s+/g, " ")
        .trim();

const extractTitle = (content: string) => {
    const markdownTitle = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
    if (markdownTitle) return markdownTitle;

    const htmlTitle = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]
        ?.replace(/<[^>]+>/g, " ")
        ?.replace(/\s+/g, " ")
        ?.trim();
    if (htmlTitle) return htmlTitle;

    const firstLine = content
        .split(/\r?\n/)
        .map((line) => stripMarkup(line))
        .find((line) => line.length > 0);

    return firstLine || "Untitled Post";
};

const slugify = (value: string) =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 80) || "untitled-post";

const buildExcerpt = (content: string, title: string) => {
    const text = stripMarkup(content);
    const withoutTitle = text.startsWith(title) ? text.slice(title.length).trim() : text;
    const source = withoutTitle || text;
    if (source.length <= 180) return source;
    return `${source.slice(0, 177).trimEnd()}...`;
};

const formatWorkflowDate = (date = new Date()) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export const buildWorkflowHttpTemplateContext = (values: {
    upstreamText?: string;
    lastImageUrl?: string;
    workflowId?: string;
    executionId?: string;
    userId?: string;
}): WorkflowHttpTemplateContext => {
    const upstreamText = values.upstreamText || "";
    const title = extractTitle(upstreamText);

    return {
        content: upstreamText,
        ai_output: upstreamText,
        output: upstreamText,
        html_content: upstreamText,
        image_url: values.lastImageUrl || "",
        featured_image: values.lastImageUrl || "",
        workflow_id: values.workflowId || "",
        execution_id: values.executionId || "",
        user_id: values.userId || "",
        title,
        slug: slugify(title),
        excerpt: buildExcerpt(upstreamText, title),
        date: formatWorkflowDate(),
    };
};

export const applyHttpTemplate = (value: string, context: WorkflowHttpTemplateContext) =>
    value.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, rawKey) => {
        const key = String(rawKey).toLowerCase() as keyof WorkflowHttpTemplateContext;
        return context[key] ?? "";
    });

export const isEasyAiPostBlogRequest = (targetUrl: string) => {
    try {
        const url = new URL(targetUrl);
        return url.pathname.replace(/\/+$/, "") === "/api/post-blog";
    } catch {
        return targetUrl.includes("/api/post-blog");
    }
};

export const isPublishBlogRequest = (targetUrl: string) => {
    try {
        const url = new URL(targetUrl);
        const normalizedPath = url.pathname.replace(/\/+$/, "");
        return normalizedPath === "/api/post-blog" || normalizedPath === "/api/publish-blog";
    } catch {
        return targetUrl.includes("/api/post-blog") || targetUrl.includes("/api/publish-blog");
    }
};

export const buildEasyAiPostBlogBody = (context: WorkflowHttpTemplateContext) =>
    JSON.stringify({
        title: context.title,
        slug: context.slug,
        date: context.date,
        featured_image: context.featured_image,
        excerpt: context.excerpt,
        content: context.content,
    });
