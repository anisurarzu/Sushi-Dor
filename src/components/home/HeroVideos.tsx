"use client";

import { useEffect, useRef, useState } from "react";

const CLIPS = [
  "/media/sushi-prep.mp4",
  "/media/sushi-flame.mp4",
  "/media/sushi-torch.mp4",
  "/media/sushi-plating.mp4",
] as const;

const POSTER =
  "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=2400&q=80";

/**
 * Cycles 4 muted hero clips — when one ends, the next crossfades in.
 */
export function HeroVideos() {
  const [index, setIndex] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    videoRefs.current.forEach((el, i) => {
      if (!el) return;
      if (i === index) {
        try {
          el.currentTime = 0;
        } catch {
          /* ignore seek before metadata */
        }
        void el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [index]);

  const advance = () => {
    setPrev(index);
    setIndex((i) => (i + 1) % CLIPS.length);
    window.setTimeout(() => setPrev(null), 900);
  };

  return (
    <div className="hero-videos absolute inset-0 scale-[1.03]" aria-hidden>
      {CLIPS.map((src, i) => (
        <video
          key={src}
          ref={(node) => {
            videoRefs.current[i] = node;
          }}
          className={`hero-videos__clip ${
            i === index
              ? "is-active"
              : i === prev
                ? "is-leaving"
                : "is-idle"
          }`}
          src={src}
          muted
          playsInline
          preload={i === 0 || i === 1 ? "auto" : "metadata"}
          poster={i === 0 ? POSTER : undefined}
          onEnded={() => {
            if (i === index) advance();
          }}
        />
      ))}
    </div>
  );
}
