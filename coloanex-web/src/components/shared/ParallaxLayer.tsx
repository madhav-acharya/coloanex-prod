import { cn } from "@/lib/utils";
import { useParallaxScroll } from "@/hooks/useParallax";

type ParallaxLayerProps = {
  children?: React.ReactNode;
  className?: string;
  speed?: number;
  axis?: "y" | "x";
  clamp?: number;
  expand?: number;
};

export function ParallaxLayer({
  children,
  className,
  speed = 0.55,
  axis = "y",
  clamp = 160,
  expand = 0.32,
}: ParallaxLayerProps) {
  const { ref } = useParallaxScroll<HTMLDivElement>({
    speed,
    axis,
    clamp,
    expand,
  });

  return (
    <div
      ref={ref}
      className={cn("will-change-transform origin-center", className)}
    >
      {children}
    </div>
  );
}
