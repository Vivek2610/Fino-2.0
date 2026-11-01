/**
 * Moves the website's current content into Sanity, so the studio isn't empty.
 *
 *   cd website
 *   node --env-file=.env.local scripts/seed-sanity.mjs            # create what's missing
 *   node --env-file=.env.local scripts/seed-sanity.mjs --dry-run  # preview only
 *   node --env-file=.env.local scripts/seed-sanity.mjs --force    # overwrite (loses studio edits!)
 *
 * Needs SANITY_API_WRITE_TOKEN (an Editor token) in .env.local.
 * Safe to run more than once: by default it only creates documents that don't
 * exist yet and never touches anything already edited in the studio.
 *
 * Seeded: Site settings, Home page text, Other pages, Legal pages (as drafts
 * to review), the Faceted Gold Bead Necklace + its category, blog categories.
 * NOT seeded: placeholder products, placeholder team members and sample blog
 * posts — add the real ones in the studio.
 */
import { createClient } from "@sanity/client";
import { createReadStream, existsSync } from "node:fs";
import { basename, join } from "node:path";
import { randomUUID } from "node:crypto";

const DRY = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId) exit("NEXT_PUBLIC_SANITY_PROJECT_ID is missing from .env.local");
if (!token && !DRY) exit("SANITY_API_WRITE_TOKEN is missing from .env.local (create an Editor token in sanity.io/manage → API → Tokens)");

const client = createClient({
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-10-01",
  token,
  useCdn: false,
});

function exit(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}
const key = () => randomUUID().replace(/-/g, "").slice(0, 12);
const keyed = (arr) => arr.map((x) => ({ _key: key(), ...x }));

/* ---------------- images ---------------- */
const IMAGES = join(process.cwd(), "public", "images");
const uploaded = new Map();
async function image(file, alt, caption) {
  const path = join(IMAGES, file);
  if (!existsSync(path)) exit(`Image not found: ${path} — run this from the website folder`);
  let id = uploaded.get(file);
  if (!id) {
    if (DRY) id = `image-dry-run-${file}`;
    else {
      const asset = await client.assets.upload("image", createReadStream(path), { filename: basename(path) });
      id = asset._id;
    }
    uploaded.set(file, id);
    console.log(`  ↑ image ${file}`);
  }
  return { _type: "accessibleImage", asset: { _type: "reference", _ref: id }, alt, ...(caption ? { caption } : {}) };
}

/* ---------------- portable text ---------------- */
const block = (text, style = "normal") => ({
  _type: "block",
  _key: key(),
  style,
  markDefs: [],
  children: [{ _type: "span", _key: key(), text, marks: [] }],
});
const heading = (eyebrow, title, emphasis, intro) => ({
  _type: "sectionHeading",
  ...(eyebrow ? { eyebrow } : {}),
  title,
  ...(emphasis ? { emphasis } : {}),
  ...(intro ? { intro } : {}),
});
const cta = (label, href) => ({ _type: "cta", label, href });
const seo = (title, description) => ({ _type: "seo", title, description });

