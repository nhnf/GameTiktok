"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scale factor that fits a fixed-size stage (the 1080×1920 overlay) inside
 * the measured container. Never scales up, so an OBS browser source sized
 * exactly 1080×1920 renders at 1:1.
 */
export function useFitScale<T extends HTMLElement>(width: number, height: number) {
  const ref = useRef<T>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => {
      const { clientWidth, clientHeight } = element;
      if (clientWidth === 0 || clientHeight === 0) return;
      setScale(Math.min(1, clientWidth / width, clientHeight / height));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [width, height]);

  return { ref, scale };
}
