import { getAllBlogs } from "@/lib/blogs";
import { BlogList } from "@/components/blog-list";

export default async function BlogPage() {
  const blogs = await getAllBlogs();

  return (
    <BlogList
      blogs={blogs}
      basePath="/blog"
      title="Insights, workflows, and product notes."
      description="The same blog content can also live under /help/blog if you want your help center and editorial content in one place."
    />
  );
}
