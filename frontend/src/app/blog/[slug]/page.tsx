import { notFound } from "next/navigation";
import { getBlogBySlug } from "@/lib/blogs";
import { BlogPostPage as BlogPostLayout } from "@/components/blog-post-page";

export default async function BlogPostRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  return <BlogPostLayout blog={blog} backHref="/blog" />;
}
