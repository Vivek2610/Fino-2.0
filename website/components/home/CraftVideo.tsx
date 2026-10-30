"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Muted looping campaign clip. Loads only when near the viewport, never autoplays
 * for reduced-motion users, and always offers a real pause/play control.
 */
export default function CraftVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          if (!reduce) v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
        } else if (!v.paused) {
          v.pause();
          setPlaying(false);
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      setLoad(true);
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  if (failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt={label} />;
  }

  return (
    <>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        poster={poster}
        aria-label={label}
        onError={() => setFailed(true)}
      >
        {load && <source src={src} type="video/mp4" onError={() => setFailed(true)} />}
      </video>
      <button
        type="button"
        className="craft__play"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Pause film" : "Play film"}
      >
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <rect x="4" y="3" width="3" height="12" fill="currentColor" />
            <rect x="11" y="3" width="3" height="12" fill="currentColor" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M5 3l10 6-10 6z" fill="currentColor" />
          </svg>
        )}
      </button>
    </>
  );
}
