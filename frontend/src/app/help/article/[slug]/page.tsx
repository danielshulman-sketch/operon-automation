import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HelpArticlePage } from "@/components/help-article-page";
import { getHelpArticleBySlug } from "@/lib/help";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getHelpArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  return {
    title: article.title,
    description: article.summary,
  };
}

export default async function HelpArticleRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getHelpArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return <HelpArticlePage article={article} />;
}
