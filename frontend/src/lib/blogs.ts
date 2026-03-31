import fs from "fs";
import path from "path";

export interface BlogPost {
  title: string;
  content: string;
  slug: string;
  featured_image?: string;
  excerpt?: string;
  date: string;
}

const BLOGS_DIR = path.join(process.cwd(), "content/blogs");

function getBlogFiles() {
  if (!fs.existsSync(BLOGS_DIR)) {
    return [];
  }

  return fs.readdirSync(BLOGS_DIR).filter((file) => file.endsWith(".json"));
}

export async function getAllBlogs(): Promise<BlogPost[]> {
  try {
    const blogs = getBlogFiles()
      .map((file) => {
        const filePath = path.join(BLOGS_DIR, file);
        const content = fs.readFileSync(filePath, "utf8");
        return JSON.parse(content) as BlogPost;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return blogs;
  } catch (error) {
    console.error("Failed to read blogs:", error);
    return [];
  }
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const filePath = path.join(BLOGS_DIR, `${slug}.json`);
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content) as BlogPost;
  } catch (error) {
    console.error(`Failed to read blog post ${slug}:`, error);
    return null;
  }
}

export async function getAllBlogSlugs() {
  return getBlogFiles().map((file) => file.replace(/\.json$/, ""));
}
