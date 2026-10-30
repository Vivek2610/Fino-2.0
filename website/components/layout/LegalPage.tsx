import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import PostBody from "@/components/blog/PostBody";
import { breadcrumbJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/blog";
import type { LegalContent } from "@/lib/content";

/**
 * Legal page shell. Shows the text from Sanity (Legal pages) when it has been
 * written there, otherwise the built-in draft passed as children.
 */
export default function LegalPage({
  title,
  path,
  cms,
  children,
}: {
  title: string;
  path: string;
  cms?: LegalContent | null;
  children: React.ReactNode;
}) {
  const heading = cms?.title || title;
  const reviewed = cms?.reviewed ?? false;
  return (
    <main id="main">
      <div className="container page-head">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">{heading}</li>
          </ol>
        </nav>
        <h1 className="h2">{heading}</h1>
        {cms?.updatedAt && <p className="muted">Last updated {formatDate(cms.updatedAt)}</p>}
        {!reviewed && (
          <span className="placeholder-tag">Draft — to be reviewed by FINO JEWELLERY&apos;s legal advisor</span>
        )}
      </div>
      <div className="container" style={{ paddingBottom: "var(--section-y)" }}>
        <div className="prose">{cms ? <PostBody blocks={cms.body} /> : children}</div>
      </div>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: heading, path }])} />
    </main>
  );
}
