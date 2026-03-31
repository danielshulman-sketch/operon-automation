import { NextRequest, NextResponse } from "next/server";

// This is the secret you'll set in Vercel Environment Variables
const BLOG_API_SECRET = process.env.EASY_AI_BLOG_API_SECRET;
// The GitHub token to commit files back to this repo
const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
// Your GitHub repo details
const GH_REPO = process.env.GH_REPO || "danielshulman1/easyaiwebsite";
const GH_BRANCH = process.env.GH_BRANCH || "main";

export async function POST(req: NextRequest) {
  try {
    // 1. Validate Secret
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${BLOG_API_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, slug: providedSlug, featured_image, excerpt, date } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Missing title or content" }, { status: 400 });
    }

    // 2. Prepare Payload
    const slug = providedSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const fileName = `content/blogs/${slug}.json`;

    const postData = {
      title,
      content,
      slug,
      featured_image: featured_image || "",
      excerpt: excerpt || content.substring(0, 150) + "...",
      date: date || new Date().toISOString().replace('T', ' ').split('.')[0],
    };

    // 3. Commit to GitHub
    if (!GH_TOKEN) {
      return NextResponse.json({ error: "GitHub Token not configured on server" }, { status: 500 });
    }

    // Check if file exists to get SHA (for updates)
    let sha: string | undefined;
    const existingFile = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/${fileName}?ref=${GH_BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (existingFile.ok) {
      const data = await existingFile.json();
      sha = data.sha;
    }

    const commitResponse = await fetch(
      `https://api.github.com/repos/${GH_REPO}/contents/${fileName}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GH_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Post blog: ${title}`,
          content: Buffer.from(JSON.stringify(postData, null, 2)).toString("base64"),
          branch: GH_BRANCH,
          ...(sha ? { sha } : {}),
        }),
      }
    );

    if (!commitResponse.ok) {
      const errorData = await commitResponse.json();
      return NextResponse.json({ error: "GitHub commit failed", details: errorData }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Blog post queued for deployment",
      slug 
    });

  } catch (error) {
    console.error("Blog API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
