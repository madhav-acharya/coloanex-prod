import { animate, createTimeline, stagger, type AnimationParams } from "animejs";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function fadeInUp(
  targets: string | HTMLElement | NodeListOf<Element> | HTMLElement[],
  opts: AnimationParams = {},
) {
  if (prefersReducedMotion()) return null;
  return animate(targets, {
    opacity: [0, 1],
    translateY: [24, 0],
    duration: 650,
    ease: "out(3)",
    ...opts,
  });
}

export function staggerChildren(
  targets: string | HTMLElement | NodeListOf<Element> | HTMLElement[],
  opts: AnimationParams = {},
) {
  if (prefersReducedMotion()) return null;
  return animate(targets, {
    opacity: [0, 1],
    translateY: [18, 0],
    delay: stagger(70),
    duration: 520,
    ease: "out(3)",
    ...opts,
  });
}

export function modalEnter(target: HTMLElement | null) {
  if (!target || prefersReducedMotion()) return null;
  return animate(target, {
    opacity: [0, 1],
    scale: [0.94, 1],
    duration: 320,
    ease: "out(3)",
  });
}

export function countUp(el: HTMLElement, to: number, duration = 900) {
  if (prefersReducedMotion()) {
    el.textContent = String(to);
    return null;
  }
  const state = { value: 0 };
  return animate(state, {
    value: to,
    duration,
    ease: "out(3)",
    onUpdate: () => {
      el.textContent = String(Math.round(state.value));
    },
  });
}

export function createPageTimeline() {
  if (prefersReducedMotion()) return null;
  return createTimeline({ defaults: { ease: "out(3)" } });
}

export { animate, createTimeline, stagger };
