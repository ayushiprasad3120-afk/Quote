import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SectionContainer } from "@/components/shared/section-container";
import { ArticleGrid } from "@/components/blog/article-grid";
import { getArticlesByTag } from "@/lib/blog/mdx";
import { buildMetadata } from "@/lib/seo/metadata";

export function generateMetadata({ params }: { params: { tag: string } }): Metadata {
  return buildMetadata({ path: `/blog/tag/${params.tag}`, title: `#${params.tag} articles` });
}

export default function BlogTagPage({ params }: { params: { tag: string } }) {
  const articles = getArticlesByTag(params.tag);

  return (
    <SectionContainer>
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }, { name: `#${params.tag}`, path: `/blog/tag/${params.tag}` }]} />
      <h1 className="text-display-sm balance mb-8">#{params.tag}</h1>
      <ArticleGrid articles={articles} />
    </SectionContainer>
  );
}
