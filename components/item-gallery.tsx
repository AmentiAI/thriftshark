"use client";

import Image from "next/image";
import { useState } from "react";
import type { ItemImage } from "@/lib/types";

export function ItemGallery({ images, title }: { images: ItemImage[]; title: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-3/4 items-center justify-center bg-paper-dim text-sm text-ink-faint">
        No photos yet
      </div>
    );
  }

  const current = images[Math.min(active, images.length - 1)];

  return (
    <div className="space-y-3">
      <div className="relative aspect-3/4 overflow-hidden bg-paper-dim">
        <Image
          src={current.url}
          alt={current.alt ?? title}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((image, i) => (
            <button
              key={image.url}
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square overflow-hidden bg-paper-dim transition ${
                i === active ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
