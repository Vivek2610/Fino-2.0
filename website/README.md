# FINO JEWELLERY — cinematic B2B website

*Bold by Nature, Golden by Design.*

A Next.js (App Router) site built around one idea: **the golden thread**. Your real necklace photograph unknots as the visitor scrolls and flows through every section as a single strand of real beads. The seven facets of your logo lift away, ride along the necklace, and lock back into the exact logo at the location section.

## Run it

Requires Node.js 18.18+ (20 or 22 recommended).

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## Technologies

- Next.js 15 (App Router, server components by default), React 19, TypeScript
- GSAP 3 + ScrollTrigger: scroll state, `gsap.matchMedia()` breakpoints and reduced-motion, reveal animations, render ticker
- Canvas 2D for the necklace and facets: one fixed, pointer-events-free layer
- Custom CSS design tokens in `app/globals.css`
- Self-hosted fonts via `next/font/local`: Playfair Display (headings) and Manrope (text), matching the FINO Figma file
- Next.js Metadata API, JSON-LD, `sitemap.ts`, `robots.ts`

## Project structure

```
app/                      routes: /, /collection, /collection/[slug], /our-team,
                          /contact, /privacy-policy, /terms, api/contact, sitemap, robots
components/layout/        Navbar, MobileMenu, Footer, LegalPage
components/home/          Hero, BrandStory, Collection, CraftVideo, Team, Location, Contact
components/motion/        CinematicNecklaceJourney (the necklace engine), ScrollExperience (reveals)
components/products/      ProductCard, ProductGrid
components/forms/         ContactForm
components/seo/           JsonLd
lib/site-config.ts        brand, contact and location details (edit here)
lib/products.ts           collection data
lib/team.ts               team profiles
lib/necklace-choreography.ts   the necklace path for each section (desktop + mobile)
lib/necklace-data.json    bead pieces: atlas positions, arc positions, angles
lib/logo-facets.json      the 7 logo facets: exact positions inside the logo
scripts/segment-necklace.py    regenerates the bead pieces from a necklace photo
public/images/            all images (see "Assets")
```

## How the necklace journey works

1. **Real pieces, not a redraw.** `scripts/segment-necklace.py` cuts the necklace out of your photo, traces the strand's centre line, and splits it at the narrow joints between beads. The result is 23 beads plus the clasp and chain links, saved to `fino-necklace-beads.png` with their metadata. Each piece overlaps its neighbours by 3 px so no seams open when the strand bends.
2. **Hero.** At scroll 0, each piece is drawn at its exact photographed position, which recreates the original necklace pixel for pixel. The hero then holds still briefly (`heroHold` in the choreography file: 0.9 of a screen on desktop, 0.6 on mobile) while the 7 logo facets come apart one by one and swirl onto the necklace, before the necklace lifts away.
3. **Unknotting.** Each homepage section has a keyframe curve in `lib/necklace-choreography.ts`. A keyframe is fully reached when its section is centred in the viewport. Between keyframes the strand interpolates, one end leading, with a travelling "breeze" wave that also responds to scroll speed. The beads keep their real spacing along the curve and trail slightly behind it, which gives the elastic follow-through.
4. **Never over or under content: the track.** After the hero, the necklace glides along one continuous route through empty space only. It runs down one side margin, crosses through the empty padding gap between two sections, then runs down the other margin, finally coming to rest just above the footer. The route is measured live from the page (section edges, padding and margins), so it adapts to every screen size. `sides` in `lib/necklace-choreography.ts` chooses the margin ("L" or "R") for each section; the necklace changes sides wherever two neighbouring sections differ. The canvas ignores clicks.
5. **Logo facets.** `public/images/fino-logo-facets.png` holds the 7 facets cut straight from your logo. They were verified to reassemble into the original with zero pixel difference. They lift out of the hero logo and ride on the beads. The journey ends at the bottom of the collection section (`stopAt` in `lib/necklace-choreography.ts`): the strand settles flat in the empty space under "View the full collection", and the facets fly up and lock into the logo seal there (`#fx-final-logo`). Once all 7 are home, the real `<img>` logo is shown and stays still.
6. **Fully scroll-bound and reversible.** Scrolling up replays everything backwards.
7. **Accessibility and fallbacks.** With `prefers-reduced-motion`, Save-Data on, or JavaScript or assets unavailable, the engine doesn't run. Visitors see the static necklace cutout and the complete logo instead. All copy is real HTML.

