import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SectionContainer } from "@/components/shared/section-container";
import { ArticleGrid } from "@/components/blog/article-grid";
import { getAllArticles } from "@/lib/blog/mdx";
import { paginate } from "@/lib/blog/pagination";
import { buildMetadata } from "@/lib/seo/metadata";

export function generateMetadata({ params }: { params: { pageNumber: string } }): Metadata {
  return buildMetadata({ path: `/blog/page/${params.pageNumber}`, title: `Blog — Page ${params.pageNumber}` });
}

export default function BlogPaginatedPage({ params }: { params: { pageNumber: string } }) {
  const pageNumber = Number(params.pageNumber);
  if (!Number.isFinite(pageNumber) || pageNumber < 1) notFound();

  const { items, currentPage, totalPages } = paginate(getAllArticles(), pageNumber);
  if (pageNumber > totalPages) notFound();

  return (
    <SectionContainer>
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }, { name: `Page ${currentPage}`, path: `/blog/page/${currentPage}` }]} />
      <ArticleGrid articles={items} />
      <p className="mt-10 text-center text-sm text-ink-muted">
        Page {currentPage} of {totalPages}
      </p>
    </SectionContainer>
  );
}
