import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/utils/anime";

export type SceneVariant =
  | "hero"
  | "orb"
  | "panel"
  | "subtle"
  | "dashboard"
  | "lattice"
  | "helix"
  | "crystal"
  | "knot"
  | "prism"
  | "shield"
  | "network";

type SceneProps = {
  className?: string;
  variant?: SceneVariant;
  density?: number;
};

const THREE_CACHE: { mod: typeof import("three") | null } = { mod: null };

async function loadThree() {
  if (!THREE_CACHE.mod) THREE_CACHE.mod = await import("three");
  return THREE_CACHE.mod;
}

function buildScene(
  THREE: typeof import("three"),
  variant: SceneVariant,
  density: number,
) {
  const group = new THREE.Group();
  const color = 0x22c55e;
  const soft = 0x86efac;
  const deep = 0x16a34a;

  const pointsGeo = (count: number, spread = 10) => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread;
      positions[i * 3 + 1] = (Math.random() - 0.5) * (spread * 0.55);
      positions[i * 3 + 2] = (Math.random() - 0.5) * (spread * 0.45);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  };

  if (variant === "hero") {
    group.add(
      new THREE.Points(
        pointsGeo(Math.min(density, 36), 11),
        new THREE.PointsMaterial({
          color,
          size: 0.045,
          transparent: true,
          opacity: 0.65,
          depthWrite: false,
        }),
      ),
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.85, 0.028, 12, 64),
      new THREE.MeshBasicMaterial({
        color: deep,
        transparent: true,
        opacity: 0.4,
      }),
    );
    ring.rotation.x = Math.PI / 2.35;
    group.add(ring);
    group.add(
      new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.62, 0),
        new THREE.MeshBasicMaterial({
          color: soft,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        }),
      ),
    );
  } else if (variant === "orb") {
    group.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 24, 24),
        new THREE.MeshBasicMaterial({
          color: soft,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
        }),
      ),
    );
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.1 + i * 0.35, 0.018, 8, 64),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? soft : deep,
          transparent: true,
          opacity: 0.45 - i * 0.08,
        }),
      );
      ring.rotation.x = Math.PI / 2 + i * 0.4;
      ring.rotation.y = i * 0.55;
      group.add(ring);
    }
  } else if (variant === "lattice" || variant === "panel") {
    const grid = new THREE.Group();
    for (let x = -2; x <= 2; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          if (Math.abs(x) + Math.abs(y) + Math.abs(z) === 0) continue;
          const cube = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.28, 0.28),
            new THREE.MeshBasicMaterial({
              color: (x + y + z) % 2 === 0 ? color : soft,
              wireframe: true,
              transparent: true,
              opacity: 0.55,
            }),
          );
          cube.position.set(x * 0.7, y * 0.7, z * 0.7);
          grid.add(cube);
        }
      }
    }
    group.add(grid);
  } else if (variant === "helix") {
    const helix = new THREE.Group();
    const n = Math.min(density, 48);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const angle = t * Math.PI * 6;
      const y = (t - 0.5) * 4.2;
      const r = 1.15;
      const bead = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.12, 0),
        new THREE.MeshBasicMaterial({
          color: i % 3 === 0 ? soft : color,
          wireframe: true,
          transparent: true,
          opacity: 0.7,
        }),
      );
      bead.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      helix.add(bead);
    }
    group.add(helix);
  } else if (variant === "crystal") {
    const cluster = new THREE.Group();
    const offsets = [
      [0, 0, 0],
      [1.1, 0.4, -0.3],
      [-0.9, -0.5, 0.5],
      [0.3, 1.0, 0.6],
      [-0.4, 0.7, -0.9],
    ];
    offsets.forEach((o, i) => {
      const mesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35 + i * 0.08, 0),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? soft : deep,
          wireframe: true,
          transparent: true,
          opacity: 0.65,
        }),
      );
      mesh.position.set(o[0], o[1], o[2]);
      cluster.add(mesh);
    });
    group.add(cluster);
  } else if (variant === "knot") {
    group.add(
      new THREE.Mesh(
        new THREE.TorusKnotGeometry(0.85, 0.22, 100, 12),
        new THREE.MeshBasicMaterial({
          color: soft,
          wireframe: true,
          transparent: true,
          opacity: 0.55,
        }),
      ),
    );
    group.add(
      new THREE.Points(
        pointsGeo(Math.min(density, 28), 8),
        new THREE.PointsMaterial({
          color: deep,
          size: 0.04,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        }),
      ),
    );
  } else if (variant === "prism") {
    const stack = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const tet = new THREE.Mesh(
        new THREE.TetrahedronGeometry(0.55 - i * 0.05, 0),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? color : soft,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        }),
      );
      tet.position.y = (i - 2) * 0.55;
      tet.rotation.y = i * 0.45;
      stack.add(tet);
    }
    group.add(stack);
  } else if (variant === "shield") {
    group.add(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(1.05, 0),
        new THREE.MeshBasicMaterial({
          color: soft,
          wireframe: true,
          transparent: true,
          opacity: 0.5,
        }),
      ),
    );
    group.add(
      new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.55, 0),
        new THREE.MeshBasicMaterial({
          color: deep,
          wireframe: true,
          transparent: true,
          opacity: 0.7,
        }),
      ),
    );
  } else if (variant === "network" || variant === "dashboard") {
    const nodes: import("three").Vector3[] = [];
    const n = Math.min(Math.max(density, 12), 22);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        (Math.random() - 0.5) * 3.2,
        (Math.random() - 0.5) * 3.2,
      );
      nodes.push(v);
      const node = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 8),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? soft : color,
          transparent: true,
          opacity: 0.85,
        }),
      );
      node.position.copy(v);
      group.add(node);
    }
    const linePos: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 1.85) {
          linePos.push(
            nodes[i].x,
            nodes[i].y,
            nodes[i].z,
            nodes[j].x,
            nodes[j].y,
            nodes[j].z,
          );
        }
      }
    }
    if (linePos.length) {
      const lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(linePos, 3),
      );
      group.add(
        new THREE.LineSegments(
          lineGeo,
          new THREE.LineBasicMaterial({
            color: deep,
            transparent: true,
            opacity: 0.35,
          }),
        ),
      );
    }
  } else {
    group.add(
      new THREE.Points(
        pointsGeo(Math.min(density, 24), 9),
        new THREE.PointsMaterial({
          color,
          size: 0.03,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        }),
      ),
    );
    for (let i = 0; i < 6; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshBasicMaterial({
          color: soft,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        }),
      );
      box.position.set(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 2,
      );
      group.add(box);
    }
  }

  return group;
}

