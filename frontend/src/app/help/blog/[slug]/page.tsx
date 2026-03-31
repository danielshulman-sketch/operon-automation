import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostPage } from "@/components/blog-post-page";
import { getBlogBySlug } from "@/lib/blogs";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: blog.title,
    description: blog.excerpt,
  };
}

export default async function HelpBlogPostRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) {
    notFound();
  }

  return <BlogPostPage blog={blog} backHref="/help/blog" />;
}
