import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/utils/anime";

type Options = {
  speed?: number;
  axis?: "y" | "x";
  clamp?: number;
  expand?: number;
};

type ParallaxTarget = {
  el: HTMLElement;
  speed: number;
  axis: "y" | "x";
  clamp: number;
  expand: number;
};

const targets = new Set<ParallaxTarget>();
let listening = false;
let raf = 0;
let scrollY = 0;

function applyAll() {
  const viewH = window.innerHeight || 1;
  targets.forEach((t) => {
    const rect = t.el.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const progress = (viewH / 2 - center) / viewH;
    let offset = progress * t.speed * 380;
    if (t.clamp > 0) {
      offset = Math.max(-t.clamp, Math.min(t.clamp, offset));
    }
    const proximity = Math.max(0, 1 - Math.abs(progress) * 1.15);
    const scale = 1 + t.expand * proximity;
    if (t.axis === "y") {
      t.el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
    } else {
      t.el.style.transform = `translate3d(${offset.toFixed(1)}px, 0, 0) scale(${scale.toFixed(3)})`;
    }
  });
}

function onScroll() {
  scrollY = window.scrollY;
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    applyAll();
  });
}

function ensureListening() {
  if (listening || prefersReducedMotion()) return;
  listening = true;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}

function maybeStopListening() {
  if (targets.size || !listening) return;
  listening = false;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
  cancelAnimationFrame(raf);
  raf = 0;
}

export function useParallaxScroll<T extends HTMLElement>(options: Options = {}) {
  const ref = useRef<T | null>(null);
  const { speed = 0.55, axis = "y", clamp = 180, expand = 0.28 } = options;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    const target: ParallaxTarget = { el, speed, axis, clamp, expand };
    targets.add(target);
    ensureListening();
    applyAll();

    return () => {
      targets.delete(target);
      el.style.transform = "";
      maybeStopListening();
    };
  }, [speed, axis, clamp, expand]);

  return { ref, ready, scrollY };
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max =
          document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? window.scrollY / max : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return progress;
}
