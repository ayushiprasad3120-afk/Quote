import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SectionContainer } from "@/components/shared/section-container";
import { ArticleGrid } from "@/components/blog/article-grid";
import { getArticlesByCategory } from "@/lib/blog/mdx";
import { buildMetadata } from "@/lib/seo/metadata";

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  return buildMetadata({
    path: `/blog/category/${params.category}`,
    title: `${params.category.replace(/-/g, " ")} articles`,
  });
}

export default function BlogCategoryPage({ params }: { params: { category: string } }) {
  const articles = getArticlesByCategory(params.category);

  return (
    <SectionContainer>
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }, { name: params.category.replace(/-/g, " "), path: `/blog/category/${params.category}` }]} />
      <h1 className="text-display-sm balance mb-8 capitalize">{params.category.replace(/-/g, " ")}</h1>
      <ArticleGrid articles={articles} />
    </SectionContainer>
  );
}
