"use client";

/**
 * CinematicNecklaceJourney
 * ------------------------------------------------------------------
 * The supplied necklace photograph has been cut (offline, see
 * scripts/segment-necklace.py) into its real individual beads, clasp and
 * chain links — no pixels are invented. Each piece knows where it sat on the
 * original strand. Here we lay those real pieces along a curve that changes
 * with scroll, so the necklace "unknots" from its photographed shape into a
 * flowing golden thread and travels through the page.
 *
 * The 7 polygon facets of the logo are likewise exact cut-outs of the supplied
 * logo file. They lift away, ride along the necklace, and lock back into the
 * exact original logo in the location section, where the original <img> is
 * then shown and held still.
 *
 * Rendering: one fixed, pointer-events:none canvas that sits ABOVE section
 * backgrounds but BELOW all content (see .layer in globals.css), so it never
 * covers text, buttons or images. Everything is bound to scroll position and
 * fully reversible. Reduced-motion users get the static composition.
 */

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import necklace from "@/lib/necklace-data.json";
import logo from "@/lib/logo-facets.json";
import { desktop, mobile, type Choreography, type Side } from "@/lib/necklace-choreography";

type Pt = { x: number; y: number };
type Poly = { pts: Pt[]; cum: number[]; len: number };

const M = 96; // samples per strand
const TAU = Math.PI * 2;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const angleLerp = (a: number, b: number, t: number) => {
  let d = ((b - a + Math.PI) % TAU) - Math.PI;
  if (d < -Math.PI) d += TAU;
  return a + d * t;
};

function makePoly(pts: Pt[]): Poly {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
}

/** Point + tangent angle at arc length s, extrapolating straight beyond the ends. */
function sampleAt(p: Poly, s: number): { x: number; y: number; a: number } {
  const { pts, cum, len } = p;
  const n = pts.length;
  if (s <= 0) {
    const a = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x);
    return { x: pts[0].x + Math.cos(a) * s, y: pts[0].y + Math.sin(a) * s, a };
  }
  if (s >= len) {
    const a = Math.atan2(pts[n - 1].y - pts[n - 2].y, pts[n - 1].x - pts[n - 2].x);
    const e = s - len;
    return { x: pts[n - 1].x + Math.cos(a) * e, y: pts[n - 1].y + Math.sin(a) * e, a };
  }
  let lo = 0,
    hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < s) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const t = (s - cum[lo]) / seg;
  // smoothed tangent over neighbouring segments
  const i0 = Math.max(0, lo - 1),
    i1 = Math.min(n - 1, hi + 1);
  const a = Math.atan2(pts[i1].y - pts[i0].y, pts[i1].x - pts[i0].x);
  return { x: lerp(pts[lo].x, pts[hi].x, t), y: lerp(pts[lo].y, pts[hi].y, t), a };
}

/** Resample `count` points over [from, from+length] of a poly. */
function sliceStrand(p: Poly, from: number, length: number, count = M): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k < count; k++) {
    const q = sampleAt(p, from + (length * k) / (count - 1));
    out.push({ x: q.x, y: q.y });
  }
  return out;
}

function catmullRom(ctrl: Pt[], perSeg = 28): Pt[] {
  const P = [ctrl[0], ...ctrl, ctrl[ctrl.length - 1]];
  const out: Pt[] = [];
  for (let i = 0; i < P.length - 3; i++) {
    const [p0, p1, p2, p3] = [P[i], P[i + 1], P[i + 2], P[i + 3]];
    for (let j = 0; j < perSeg; j++) {
      const t = j / perSeg,
        t2 = t * t,
        t3 = t2 * t;
      out.push({
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
      });
    }
  }
  out.push(ctrl[ctrl.length - 1]);
  return out;
}

const SPRITES = necklace.sprites;
const N_SPR = SPRITES.length;
const L = necklace.length;
const HERO_LINE = necklace.centerline.map(([x, y]) => ({ x, y }));
const HERO_POLY_SRC = makePoly(HERO_LINE);
// order in which logo facets lift away (top bar first, stem last)
const FACET_ORDER = [1, 0, 4, 2, 3, 5, 6];
// bead each facet rides beside, as a fraction along the strand
const FACET_ATTACH = [0.2, 0.33, 0.46, 0.58, 0.7, 0.8, 0.9];

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => res(im);
    im.onerror = rej;
    im.src = src;
  });
}