To re-route the necklace, change the `sides` map (and `sway`, `trackScale`, `wind`) in `lib/necklace-choreography.ts`.

## Design system (from the Figma)

Colours live as CSS variables at the top of `app/globals.css`: forest `#062314`, button green `#0B3821`, brand green `#214A3B`, gold `#C5A059` / `#D4AF37` / `#775A19` / `#E8D8B0`, cream `#FAF8F5`, linen `#F4F1EA`, line `#E5DEC9`, ink `#002110`, body `#414942`. The navbar reads `data-nav="dark" | "light"` on each section and switches theme as you scroll.

## Delivery map

The location section shows a dotted world map (`public/images/world-dots.svg`, generated from Natural Earth land data) with gold pins. Pins come from `siteConfig.delivery.markets` in `lib/site-config.ts`. They are illustrative until you replace them with the markets you really serve. Set `siteConfig.location.coordinates` to add a pin for the house itself; delivery arcs then start from it.

## Assets

| File | What it is |
|---|---|
| `public/images/fino-logo.png` | Your logo, cropped to its edges (unaltered pixels) |
| `public/images/fino-logo-facets.png` | The 7 facets of the logo, exact cut-outs |
| `public/images/fino-necklace-cutout.png` | Necklace on transparent background, from your photo |
| `public/images/fino-necklace-beads.png` | Bead/clasp/link pieces for the animation |
| `public/images/fino-collection-01.jpg`, `fino-brand-story.jpg`, `fino-craft-poster.jpg` | Your necklace composed on warm ivory |
| `public/og-image.jpg` | Social sharing image |
| `public/videos/` | Put the craft video here (see below) |

## Replacing content

- **Necklace photo:** run `python3 scripts/segment-necklace.py <photo.png> <out-dir>` (needs numpy, scipy, Pillow), then copy `fino-necklace-cutout.png` and `fino-necklace-beads.png` into `public/images/` and `necklace-data.json` into `lib/`. The script's loop centre (`cx, cy`) and opening point (`OPEN`) are tuned for the current photo, so adjust them for a different one.
- **Logo:** run `python3 scripts/split-logo.py path/to/logo.png` (transparent PNG, shapes separated by gaps). It rewrites `fino-logo.png`, `fino-logo-facets.png` and `lib/logo-facets.json`. If the new logo has a different number of facets, update `FACET_ORDER` and `FACET_ATTACH` in `CinematicNecklaceJourney.tsx`.
- **Everything else** (text, products, team, blog, contact details, address, delivery map, campaign film, legal pages, SEO) is edited in Sanity. See "Sanity CMS" below.
- Once the street, city and country are filled in under Site settings, the "Get directions" button appears and the structured data becomes `JewelryStore` with an address. Empty contact fields show a clearly marked placeholder.

## Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production URL. Used for canonical URLs, sitemap and Open Graph. |
| `CONTACT_WEBHOOK_URL` | Option A: contact form POSTs JSON here (Zapier, Make, a CRM…) |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Option B: send enquiries by email via Resend |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`, `NEXT_PUBLIC_RECAPTCHA_VERSION` | Google reCAPTCHA (v2 checkbox, default, or v3 invisible) on the contact form, verified on the server. Leave keys empty to disable. |
| `SANITY_API_WRITE_TOKEN` | Saves every enquiry to the studio's **Enquiries** inbox (private: IDs start with `enquiry.`). Works alongside email/webhook; the visitor sees success if at least one succeeds. |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity connection (project `2b5hsmi7`, dataset `production`) |
| `SANITY_API_READ_TOKEN` | Optional Viewer token. Only needed if the dataset is made private. |
| `SANITY_API_WRITE_TOKEN` | Editor token, only for `scripts/seed-sanity.mjs`. Remove it afterwards. |
| `SANITY_REVALIDATE_SECRET` | Shared secret for the publish webhook (`/api/revalidate`) |

Until one delivery option is configured, the form validates and then honestly reports that enquiries aren't connected (HTTP 503). It never fakes a success. Spam protection is a honeypot, a minimum time on the page, and a per-IP rate limit.

## Sanity CMS

The content lives in Sanity (project `2b5hsmi7`, dataset `production`). The editing dashboard, called the studio, is the sibling folder `studio-fino-jewellery`.

**Folder layout**

```
fino necklace/
├── website/                 ← this Next.js site
└── studio-fino-jewellery/   ← Sanity Studio (the dashboard)
```

**What is edited where**

| Studio section | Controls on the website |
|---|---|
| Site settings | Company description, email, phone, address, opening hours, map link and pin, delivery-map markets, social profiles, campaign film and poster, default share image |
| Home page | Every text and button in the hero, philosophy, collection, film, team, location and contact sections; the philosophy image; which products the homepage shows; homepage SEO |
| Other pages | Heading and SEO for `/collection`, `/our-team`, `/blog`, `/contact` |
| Collection → Products / Categories | `/collection`, `/collection/[slug]`, `/collection/category/[slug]` |
| Team members | `/our-team`, `/our-team/[slug]` and the homepage team cards (first three by display order) |
| Blog → Posts / Categories | `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, the RSS feed |
| Legal pages | `/privacy-policy`, `/terms`. The "Draft — to be reviewed" label disappears once "Reviewed" is ticked. |
| Redirects | Old URL → new URL (loaded at build/start, so redeploy after adding one) |

**Fixed in code on purpose:** the logo, the necklace animation and its images, the brand name and tagline, and the menu.

**How the code reads it:** `lib/sanity/` holds the client, the GROQ queries, image URLs and the Portable Text converter.
- `lib/products.ts`, `lib/team.ts` and `lib/blog.ts` turn CMS documents into the types the pages already use.
- `lib/settings.ts` (Site settings) and `lib/content.ts` (Home, Other pages, Legal) do the same for page text.
- Every text has a built-in default, and an empty CMS field keeps it. If Sanity is unreachable or a list is still empty, the site shows the built-in content, so it never breaks.

**Instant updates.** Pages refresh from Sanity at least hourly. To make published changes appear within seconds, add a webhook at sanity.io/manage → your project → API → Webhooks:
- **URL:** `https://YOUR-DOMAIN/api/revalidate`
- **Dataset:** `production`
- **Trigger on:** Create, Update, Delete
- **Filter:** leave empty
- **HTTP method:** POST
- **Secret:** the same value as `SANITY_REVALIDATE_SECRET`

**First-time content.** To move the current content into the studio, run `node --env-file=.env.local scripts/seed-sanity.mjs` from this folder. Preview it first with `--dry-run`. The script:
- needs `SANITY_API_WRITE_TOKEN`;
- only creates what's missing, so it's safe to re-run;
- doesn't create placeholder people or products, or the sample posts.

**URLs** come from each document's slug, for example `/our-team/vivek-prakash`. Slugs are lowercase letters, numbers and hyphens, and unique per type. If you change a published slug, add a Redirect.

## Known limitations

- The Higgsfield-generated craft video and cutout live in your Higgsfield library. This build environment couldn't download them, so the site currently uses a locally made cutout and a still poster.
- Until real content is published in Sanity, product 02–04, the team, the address, hours, email and showroom photo are placeholders.
- The privacy policy and terms are starting templates for legal review.

## Blog & CMS

Routes (all statically generated, refreshed hourly and instantly on publish via the webhook):

