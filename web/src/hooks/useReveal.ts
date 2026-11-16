import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Marks a section visible once it enters the viewport so below-the-fold sections
 * reveal smoothly without re-triggering on scroll back.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(threshold = 0.12) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return true;
    return typeof IntersectionObserver === "undefined";
  });

  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -32px 0px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible, threshold]);

  return [ref, visible] as const;
}
