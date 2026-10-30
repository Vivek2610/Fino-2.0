import LegalPage from "@/components/layout/LegalPage";
import { pageMetadata } from "@/lib/seo";
import { getLegalPage } from "@/lib/content";

export const revalidate = 3600;

export async function generateMetadata() {
  const cms = await getLegalPage("legal-terms");
  const meta = pageMetadata({
    title: cms?.seo?.title ?? (cms?.title || "Terms"),
    description: cms?.seo?.description ?? "Terms of use for the FINO JEWELLERY website.",
    path: "/terms",
    image: cms?.seo?.ogImage,
  });
  return cms?.seo?.noindex ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function TermsPage() {
  const cms = await getLegalPage("legal-terms");
  return (
    <LegalPage title="Terms" path="/terms" cms={cms}>
      <p>
        This page is a starting template. FINO JEWELLERY must replace it with terms reviewed by its legal advisor.
      </p>
      <h2>Use of this website</h2>
      <p>
        The content of this website, including imagery and the FINO JEWELLERY logo, belongs to FINO JEWELLERY and may
        not be reproduced without permission.
      </p>
      <h2>Product information</h2>
      <p>
        Collection pieces are shown for trade enquiry. Availability, specifications and commercial terms are confirmed
        individually and are not offered through this website.
      </p>
    </LegalPage>
  );
}
