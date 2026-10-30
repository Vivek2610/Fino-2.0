import ContactSection from "@/components/home/ContactSection";
import JsonLd from "@/components/seo/JsonLd";
import { getListingPage } from "@/lib/content";
import { breadcrumbJsonLd, listingMetadata } from "@/lib/seo";

export const revalidate = 3600;

export async function generateMetadata() {
  return listingMetadata(await getListingPage("page-contact"), "/contact");
}

export default async function ContactPage() {
  const page = await getListingPage("page-contact");
  return (
    <main id="main" style={{ paddingTop: "var(--nav-h)" }}>
      <ContactSection heading={page.heading} headingLevel={1} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
    </main>
  );
}