/* ---------------- documents ---------------- */
async function documents() {
  return [
    {
      _id: "productCategory-necklaces",
      _type: "productCategory",
      title: "Necklaces",
      slug: { _type: "slug", current: "necklaces" },
    },
    {
      _id: "product-faceted-gold-bead-necklace",
      _type: "product",
      name: "Faceted Gold Bead Necklace",
      slug: { _type: "slug", current: "faceted-gold-bead-necklace" },
      category: { _type: "reference", _ref: "productCategory-necklaces" },
      summary: "A graduated strand of hammered, faceted gold beads.",
      description: [
        "Polyhedral gold beads, each surface finely hammered to catch the light, graduate in scale toward the centre of the strand.",
        "The facets break light into many small highlights, so the necklace seems to change as it moves. It is finished with a clasp and a short extender chain.",
        "Specifications and trade terms are available on enquiry.",
      ],
      images: keyed([
        await image("fino-collection-01.jpg", "Faceted Gold Bead Necklace on a cream background"),
        await image("fino-product-forest.jpg", "Faceted Gold Bead Necklace on deep green"),
        await image("fino-brand-story.jpg", "Close view of the hammered, faceted beads"),
        await image("fino-necklace-photo.jpg", "Original product photograph of the Faceted Gold Bead Necklace"),
      ]),
      details: [],
      tags: ["necklace", "gold", "faceted"],
      featured: true,
      order: 1,
    },
    ...[
      ["care", "Care & keeping"],
      ["design", "Design"],
      ["trade", "For the trade"],
    ].map(([slug, title]) => ({
      _id: `postCategory-${slug}`,
      _type: "postCategory",
      title,
      slug: { _type: "slug", current: slug },
    })),
    {
      _id: "siteSettings",
      _type: "siteSettings",
      description:
        "FINO JEWELLERY supplies fine gold jewellery to jewellers and retailers, with an Italian-market focus and a quiet touch of Arabian elegance.",
      deliveryHeadline: "Delivering worldwide",
      deliveryNote: "Trade orders are shipped to jewellers and retailers around the world.",
      markets: keyed(
        [
          ["Italy", 45.46, 9.19, true],
          ["London", 51.5, -0.13],
          ["Paris", 48.86, 2.35],
          ["Dubai", 25.2, 55.27],
          ["Riyadh", 24.71, 46.68],
          ["Mumbai", 19.08, 72.88],
          ["Singapore", 1.35, 103.82],
          ["Hong Kong", 22.32, 114.17],
          ["Tokyo", 35.68, 139.69],
          ["Sydney", -33.87, 151.21],
          ["Johannesburg", -26.2, 28.05],
          ["New York", 40.71, -74.0],
          ["Los Angeles", 34.05, -118.24],
          ["São Paulo", -23.55, -46.63],
        ].map(([name, lat, lon, primary]) => ({ _type: "market", name, lat, lon, primary: Boolean(primary) })),
      ),
      craftPoster: await image("fino-craft-poster.jpg", "Close view of the faceted gold beads of the FINO necklace"),
      // email, phone, address, social: deliberately empty — add verified details in the studio
    },
    {
      _id: "homePage",
      _type: "homePage",
      hero: {
        eyebrow: "Fine gold jewellery · For the trade",
        title: "Bold by Nature,",
        emphasis: "Golden by Design.",
        lead: "FINO JEWELLERY creates fine gold jewellery for jewellers and retailers — composed with Italian restraint and a quiet touch of Arabian elegance.",
        primaryCta: cta("Discover our collection", "#collection"),
        secondaryCta: cta("Partner with FINO", "/contact"),
      },
      story: {
        heading: heading(
          "Our philosophy",
          "One golden thread,",
          "from facet to clasp.",
          "FINO JEWELLERY creates fine gold jewellery for the jewellers and retailers who bring it to their own clients. We believe a piece should feel inevitable — bold in presence, exact in its making.",
        ),
        body: "Our design language pairs the clarity of Italian fashion with the geometry and light of Arabian craftsmanship: proportion, rhythm and surface, never ornament for its own sake.",
        image: await image("fino-brand-story.jpg", "Close view of hammered, faceted gold beads from the FINO necklace"),
        pillars: keyed([
          { _type: "pillar", title: "Precision", label: "Every facet considered" },
          { _type: "pillar", title: "Partnership", label: "Built for the trade" },
          { _type: "pillar", title: "Gold", label: "At the heart of it all" },
        ]),
        cta: cta("Become a trade partner", "/contact"),
      },
      collection: {
        heading: heading(
          "The collection",
          "Composed for the jeweller's counter",
          null,
          "A selection for trade partners. Enquire for availability, specifications and terms.",
        ),
        featured: [{ _key: key(), _type: "reference", _ref: "product-faceted-gold-bead-necklace" }],
        ctaLabel: "View the full collection",
      },
      craft: {
        heading: heading(
          "The golden current",
          "Light, moving",
          "across gold",
          "Hammered surfaces and sharp facets, made to hold light differently with every turn.",
        ),
        quote: "Bold by Nature, Golden by Design.",
      },
      team: {
        heading: heading(
          "Our team",
          "The people",
          "behind the gold",
          "Trade relationships at FINO JEWELLERY are personal. Meet the people you will work with.",
        ),
        ctaLabel: "Meet the whole team",
      },
      location: {
        heading: heading(
          "Our house & our reach",
          "One house.",
          "Delivered worldwide.",
          "A single house welcomes trade partners by appointment — and our pieces travel to jewellers across the world.",
        ),
        houseNote: "Trade partners are welcome by appointment at our single location.",
      },
      blog: {
        heading: heading("The FINO Journal", "Our", "blogs", "Stories, guides and ideas on gold, design and the trade."),
        ctaLabel: "Read all articles",
      },
    },
    {
      _id: "page-collection",
      _type: "listingPage",
      heading: heading(
        "The collection",
        "Fine gold,",
        "for the trade",
        "The full FINO JEWELLERY collection. Enquire about any piece for availability, specifications and trade terms.",
      ),
      seo: seo(
        "Collection",
        "The FINO JEWELLERY collection of fine gold jewellery for trade partners. Enquire for availability and terms.",
      ),
    },
    {
      _id: "page-our-team",
      _type: "listingPage",
      heading: heading(
        "Our team",
        "The people",
        "behind the gold",
        "Trade relationships at FINO JEWELLERY are personal. Meet the people you will work with — select a profile to learn more.",
      ),
      seo: seo("Our Team", "Meet the people behind FINO JEWELLERY — the team who look after our trade partners."),
    },
    {
      _id: "page-blog",
      _type: "listingPage",
      heading: heading(
        "The FINO Journal",
        "Notes on",
        "gold, design and the trade",
        "Stories, guides and ideas from FINO JEWELLERY — for the jewellers and retailers we work with.",
      ),
      seo: seo("Blog", "Stories on fine gold jewellery, design and the trade from FINO JEWELLERY."),
    },
    {
      _id: "page-contact",
      _type: "listingPage",
      heading: heading(
        "Contact",
        "Begin a",
        "conversation",
        "For trade partnerships, collection enquiries or an appointment, write to us and the FINO team will reply.",
      ),
      seo: seo("Contact", "Contact FINO JEWELLERY about trade partnerships, collection enquiries or an appointment."),
    },
    {
      _id: "legal-privacy-policy",
      _type: "legalPage",
      title: "Privacy Policy",
      reviewed: false,
      body: [
        block(
          "This page is a starting template. FINO JEWELLERY must replace it with a policy reviewed for the jurisdictions it operates in (for example, the EU GDPR for the Italian market).",
        ),
        block("What this website collects", "h2"),
        block(
          "When you use the contact form we receive the name, email address, subject and message you enter, so we can reply to your enquiry. Enquiries are stored securely in the content management system we use (Sanity), where only authorised FINO JEWELLERY staff can see them, and may also be forwarded to our email inbox. The website does not use advertising or analytics cookies. Contact-form submissions are checked by Google reCAPTCHA to block automated spam. reCAPTCHA collects hardware and software information (such as device and browser data) and sends it to Google for analysis; Google's Privacy Policy and Terms of Service apply.",
        ),
        block("How it is used", "h2"),
        block("Enquiry details are used only to respond to you and to manage any resulting trade relationship."),
        block("Your rights", "h2"),
        block("You may ask to access, correct or delete the personal data you have sent us by using the contact form."),
        block("Controller details", "h2"),
        block("Company name, registered address and contact for data-protection requests: to be supplied."),
      ],
      seo: seo("Privacy Policy", "How FINO JEWELLERY handles personal data submitted through this website."),
    },
    {
      _id: "legal-terms",
      _type: "legalPage",
      title: "Terms",
      reviewed: false,
      body: [
        block("This page is a starting template. FINO JEWELLERY must replace it with terms reviewed by its legal advisor."),
        block("Use of this website", "h2"),
        block(
          "The content of this website, including imagery and the FINO JEWELLERY logo, belongs to FINO JEWELLERY and may not be reproduced without permission.",
        ),
        block("Product information", "h2"),
        block(
          "Collection pieces are shown for trade enquiry. Availability, specifications and commercial terms are confirmed individually and are not offered through this website.",
        ),
      ],
      seo: seo("Terms", "Terms of use for the FINO JEWELLERY website."),
    },
  ];
}

/* ---------------- run ---------------- */
console.log(`\nSeeding Sanity project ${projectId} / ${dataset}${DRY ? " (dry run)" : ""}${FORCE ? " — FORCE overwrite" : ""}\n`);
const docs = await documents();
if (DRY) {
  for (const d of docs) console.log(`  • ${d._type.padEnd(16)} ${d._id}`);
  console.log(`\n${docs.length} documents would be created. Nothing was written.\n`);
  process.exit(0);
}
const tx = client.transaction();
for (const d of docs) (FORCE ? tx.createOrReplace(d) : tx.createIfNotExists(d));
await tx.commit({ visibility: "async" });
for (const d of docs) console.log(`  ✓ ${d._type.padEnd(16)} ${d._id}`);
console.log(
  `\nDone. ${docs.length} documents ${FORCE ? "written" : "created where missing"}.` +
    `\nOpen the studio to review them. Remove SANITY_API_WRITE_TOKEN from .env.local when you no longer need it.\n`,
);
