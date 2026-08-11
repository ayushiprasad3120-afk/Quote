import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { SectionContainer } from "@/components/shared/section-container";
import { ArticleGrid } from "@/components/blog/article-grid";
import { AuthorBio } from "@/components/blog/author-bio";
import { getArticlesByAuthor } from "@/lib/blog/mdx";
import { buildMetadata } from "@/lib/seo/metadata";
import type { Author } from "@/types/blog";

function getAuthor(slug: string): Author | null {
  const filePath = path.join(process.cwd(), "content", "authors", `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function generateMetadata({ params }: { params: { authorSlug: string } }): Metadata {
  const author = getAuthor(params.authorSlug);
  return buildMetadata({
    path: `/blog/author/${params.authorSlug}`,
    title: author ? `Articles by ${author.name}` : "Author",
  });
}

export default function BlogAuthorPage({ params }: { params: { authorSlug: string } }) {
  const author = getAuthor(params.authorSlug);
  if (!author) notFound();
  const articles = getArticlesByAuthor(params.authorSlug);

  return (
    <SectionContainer>
      <Breadcrumbs items={[{ name: "Blog", path: "/blog" }, { name: author.name, path: `/blog/author/${params.authorSlug}` }]} />
      <div className="mb-10 max-w-xl">
        <AuthorBio author={author} />
      </div>
      <ArticleGrid articles={articles} />
    </SectionContainer>
  );
}
