import { notFound } from "next/navigation";
import CollectionIndex from "@/components/products/CollectionIndex";
import { getProductCategories, getProducts } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600;
type Params = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  return (await getProductCategories()).map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Params) {
  const { category } = await params;
  const c = (await getProductCategories()).find((x) => x.slug === category);
  if (!c) return {};
  return pageMetadata({
    title: `${c.title} — Collection`,
    description: c.description ?? `${c.title} from the FINO JEWELLERY collection of fine gold jewellery for the trade.`,
    path: `/collection/category/${c.slug}`,
  });
}

export default async function CollectionCategoryPage({ params }: Params) {
  const { category } = await params;
  const c = (await getProductCategories()).find((x) => x.slug === category);
  if (!c) notFound();
  const products = (await getProducts()).filter((p) => p.category?.slug === c.slug);
  return (
    <CollectionIndex
      products={products}
      activeCategory={c}
      path={`/collection/category/${c.slug}`}
      title={<>{c.title}</>}
      intro={c.description ?? `${c.title} from the FINO JEWELLERY collection. Enquire for availability, specifications and terms.`}
    />
  );
}
