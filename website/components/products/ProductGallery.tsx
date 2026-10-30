"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/lib/products";

/** Main image + thumbnails. All images are in the HTML for crawlers. */
export default function ProductGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const img = images[active];
  return (
    <div className="gallery">
      <div className="gallery__main">
        <Image
          key={img.src}
          src={img.src}
          alt={img.alt}
          fill
          priority={active === 0}
          sizes="(min-width: 900px) 46vw, 92vw"
          className="gallery__img"
        />
      </div>
      {images.length > 1 && (
        <ul className="gallery__thumbs" aria-label={`${name} images`}>
          {images.map((im, i) => (
            <li key={im.src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1}: ${im.alt}`}
                aria-pressed={i === active}
              >
                <Image src={im.src} alt="" width={120} height={160} sizes="96px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
