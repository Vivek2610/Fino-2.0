import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import JsonLd from "@/components/seo/JsonLd";
import ScrollExperience from "@/components/motion/ScrollExperience";
import { siteConfig } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/settings";
import { organizationJsonLd, websiteJsonLd, pageMetadata } from "@/lib/seo";

const serif = localFont({
  src: [
    { path: "./fonts/playfair-display-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/playfair-display-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/playfair-display-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
  display: "swap",
});

const sans = localFont({
  src: [
    { path: "./fonts/manrope-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "./fonts/manrope-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "./fonts/manrope-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "./fonts/manrope-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...pageMetadata({ path: "/" }),
  applicationName: siteConfig.name,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#062314",
  width: "device-width",
  initialScale: 1,
};

// suppressHydrationWarning on <html>: this boot script adds the `js` class
// before React hydrates, which is intentional.
// Marks JS as available (enables reveal styles). Safety net: if the motion
// layer never initialises, content is made visible again.
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!d.classList.contains('reveal-ready'))d.classList.remove('js')},2500)})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  return (
    <html lang={siteConfig.locale} className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      {/* suppressHydrationWarning: extensions like Grammarly add attributes to <body> before React loads */}
      <body suppressHydrationWarning>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Navbar />
        {children}
        <Footer />
        <ScrollExperience />
        <JsonLd data={organizationJsonLd(settings)} />
        <JsonLd data={websiteJsonLd()} />
      </body>
    </html>
  );
}
