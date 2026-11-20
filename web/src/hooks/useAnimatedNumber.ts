import { useEffect, useRef, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Smoothly interpolates a numeric display value on mount and whenever `target` changes.
 * Reads from the in-flight value if `target` updates mid-animation so rapid toggles stay fluid.
 */
export function useAnimatedNumber(target: number, durationMs = 220): number {
  const [display, setDisplay] = useState<number>(() =>
    prefersReducedMotion() || !Number.isFinite(target) ? target : 0,
  );
  const currentRef = useRef<number>(display);

  useEffect(() => {
    if (!Number.isFinite(target) || prefersReducedMotion() || durationMs <= 0) {
      currentRef.current = target;
      setDisplay(target);
      return undefined;
    }

    const from = Number.isFinite(currentRef.current) ? currentRef.current : target;
    if (from === target) {
      setDisplay(target);
      return undefined;
    }

    let rafId = 0;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      // Cubic ease-out so the final digits settle quickly without sluggish tailing.
      const eased = 1 - (1 - progress) ** 3;
      const next = from + (target - from) * eased;
      currentRef.current = next;
      setDisplay(next);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        currentRef.current = target;
        setDisplay(target);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return display;
}
