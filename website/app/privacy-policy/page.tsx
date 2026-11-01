import LegalPage from "@/components/layout/LegalPage";
import { pageMetadata } from "@/lib/seo";
import { getLegalPage } from "@/lib/content";

export const revalidate = 3600;

export async function generateMetadata() {
  const cms = await getLegalPage("legal-privacy-policy");
  const meta = pageMetadata({
    title: cms?.seo?.title ?? (cms?.title || "Privacy Policy"),
    description: cms?.seo?.description ?? "How FINO JEWELLERY handles personal data submitted through this website.",
    path: "/privacy-policy",
    image: cms?.seo?.ogImage,
  });
  return cms?.seo?.noindex ? { ...meta, robots: { index: false, follow: true } } : meta;
}

export default async function PrivacyPage() {
  const cms = await getLegalPage("legal-privacy-policy");
  return (
    <LegalPage title="Privacy Policy" path="/privacy-policy" cms={cms}>
      <p>
        This page is a starting template. FINO JEWELLERY must replace it with a policy reviewed for the
        jurisdictions it operates in (for example, the EU GDPR for the Italian market).
      </p>
      <h2>What this website collects</h2>
      <p>
        When you use the contact form we receive the name, email address, subject and message you enter, so we can
        reply to your enquiry. Enquiries are stored securely in the content management system we use (Sanity),
        where only authorised FINO JEWELLERY staff can see them, and may also be forwarded to our email inbox. The
        website does not use advertising or analytics cookies. Contact-form submissions are checked by Google reCAPTCHA to block automated spam. reCAPTCHA collects hardware and software information (such as device and browser data) and sends it to Google for analysis; Google's Privacy Policy and Terms of Service apply.
      </p>
      <h2>How it is used</h2>
      <p>Enquiry details are used only to respond to you and to manage any resulting trade relationship.</p>
      <h2>Your rights</h2>
      <p>You may ask to access, correct or delete the personal data you have sent us by using the contact form.</p>
      <h2>Controller details</h2>
      <p>Company name, registered address and contact for data-protection requests: to be supplied.</p>
    </LegalPage>
  );
}
