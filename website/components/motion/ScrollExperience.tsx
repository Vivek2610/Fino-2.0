"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Note: every trigger here uses refreshPriority -1 so it is measured AFTER the
 * hero pin created by CinematicNecklaceJourney (which adds pin spacing above).
 *
 * Site-wide scroll motion, driven by GSAP ScrollTrigger.
 *
 *   [data-reveal]        fade + rise ("card", "clip", "scale" variants in CSS)
 *   [data-stagger] > *   children pop in one after another, column by column,
 *                        and (desktop) drift at slightly different speeds as
 *                        the page scrolls, so a grid feels like it flows
 *   .card / .house       image parallax inside its frame while scrolling;
 *                        on a mouse, a gentle 3-D tilt that follows the pointer
 *
 * Content is fully visible without JavaScript. Reduced-motion users get no
 * movement at all (see the CSS override).
 */
export default function ScrollExperience() {
  const pathname = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const root = document.documentElement;
    root.classList.add("reveal-ready");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const cleanups: (() => void)[] = [];

    /* ---------------- 1. reveals ---------------- */
    const els = gsap.utils.toArray<HTMLElement>("[data-reveal]");

    // In a grid, cards pop in left → right along each row, rows following on.
    const delayFor = (el: HTMLElement, batchIndex: number) => {
      const parent = el.parentElement;
      if (parent?.hasAttribute("data-stagger")) {
        const kids = Array.from(parent.children) as HTMLElement[];
        const tops = [...new Set(kids.map((k) => k.offsetTop))].sort((a, b) => a - b);
        const row = tops.indexOf(el.offsetTop);
        const col = kids.filter((k) => k.offsetTop === el.offsetTop).indexOf(el);
        return col * 120 + Math.max(0, row) * 70;
      }
      return Math.min(batchIndex, 4) * 90;
    };

    const reveal = (el: HTMLElement, i: number) => {
      if (el.classList.contains("is-in")) return;
      const delay = delayFor(el, i);
      el.style.transitionDelay = `${delay}ms`;
      el.style.setProperty("--pop-delay", `${delay}ms`);
      el.classList.add("is-in");
      // Once the entrance has played, drop the delay so hover reacts instantly.
      const t = window.setTimeout(() => {
        el.style.transitionDelay = "";
        el.classList.add("is-settled");
      }, delay + 1500);
      cleanups.push(() => window.clearTimeout(t));
    };

    // One trigger per element (not ScrollTrigger.batch) so each can be measured
    // after the hero pin. Grid siblings still cascade via delayFor().
    let frameCount = 0;
    let frameStamp = 0;
    const triggers = els.map((el) =>
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        refreshPriority: -1,
        onEnter: () => {
          // elements entering in the same frame form a little cascade
          const now = performance.now();
          frameCount = now - frameStamp < 50 ? frameCount + 1 : 0;
          frameStamp = now;
          reveal(el, frameCount);
        },
      }),
    );
    // Anything already in view (or scrolled past) shows immediately.
    requestAnimationFrame(() => {
      els.forEach((el, i) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) reveal(el, i);
      });
      ScrollTrigger.refresh();
    });

    const motion: ScrollTrigger[] = [];

    if (!reduced) {
      /* ---------------- 2. image parallax inside each card ---------------- */
      gsap.utils.toArray<HTMLElement>(".card__media, .story__media-inner").forEach((media) => {
        const img = media.querySelector("img");
        if (!img) return;
        media.classList.add("has-parallax");
        motion.push(
          ScrollTrigger.create({
            trigger: media,
            start: "top bottom",
            end: "bottom top",
            refreshPriority: -1,
            onUpdate: (self) => {
              img.style.translate = `0 ${((0.5 - self.progress) * 9).toFixed(2)}%`;
            },
          }),
        );
      });

      /* ---------------- 2b. film frame comes toward the viewer ---------------- */
      gsap.utils.toArray<HTMLElement>('[data-scrub="screen"]').forEach((frame) => {
        const media = frame.querySelectorAll("img, video");
        const caption = frame.querySelectorAll(".craft__caption > span");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: frame, start: "top bottom", end: "top 18%", scrub: 0.8, refreshPriority: -1 },
        });
        tl.fromTo(
          frame,
          {
            scale: 0.62,
            rotateX: 16,
            y: 80,
            transformPerspective: 1400,
            transformOrigin: "50% 100%",
            opacity: 0.35,
            boxShadow: "0 0 0px rgba(197,160,89,0)",
          },
          {
            scale: 1,
            rotateX: 0,
            y: 0,
            opacity: 1,
            boxShadow: "0 0 120px rgba(197,160,89,0.22)",
            ease: "power1.out",
          },
          0,
        )
          .fromTo(media, { scale: 1.35 }, { scale: 1.04, ease: "power1.out" }, 0)
          .fromTo(caption, { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, ease: "power2.out" }, 0.55);
        // keep drifting gently while the film passes
        motion.push(
          ScrollTrigger.create({
            trigger: frame,
            start: "top 18%",
            end: "bottom top",
            refreshPriority: -1,
            onUpdate: (self) => media.forEach((m) => ((m as HTMLElement).style.translate = `0 ${(self.progress * -4).toFixed(2)}%`)),
          }),
        );
        cleanups.push(() => {
          tl.scrollTrigger?.kill();
          tl.kill();
          gsap.set([frame, ...media, ...caption], { clearProps: "all" });
        });
      });

      /* ---------------- 2c. quote lights up word by word ---------------- */
      gsap.utils.toArray<HTMLElement>('[data-scrub="words"]').forEach((p) => {
        const words = p.querySelectorAll(".sw");
        const tw = gsap.fromTo(
          words,
          { opacity: 0.14, filter: "blur(3px)" },
          {
            opacity: 1,
            filter: "blur(0px)",
            stagger: 0.12,
            ease: "none",
            scrollTrigger: { trigger: p, start: "top 88%", end: "top 45%", scrub: 0.6, refreshPriority: -1 },
          },
        );
        cleanups.push(() => {
          tw.scrollTrigger?.kill();
          tw.kill();
          gsap.set(words, { clearProps: "all" });
        });
      });

      /* ---------------- 2d. story: text "writes" itself in as you read ---------------- */
      gsap.utils.toArray<HTMLElement>('[data-scrub="read"]').forEach((p) => {
        const words = p.querySelectorAll(".sw");
        const tw = gsap.fromTo(
          words,
          { opacity: 0.16 },
          {
            opacity: 1,
            stagger: 0.08,
            ease: "none",
            scrollTrigger: { trigger: p, start: "top 85%", end: "bottom 55%", scrub: 0.5, refreshPriority: -1 },
          },
        );
        cleanups.push(() => {
          tw.scrollTrigger?.kill();
          tw.kill();
          gsap.set(words, { clearProps: "all" });
        });
      });

      /* ---------------- 2e. story image settles from a slow zoom ---------------- */
      gsap.utils.toArray<HTMLElement>('[data-scrub="zoom"]').forEach((frame) => {
        const img = frame.querySelector("img");
        if (!img) return;
        const tw = gsap.fromTo(
          img,
          { scale: 1.12 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: frame, start: "top bottom", end: "center 45%", scrub: 0.8, refreshPriority: -1 },
          },
        );
        cleanups.push(() => {
          tw.scrollTrigger?.kill();
          tw.kill();
          gsap.set(img, { clearProps: "transform" });
        });
      });

      /* ---------------- 3. grids drift: alternate columns move at their own pace ---------------- */
      const mm = gsap.matchMedia();
      mm.add("(min-width: 900px)", () => {
        const local: ScrollTrigger[] = [];
        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((grid) => {
          const kids = Array.from(grid.children) as HTMLElement[];
          if (kids.length < 2) return;
          const lefts = [...new Set(kids.map((k) => k.offsetLeft))].sort((a, b) => a - b);
          if (lefts.length < 2) return; // single column: nothing to offset
          local.push(
            ScrollTrigger.create({
              trigger: grid,
              start: "top bottom",
              end: "bottom top",
              refreshPriority: -1,
              onUpdate: (self) => {
                const p = 0.5 - self.progress; // +0.5 entering … -0.5 leaving
                kids.forEach((k) => {
                  const col = lefts.indexOf(k.offsetLeft);
                  const amp = col % 2 === 1 ? 46 : 14; // px; odd columns travel further
                  k.style.translate = `0 ${(p * amp).toFixed(1)}px`;
                });
              },
            }),
          );
        });
        return () => {
          local.forEach((t) => t.kill());
          gsap.utils.toArray<HTMLElement>("[data-stagger] > *").forEach((k) => (k.style.translate = ""));
        };
      });
      cleanups.push(() => mm.revert());

      /* ---------------- 4. pointer tilt on cards (mouse / trackpad only) ---------------- */
      if (finePointer) {
        gsap.utils.toArray<HTMLElement>(".card, .house").forEach((card) => {
          let raf = 0;
          const move = (e: PointerEvent) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
            const y = (e.clientY - r.top) / r.height - 0.5;
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
              card.style.setProperty("--ry", `${(x * 7).toFixed(2)}deg`);
              card.style.setProperty("--rx", `${(-y * 6).toFixed(2)}deg`);
              card.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
              card.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
            });
          };
          const leave = () => {
            cancelAnimationFrame(raf);
            card.style.setProperty("--rx", "0deg");
            card.style.setProperty("--ry", "0deg");
          };
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
          });
        });
      }
    }

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      triggers.forEach((t) => t.kill());
      motion.forEach((t) => t.kill());
      cleanups.forEach((fn) => fn());
      window.removeEventListener("load", onLoad);
    };
  }, [pathname]);

  return null;
}