/** Downscaled copies of an atlas, so small beads stay crisp (no aliasing). */
function mipChain(img: HTMLImageElement) {
  const levels: { img: CanvasImageSource; f: number }[] = [{ img, f: 1 }];
  let src: CanvasImageSource = img;
  let w = img.naturalWidth,
    h = img.naturalHeight;
  for (let f = 0.5; f >= 0.125; f /= 2) {
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(w / 2));
    c.height = Math.max(1, Math.round(h / 2));
    const x = c.getContext("2d")!;
    x.imageSmoothingQuality = "high";
    x.drawImage(src, 0, 0, c.width, c.height);
    levels.push({ img: c, f });
    src = c;
    w = c.width;
    h = c.height;
  }
  return (scale: number) => {
    let best = levels[0];
    for (const l of levels) if (l.f >= scale * 1.15) best = l;
    return best;
  };
}

function startEngine(canvas: HTMLCanvasElement, cfg: Choreography, beadsImg: HTMLImageElement, facetsImg: HTMLImageElement) {
  const ctx = canvas.getContext("2d")!;
  const beadMip = mipChain(beadsImg);
  const facetMip = mipChain(facetsImg);
  const heroSlot = document.getElementById("fx-hero-slot");
  const heroLogo = document.getElementById("fx-hero-logo");
  const locLogo = document.getElementById("fx-final-logo");

  let vw = 0,
    vh = 0,
    dpr = 1;
  let scrollY = window.scrollY;
  let vel = 0;
  let needSnap = true;
  let lastT = performance.now();
  let heroDom = "",
    locDom = "";
  // width of the empty page margin on each side of the content box
  let margin = 80;
  // 0 while the necklace is in the hero, 1 once it travels on the track
  let laneMix = 0;
  // scroll position at which the necklace settles at the end of its journey
  // (the logo facets reassemble around this moment)
  let settleAt = 0;

  /* ---- the TRACK: a route through empty space only, in document coordinates ---- */
  let track: Poly | null = null;
  // piecewise-linear map: "target line" document y → arc length along the track
  let mapY: number[] = [];
  let mapS: number[] = [];

  // displayed (smoothed) state per bead
  const disp = SPRITES.map(() => ({ x: 0, y: 0, r: 0, s: 1 }));

  function resize() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, cfg.dprCap);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    measure();
    needSnap = true;
  }

  const wide = () => margin >= 56;
  /** x of a margin lane. du: -1 = content edge … +1 = viewport edge */
  function laneX(side: Side, du: number) {
    // phones: a fine strand with a little air from the screen edge
    if (!wide()) return side === "R" ? vw - 12 + du * 1.5 : 12 - du * 1.5;
    // desktop: sit a little inside the middle of the margin, so there is
    // breathing space both from the screen edge and from the content
    const c = margin * 0.55;
    const off = du * margin * 0.08;
    return side === "R" ? vw - c + off : c - off;
  }
  function trackScale() {
    // widest bead in the photo is ~130px; keep it within ~38% of the margin
    return wide() ? Math.min(cfg.trackScale, (margin * 0.38) / 130) : Math.min(cfg.trackScale, 0.12);
  }
  function trackWind(w: number) {
    return wide() ? Math.min(w, margin * 0.06) : Math.min(w, 1.5);
  }

  function measure() {
    const c = document.querySelector<HTMLElement>("main .container");
    if (c) {
      const cs = getComputedStyle(c);
      const contentW = c.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      margin = Math.max(8, (vw - contentW) / 2);
    }
    const sy = window.scrollY;
    buildTrack(sy);
  }

  function buildTrack(sy: number) {
    const main = document.querySelector("main");
    if (!main) return;
    const all = Array.from(main.children).filter(
      (el) => el instanceof HTMLElement && el.dataset.fxKey && el.dataset.fxKey !== "hero",
    ) as HTMLElement[];
    // the journey ends in the section named by cfg.stopAt
    const stopIdx = all.findIndex((el) => el.dataset.fxKey === cfg.stopAt);
    const secs = stopIdx >= 0 ? all.slice(0, stopIdx + 1) : all;
    const heroEl = main.querySelector<HTMLElement>('[data-fx-key="hero"]');
    if (!secs.length || !heroEl) return;
    const box = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        top: r.top + sy,
        bottom: r.bottom + sy,
        pt: parseFloat(cs.paddingTop) || 0,
        pb: parseFloat(cs.paddingBottom) || 0,
      };
    };
    const ctrl: Pt[] = [];
    const yt: number[] = []; // target-line value at which each control point is the strand centre
    const kind: ("v" | "x")[] = []; // vertical run point or crossing point
    const push = (p: Pt, t: number, k: "v" | "x") => {
      ctrl.push(p);
      yt.push(t);
      kind.push(k);
    };
    const ls = trackScale();
    const strandLen = L * ls;

    const hb = box(heroEl);
    let side: Side = cfg.sides[secs[0].dataset.fxKey!] ?? "R";
    push({ x: laneX(side, 0), y: hb.top + vh * 0.35 }, hb.top + vh * 0.35, "v");

    secs.forEach((el, i) => {
      const b = box(el);
      side = cfg.sides[el.dataset.fxKey!] ?? side;
      // vertical stretch through this section's margin, with a gentle sway
      const y0 = b.top + Math.min(b.pt * 0.6, 60);
      const y1 = b.bottom - Math.min(b.pb * 0.6, 60);
      const steps = Math.max(1, Math.round((y1 - y0) / (vh * 0.45)));
      for (let k = 0; k <= steps; k++) {
        const y = y0 + ((y1 - y0) * k) / steps;
        const du = k === 0 || k === steps ? 0 : (k % 2 ? 1 : -1) * cfg.sway * 1.8;
        push({ x: laneX(side, du), y }, y, "v");
      }
      const next = secs[i + 1];
      const nextSide = next ? (cfg.sides[next.dataset.fxKey!] ?? side) : side;
      if (next && nextSide !== side) {
        // cross through the empty gap: this section's bottom padding + next one's top padding
        const nb = box(next);
        const gapTop = b.bottom - b.pb;
        const gapBot = nb.top + nb.pt;
        const yc = (gapTop + gapBot) / 2;
        const turn = Math.min(b.pb, nb.pt) * 0.55;
        const xa = laneX(side, 0);
        const xb = laneX(nextSide, 0);
        const dir = Math.sign(xb - xa);
        const spend = Math.min(Math.abs(xb - xa) * 0.45, vh * 0.45);
        push({ x: xa, y: yc - turn }, yc - spend / 2 - 1, "x");
        push({ x: xa + dir * turn, y: yc }, yc - spend / 2, "x");
        push({ x: lerp(xa, xb, 0.5), y: yc + 4 }, yc, "x");
        push({ x: xb - dir * turn, y: yc }, yc + spend / 2, "x");
        push({ x: xb, y: yc + turn }, yc + spend / 2 + 1, "x");
      }
      if (!next) {
        // final rest: glide inward and lie flat, centred, in this section's empty
        // bottom padding — right under the finale logo
        const yr = b.bottom - b.pb * 0.45;
        const turn = b.pb * 0.4;
        const xa = laneX(side, 0);
        const dir = side === "R" ? -1 : 1;
        const xEnd = vw / 2 + dir * (strandLen / 2);
        const spend = Math.min(Math.abs(xEnd - xa) * 0.45, vh * 0.4);
        // settle while the band is ~60% down the screen, so the reassembly is in view
        const c = yr - vh * 0.12;
        push({ x: xa, y: yr - turn }, c - spend / 2 - 1, "x");
        push({ x: xa + dir * turn, y: yr }, c - spend / 2, "x");
        push({ x: xEnd, y: yr }, c + spend / 2, "x");
        // (settleAt is derived below, once the track is sampled)
      }
    });

    // vertical points give way to the scroll budget the crossings need
    for (let i = 0; i < yt.length; i++) {
      if (kind[i] !== "v") continue;
      let lo = -Infinity,
        hi = Infinity;
      for (let j = i - 1; j >= 0; j--) if (kind[j] === "x") { lo = yt[j] + 1; break; }
      for (let j = i + 1; j < yt.length; j++) if (kind[j] === "x") { hi = yt[j] - 1; break; }
      yt[i] = Math.min(hi, Math.max(lo, yt[i]));
    }
    for (let i = 1; i < yt.length; i++) yt[i] = Math.max(yt[i], yt[i - 1] + 0.5);

    const PER = 24;
    const sampled = catmullRom(ctrl, PER);
    track = makePoly(sampled);
    mapY = yt;
    mapS = ctrl.map((_, i) => track!.cum[Math.min(i * PER, track!.cum.length - 1)]);
    // The strand looks settled as soon as its tail reaches the end of the track,
    // i.e. when its centre is half a strand-length before the end.
    const settleS = track.len - strandLen / 2;
    let settleY = mapY[mapY.length - 1];
    for (let i = 1; i < mapS.length; i++) {
      if (mapS[i] >= settleS) {
        const t = (settleS - mapS[i - 1]) / Math.max(0.0001, mapS[i] - mapS[i - 1]);
        settleY = lerp(mapY[i - 1], mapY[i], clamp01(t));
        break;
      }
    }
    settleAt = settleY - vh * 0.5;
  }

  /** The strand window on the track for the current scroll, in viewport coords. */
  function trackStrand(): { pts: Pt[]; scale: number } {
    const scale = trackScale();
    if (!track || mapY.length < 2) {
      return { pts: Array.from({ length: M }, (_, k) => ({ x: vw - margin / 2, y: (vh * k) / (M - 1) })), scale };
    }
    const target = scrollY + vh * 0.5;
    let sc: number;
    if (target <= mapY[0]) sc = mapS[0];
    else if (target >= mapY[mapY.length - 1]) sc = track.len;
    else {
      let i = 1;
      while (i < mapY.length - 1 && mapY[i] < target) i++;
      const t = (target - mapY[i - 1]) / Math.max(0.0001, mapY[i] - mapY[i - 1]);
      sc = lerp(mapS[i - 1], mapS[i], clamp01(t));
    }
    const len = L * scale;
    const start = Math.min(Math.max(0, sc - len / 2), Math.max(0, track.len - len));
    const pts = sliceStrand(track, start, len).map((p) => ({ x: p.x, y: p.y - scrollY }));
    return { pts, scale };
  }

  function heroStrand(): { pts: Pt[]; scale: number; exact: Poly } {
    const r = heroSlot?.getBoundingClientRect();
    const s = r ? r.width / necklace.width : 0.5;
    const ox = r ? r.left : vw * 0.55,
      oy = r ? r.top : vh * 0.2;
    const pts = HERO_POLY_SRC.pts.map((p) => ({ x: ox + p.x * s, y: oy + p.y * s }));
    const poly = makePoly(pts);
    return { pts: sliceStrand(poly, 0, poly.len), scale: s, exact: poly };
  }

  function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const y = scrollY;

    // hero: the necklace starts lifting halfway through the hold, once the logo
    // facets have begun landing on it, and is on the track within ~¾ of a screen
    const hold = vh * cfg.heroHold;
    const liftFrom = hold * 0.5;
    const te = smooth(clamp01((y - liftFrom) / (vh * 0.75) / 0.85));
    const fromHero = true;

    const A = heroStrand();
    const B = trackStrand();
    const stagger = 0.9;
    laneMix = te;
    const breeze = Math.min(1, Math.abs(vel) / 2200) * 10;
    const phase = y * 0.0042;

    // interpolate strands point-by-point; one end leads, like a ribbon lifted by air
    const pts: Pt[] = new Array(M);
    const tk: number[] = new Array(M);
    for (let k = 0; k < M; k++) {
      const u = k / (M - 1);
      const t = clamp01(te * (1 + stagger) - stagger * u);
      tk[k] = t;
      pts[k] = { x: lerp(A.pts[k].x, B.pts[k].x, t), y: lerp(A.pts[k].y, B.pts[k].y, t) };
    }
    // breeze: travelling wave along the normal (kept small so it stays in the margin)
    const waved: Pt[] = new Array(M);
    for (let k = 0; k < M; k++) {
      const u = k / (M - 1);
      const t = tk[k];
      const wind = trackWind(cfg.wind + breeze) * t;
      const p0 = pts[Math.max(0, k - 1)],
        p1 = pts[Math.min(M - 1, k + 1)];
      const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      const env = 0.55 + 0.45 * Math.sin(Math.PI * u);
      const off = wind * env * Math.sin(TAU * cfg.waves * u - phase);
      waved[k] = { x: pts[k].x - Math.sin(ang) * off, y: pts[k].y + Math.cos(ang) * off };
    }
    const poly = makePoly(waved);
    const scale = lerp(A.scale, B.scale, te);
    const start = (poly.len - L * scale) / 2;
    const polyA = fromHero ? makePoly(A.pts) : null;
    const startA = polyA ? (polyA.len - L * A.scale) / 2 : 0;

    // --- bead targets
    const follow = needSnap ? 1 : 0;
    for (let i = 0; i < N_SPR; i++) {
      const sp = SPRITES[i];
      const u = sp.s / L;
      const q = sampleAt(poly, start + sp.s * scale);
      let tx = q.x,
        ty = q.y,
        tr = q.a - sp.th;
      // at rest in the hero, correct the (tiny) difference between the traced
      // centreline and the exact photographed position of each piece
      if (te < 1) {
        const heroW = 1 - tk[Math.round(u * (M - 1))];
        if (heroW > 0) {
          const hs = A.scale;
          const r = heroSlot!.getBoundingClientRect();
          const h = sampleAt(polyA!, startA + sp.s * hs);
          tx += (r.left + sp.ox * hs - h.x) * heroW;
          ty += (r.top + sp.oy * hs - h.y) * heroW;
          tr = angleLerp(tr, tr - (h.a - sp.th), heroW);
        }
      }
      const d = disp[i];
      const k = follow || 1 - Math.pow(1 - (0.32 - 0.16 * u), dt * 60);
      d.x = lerp(d.x, tx, k);
      d.y = lerp(d.y, ty, k);
      d.r = angleLerp(d.r, tr, k);
      d.s = lerp(d.s, scale, k);
    }
    needSnap = false;

    // --- draw
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const bm = beadMip(scale * dpr);
    for (let i = 0; i < N_SPR; i++) {
      const sp = SPRITES[i];
      const d = disp[i];
      const s = d.s;
      if (d.x < -200 || d.x > vw + 200 || d.y < -200 || d.y > vh + 200) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.translate(d.x, d.y);
      ctx.rotate(d.r);
      ctx.scale(s, s);
      ctx.drawImage(bm.img, sp.sx * bm.f, sp.sy * bm.f, sp.w * bm.f, sp.h * bm.f, -sp.ax, -sp.ay, sp.w, sp.h);
    }

    // restrained light catches on a few beads, driven by scroll
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    for (let g = 0; g < cfg.glints; g++) {
      const i = [6, 13, 19][g] ?? 10;
      const d = disp[i];
      const sp = SPRITES[i];
      const inten = Math.pow(Math.max(0, Math.sin(phase * 1.7 + g * 2.1)), 10);
      if (inten < 0.04) continue;
      glint(ctx, d.x - Math.sin(d.r + sp.th) * sp.h * 0.18 * d.s, d.y - sp.h * 0.12 * d.s, 4 + 6 * inten * Math.max(0.6, d.s * 1.6), inten * 0.75);
    }
    ctx.globalCompositeOperation = "source-over";

    drawFacets(y);
  }

  function rectHome(el: HTMLElement | null, f: (typeof logo.facets)[number]) {
    const r = el?.getBoundingClientRect();
    if (!r || r.width === 0) return null;
    const s = r.width / logo.width;
    return { x: r.left + (f.x + f.w / 2) * s, y: r.top + (f.y + f.h / 2) * s, s };
  }

  function drawFacets(y: number) {
    const d: number[] = [];
    const r: number[] = [];
    for (let j = 0; j < logo.facets.length; j++) {
      const ord = FACET_ORDER.indexOf(j);
      // all facets come apart during the hero hold, one after another, in full view
      const hold = vh * cfg.heroHold;
      d[j] = clamp01((y - hold * (0.04 + 0.075 * ord)) / (hold * 0.36));
      // reassemble only once the strand runs down the margin beside the house
      // card, so the facets hop straight into the logo without crossing text
      r[j] = clamp01((y - (settleAt - vh * 0.26) - ord * vh * 0.025) / (vh * 0.2));
    }
    const allHome = d.every((v) => v === 0);
    const allLocked = r.every((v) => v === 1);
    setDom(heroLogo, allHome ? "visible" : "hidden", "hero");
    setDom(locLogo, allLocked ? "visible" : "hidden", "loc");
    if (allHome || allLocked) return;

    const phase = y * 0.0042;
    for (let j = 0; j < logo.facets.length; j++) {
      const f = logo.facets[j];
      const ord = FACET_ORDER.indexOf(j);
      // travelling position: beside its bead on the strand
      const u = FACET_ATTACH[ord];
      let bi = 0;
      while (bi < N_SPR - 1 && SPRITES[bi].s / L < u) bi++;
      const bd = disp[bi];
      const sp = SPRITES[bi];
      const tan = bd.r + sp.th;
      const side = ord % 2 ? 1 : -1;
      // in the hero facets orbit beside their bead; on the track they ride on it,
      // so they stay inside the empty margin with the strand
      const orbit = lerp(cfg.facetOrbit + sp.h * 0.5 * bd.s + 6 * Math.sin(phase * 1.3 + ord), 0, laneMix);
      const along = lerp(10, 4, laneMix) * Math.sin(phase * 0.9 + ord * 1.7);
      const travel = {
        x: bd.x - Math.sin(tan) * orbit * side + Math.cos(tan) * along,
        y: bd.y + Math.cos(tan) * orbit * side + Math.sin(tan) * along,
        s: cfg.facetTravelScale,
        rot: phase * 0.55 + ord * 0.9,
      };
      let x: number, yy: number, s: number, rot: number, glow = 0;
      if (r[j] > 0) {
        const home = rectHome(locLogo, f) ?? { x: travel.x, y: travel.y, s: travel.s };
        const e = easeInOut(r[j]);
        x = lerp(travel.x, home.x, e);
        yy = lerp(travel.y, home.y, e);
        s = lerp(travel.s, home.s, e);
        rot = lerp(travel.rot % TAU, 0, e);
        if (r[j] > 0.86) glow = Math.sin(((r[j] - 0.86) / 0.14) * Math.PI);
      } else {
        const home = rectHome(heroLogo, f) ?? { x: travel.x, y: travel.y, s: travel.s };
        const e = easeInOut(d[j]);
        // swirl: each facet lifts away on its own curved arc, turning as it flies
        const arcA = -Math.PI / 2 + (ord - 3) * 0.45;
        const arc = Math.sin(Math.PI * e) * Math.min(70, vw * 0.06);
        x = lerp(home.x, travel.x, e) + Math.cos(arcA) * arc;
        yy = lerp(home.y, travel.y, e) + Math.sin(arcA) * arc;
        // stay readable mid-flight, then settle to travelling size
        s = lerp(home.s, travel.s, Math.sqrt(e));
        rot = lerp(0, travel.rot + (ord % 2 ? 1 : -1) * Math.PI, e);
        if (d[j] > 0 && d[j] < 0.2) glow = Math.sin((d[j] / 0.2) * Math.PI) * 0.8;
      }
      if (x < -100 || x > vw + 100 || yy < -100 || yy > vh + 100) continue;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const fm = facetMip(s * dpr);
      ctx.translate(x, yy);
      ctx.rotate(rot);
      ctx.scale(s, s);
      ctx.drawImage(fm.img, f.sx * fm.f, f.sy * fm.f, f.w * fm.f, f.h * fm.f, -f.w / 2, -f.h / 2, f.w, f.h);
      if (glow > 0.02) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = "lighter";
        glint(ctx, x + (f.w * s) / 4, yy - (f.h * s) / 4, 5 + 5 * glow, glow * 0.8);
        ctx.globalCompositeOperation = "source-over";
      }
    }
  }

  function setDom(el: HTMLElement | null, v: string, which: "hero" | "loc") {
    if (!el) return;
    if (which === "hero" ? heroDom === v : locDom === v) return;
    el.style.visibility = v;
    if (which === "hero") heroDom = v;
    else locDom = v;
  }

  // --- wiring (GSAP ScrollTrigger drives scroll state; gsap.ticker drives rendering)
  // Hold the hero in place briefly so the visitor actually watches the logo
  // come apart and its facets travel onto the necklace.
  const heroSection = document.querySelector<HTMLElement>('[data-fx-key="hero"]');
  const heroPin = heroSection
    ? ScrollTrigger.create({
        trigger: heroSection,
        start: "top top",
        end: () => "+=" + Math.round(window.innerHeight * cfg.heroHold),
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      })
    : null;

  const st = ScrollTrigger.create({
    start: 0,
    end: "max",
    onUpdate: (self) => {
      scrollY = self.scroll();
      vel = self.getVelocity();
    },
  });
  const onRefresh = () => {
    scrollY = window.scrollY;
    measure();
  };
  ScrollTrigger.addEventListener("refresh", onRefresh);
  const ro = new ResizeObserver(() => ScrollTrigger.refresh());
  ro.observe(document.body);
  window.addEventListener("resize", resize);
  resize();
  const tick = () => {
    vel *= 0.92;
    frame();
  };
  gsap.ticker.add(tick);
  document.documentElement.classList.add("fx-ready");

  return () => {
    gsap.ticker.remove(tick);
    st.kill();
    heroPin?.kill(true);
    ScrollTrigger.removeEventListener("refresh", onRefresh);
    ro.disconnect();
    window.removeEventListener("resize", resize);
    document.documentElement.classList.remove("fx-ready");
    heroLogo?.style.removeProperty("visibility");
    locLogo?.style.removeProperty("visibility");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}

