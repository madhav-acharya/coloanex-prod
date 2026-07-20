import { useEffect, useRef } from "react";
import { fadeInUp, staggerChildren, prefersReducedMotion } from "@/utils/anime";

export function useRevealOnMount(deps: unknown[] = []) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;
    const items = root.querySelectorAll("[data-reveal]");
    if (items.length) {
      staggerChildren(Array.from(items) as HTMLElement[]);
    } else {
      fadeInUp(root);
    }
  }, deps);

  return ref;
}

export function useRevealOnView() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const run = () => {
      const items = root.querySelectorAll("[data-reveal]");
      if (items.length) {
        staggerChildren(Array.from(items) as HTMLElement[]);
      } else {
        fadeInUp(root);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run();
            io.disconnect();
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(root);
    return () => io.disconnect();
  }, []);

  return ref;
}