| Route | What it is |
|---|---|
| `/blog` | Blog listing: featured latest post, then a grid, plus category chips |
| `/blog/page/[n]` | Pagination (6 posts per page, crawlable links with rel prev/next) |
| `/blog/category/[slug]` (+ `/page/[n]`) | Posts in one category |
| `/blog/[slug]` | Article: breadcrumbs, cover, body, tags, trade CTA, related posts |
| `/blog/rss.xml` | RSS feed |

**SEO built in:** unique titles and descriptions, canonical URLs, Open Graph `article` tags (published/modified time, section, tags), `BlogPosting` + `BreadcrumbList` + `Blog` JSON-LD, sitemap entries, an RSS `<link rel="alternate">`, semantic `<article>`/`<time>` markup and one `<h1>` per page. Optional per-post `seo` overrides (title, description, OG image, noindex) come from the CMS.

**Content:** posts come from Sanity (Blog → Posts). The rich-text body supports headings, quotes, lists, bold, italic, links and images; `lib/sanity/mappers.ts` converts it for `components/blog/PostBody.tsx`.

**Sample posts:** until the first real post is published, three samples marked `sample: true` are shown. They are labelled, `noindex`, and left out of the sitemap, RSS and structured data. Avoid post slugs named `page`, `category` or `rss.xml`.

## Collection & CMS

| Route | What it is |
|---|---|
| `/collection` | All pieces as Edition cards, category chips, trade enquiry band |
| `/collection/category/[slug]` | Pieces in one category |
| `/collection/[slug]` | Product page: image gallery with thumbnails, description, specifications, enquiry button, related pieces |

Products come from Sanity (Collection → Products). The homepage shows the products picked under Home page → Collection, or else those marked "featured". Photos are shown at 3:4, cropped around the hotspot set in the studio. Until the first product is published, the built-in necklace and placeholders are shown.

**SEO:** each page has its own title, description and canonical URL. There's `Product` JSON-LD (no prices or reviews are ever invented), `CollectionPage` + `ItemList` on listings, and breadcrumbs. Real products and categories are listed in the sitemap. Placeholder products are labelled, `noindex`, and left out of the sitemap and structured data.

## Scroll animations

Add `data-reveal` to any element for a fade-and-rise, or use a variant: `data-reveal="card"` (the card rises and its image unveils and settles), `data-reveal="clip"` (curtain reveal) or `data-reveal="scale"`. Put `data-stagger` on a parent to make its children reveal one after another. Everything is visible without JavaScript, and reduced-motion users see the content immediately.

## Team & CMS

| Route | What it is |
|---|---|
| `/our-team` | Every team member as a clickable card, plus a "Contact the team" band |
| `/our-team/[slug]` | Profile: portrait, role, biography, "looks after", languages, email or contact button, professional links, other team members |

People come from Sanity (Team members). The homepage team section shows the first three by display order, plus a "Meet the whole team" button. Portraits are shown at 4:5, cropped around the studio hotspot. Until the first person is published, three labelled placeholders are shown.

**SEO:** each profile is a `ProfilePage` with `Person` structured data (job title, organisation, languages, expertise, professional links), and the team page is an `AboutPage` listing the people. Breadcrumbs and canonical URLs are included. Real people go into the sitemap. Placeholder profiles are labelled, `noindex`, and left out of the sitemap and structured data.

## SEO checklist (applies site-wide)

- Set `NEXT_PUBLIC_SITE_URL` to the live domain before deploying, so canonical URLs, Open Graph, the sitemap and robots.txt point at it. Until then they show `http://localhost:3000`.
- Every page has its own title, description, canonical URL, social-share image and exactly one `<h1>`. Every image has alt text.
- Structured data: Organization and WebSite (all pages), BreadcrumbList (sub-pages), Product, CollectionPage and ItemList (collection), Blog and BlogPosting (blog), AboutPage, ProfilePage and Person (team).
- The main menu links to real pages (`/collection`, `/our-team`, `/blog`, `/contact`), so crawlers find everything through plain links.