export default function SceneCanvas({
  className,
  variant = "hero",
  density = 28,
}: SceneProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || prefersReducedMotion()) return;

    let disposed = false;
    let frame = 0;
    let visible = false;
    let renderer: import("three").WebGLRenderer | null = null;
    let scene: import("three").Scene | null = null;
    let camera: import("three").PerspectiveCamera | null = null;
    let group: import("three").Group | null = null;
    let observer: IntersectionObserver | null = null;
    let spinning = true;

    const boot = async () => {
      const THREE = await loadThree();
      if (disposed || !mount) return;

      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(isMobile ? 55 : 48, w / h, 0.1, 40);
      const baseZ = variant === "hero" || variant === "orb" ? 5.8 : 6.6;
      camera.position.z = isMobile ? baseZ * 0.72 : baseZ;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
        stencil: false,
        depth: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.25));
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      mount.appendChild(renderer.domElement);

      group = buildScene(THREE, variant, density);
      scene.add(group);

      const onResize = () => {
        if (!mount || !camera || !renderer) return;
        const nw = mount.clientWidth || 1;
        const nh = mount.clientHeight || 1;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh, false);
      };
      window.addEventListener("resize", onResize, { passive: true });

      const tick = () => {
        if (disposed || !renderer || !scene || !camera || !group) return;
        if (!visible || document.hidden || !spinning) {
          frame = 0;
          return;
        }
        const speed =
          variant === "knot" ? 0.004 : variant === "helix" ? 0.003 : 0.0016;
        group.rotation.y += speed;
        if (variant === "crystal" || variant === "prism") {
          group.rotation.x += speed * 0.35;
        } else {
          group.rotation.x += speed * 0.18;
        }
        renderer.render(scene, camera);
        frame = requestAnimationFrame(tick);
      };

      const start = () => {
        if (disposed || frame) return;
        frame = requestAnimationFrame(tick);
      };

      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const next = !!entry?.isIntersecting;
          visible = next;
          if (next) start();
          else {
            cancelAnimationFrame(frame);
            frame = 0;
          }
        },
        { root: null, rootMargin: "40px", threshold: 0.02 },
      );
      observer.observe(mount);

      const onVis = () => {
        spinning = !document.hidden;
        if (spinning && visible) start();
        else {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      };
      document.addEventListener("visibilitychange", onVis);

      return () => {
        window.removeEventListener("resize", onResize);
        document.removeEventListener("visibilitychange", onVis);
      };
    };

    let cleanup: (() => void) | undefined;
    boot().then((fn) => {
      cleanup = fn;
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      cleanup?.();
      if (group) {
        group.traverse((obj) => {
          const mesh = obj as import("three").Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as
            | import("three").Material
            | import("three").Material[]
            | undefined;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else if (mat) mat.dispose();
        });
      }
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss?.();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      }
    };
  }, [variant, density]);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    />
  );
}