function glint(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, size);
  g.addColorStop(0, `rgba(255,247,226,${alpha})`);
  g.addColorStop(1, "rgba(255,247,226,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = `rgba(255,250,236,${alpha * 0.9})`;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - size * 1.6, y);
  ctx.lineTo(x + size * 1.6, y);
  ctx.moveTo(x, y - size * 1.6);
  ctx.lineTo(x, y + size * 1.6);
  ctx.stroke();
}

export default function CinematicNecklaceJourney() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const canvas = ref.current;
    if (!canvas) return;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (saveData) return;

    let disposed = false;
    let stop: (() => void) | undefined;
    const mm = gsap.matchMedia();
    Promise.all([loadImage("/images/fino-necklace-beads.png"), loadImage("/images/fino-logo-facets.png")])
      .then(([beads, facets]) => {
        if (disposed) return;
        mm.add(
          {
            desktop: "(min-width: 900px) and (prefers-reduced-motion: no-preference)",
            mobile: "(max-width: 899px) and (prefers-reduced-motion: no-preference)",
          },
          (c) => {
            const { desktop: isDesktop } = c.conditions as { desktop: boolean; mobile: boolean };
            stop = startEngine(canvas, isDesktop ? desktop : mobile, beads, facets);
            return () => {
              stop?.();
              stop = undefined;
            };
          },
        );
      })
      .catch(() => {
        /* assets unavailable: the static composition stays visible */
      });

    return () => {
      disposed = true;
      mm.revert();
      stop?.();
    };
  }, []);

  return <canvas ref={ref} className="fx-canvas" aria-hidden="true" />;
}
