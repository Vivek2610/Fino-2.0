import HeroSection from "@/components/home/HeroSection";
import BrandStorySection from "@/components/home/BrandStorySection";
import CollectionSection from "@/components/home/CollectionSection";
import CraftVideoSection from "@/components/home/CraftVideoSection";
import TeamSection from "@/components/home/TeamSection";
import LocationSection from "@/components/home/LocationSection";
import BlogSection from "@/components/home/BlogSection";
import CinematicNecklaceJourney from "@/components/motion/CinematicNecklaceJourney";
import { getHomeContent } from "@/lib/content";
import { getSiteSettings } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 3600; // refresh from the CMS hourly (ISR); publishing revalidates instantly

export async function generateMetadata() {
  const [home, settings] = await Promise.all([getHomeContent(), getSiteSettings()]);
  const meta = pageMetadata({
    path: "/",
    description: home.seo?.description ?? settings.description,
    image: home.seo?.ogImage ?? settings.defaultOgImage ?? undefined,
  });
  // A custom home title replaces the default "FINO JEWELLERY — tagline" in full.
  if (home.seo?.title) {
    meta.title = { absolute: home.seo.title };
    meta.openGraph = { ...meta.openGraph, title: home.seo.title };
    meta.twitter = { ...meta.twitter, title: home.seo.title };
  }
  if (home.seo?.noindex) meta.robots = { index: false, follow: true };
  return meta;
}

export default async function HomePage() {
  const home = await getHomeContent();
  return (
    <>
      <CinematicNecklaceJourney />
      <main id="main">
        <HeroSection content={home.hero} />
        <BrandStorySection content={home.story} />
        <CollectionSection content={home.collection} />
        <CraftVideoSection content={home.craft} />
        <TeamSection content={home.team} />
        <LocationSection content={home.location} />
        <BlogSection content={home.blog} />
      </main>
    </>
  );
}
