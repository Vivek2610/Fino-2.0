/**
 * Scroll choreography for the necklace + logo facets.
 *
 * 1. HERO — the real necklace sits in its photographed shape with the logo in
 *    its loop. The hero holds while the 7 logo facets lift onto the beads,
 *    then the necklace unclasps and lifts onto the TRACK.
 *
 * 2. TRACK — one continuous route through the page's EMPTY space only (it
 *    ends at the bottom of the `stopAt` section, where the logo reassembles):
 *    down one side margin, across the empty padding gap between two sections,
 *    down the other side margin, and so on, finishing at rest in the bottom
 *    padding of the `stopAt` section. The necklace glides along it like a thread, so it changes sides
 *    without ever touching text, images or cards. The route is measured live
 *    from the page (section edges, padding, margins) in the engine.
 *
 * `sides` sets which margin each section's stretch uses ("R" or "L").
 */

export type Side = "L" | "R";

export type Keyframe = {
  key: string;
  shape: "hero";
  scale: number;
  wind: number;
  waves: number;
};

export type Choreography = {
  keyframes: Keyframe[];
  /** margin per homepage section, in page order after the hero */
  sides: Record<string, Side>;
  /** section where the journey ends: the strand rests in its bottom padding and
      the logo reassembles there (element #fx-final-logo) */
  stopAt: string;
  /** bead size on the track (also capped to fit the margin) */
  trackScale: number;
  /** breeze amplitude on the track, px (capped to the margin) */
  wind: number;
  waves: number;
  /** gentle S-curve inside each margin, as a fraction of the margin width */
  sway: number;
  /** facet size while travelling, relative to source logo px */
  facetTravelScale: number;
  facetOrbit: number;
  dprCap: number;
  glints: number;
  /** viewport heights of scroll the hero holds while the logo comes apart */
  heroHold: number;
};

const hero: Keyframe = { key: "hero", shape: "hero", scale: 1, wind: 0, waves: 0 };

// story → right, collection → left, film → right, team → left,
// location → right (next to the house card where the logo reassembles), contact → left
const sides: Record<string, Side> = {
  story: "R",
  collection: "L",
  craft: "R",
  team: "L",
  location: "R",
  contact: "L",
};

export const desktop: Choreography = {
  keyframes: [hero],
  sides,
  stopAt: "collection",
  trackScale: 0.3,
  wind: 10,
  waves: 2.2,
  sway: 0.3,
  heroHold: 0.9,
  dprCap: 2,
  facetTravelScale: 0.2,
  facetOrbit: 4,
  glints: 3,
};

export const mobile: Choreography = {
  keyframes: [hero],
  sides,
  stopAt: "collection",
  trackScale: 0.15,
  wind: 2,
  waves: 1.6,
  sway: 0,
  heroHold: 0.6,
  dprCap: 1.5,
  facetTravelScale: 0.11,
  facetOrbit: 2,
  glints: 2,
};
