"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CLIPS = [
  {
    src: "/media/sushi-prep.mp4",
    poster:
      "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=2400&q=80",
  },
  {
    src: "/media/wok-fire.mp4",
    poster:
      "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=2400&q=80",
  },
  {
    src: "/media/sushi-flame.mp4",
    poster:
      "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=2400&q=80",
  },
  {
    src: "/media/sushi-torch.mp4",
    poster:
      "https://images.unsplash.com/photo-1583623025817-d180a2225852?auto=format&fit=crop&w=2400&q=80",
  },
] as const;

/**
 * Full-bleed hero background: plays 4 clips in sequence, then loops the reel.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const clip = CLIPS[index];

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % CLIPS.length);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    const play = video.play();
    if (play) play.catch(() => undefined);
  }, [index]);

  return (
    <div className="absolute inset-0 scale-[1.03]" aria-hidden>
      <video
        key={clip.src}
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={clip.poster}
        onEnded={advance}
      >
        <source src={clip.src} type="video/mp4" />
      </video>
    </div>
  );
}
