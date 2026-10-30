import CollectionIndex from "@/components/products/CollectionIndex";
import { getProducts } from "@/lib/products";
import { listingMetadata } from "@/lib/seo";
import { getListingPage } from "@/lib/content";
import Title from "@/components/content/Title";

export const revalidate = 3600; // refresh from the CMS hourly (ISR); publishing revalidates instantly

export async function generateMetadata() {
  return listingMetadata(await getListingPage("page-collection"), "/collection");
}

export default async function CollectionPage() {
  const [products, page] = await Promise.all([getProducts(), getListingPage("page-collection")]);
  const h = page.heading;
  return (
    <CollectionIndex
      products={products}
      path="/collection"
      eyebrow={h.eyebrow}
      title={<Title title={h.title} emphasis={h.emphasis} />}
      intro={h.intro ?? ""}
    />
  );
}
