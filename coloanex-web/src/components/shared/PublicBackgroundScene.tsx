import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/utils/anime";

const THREE_CACHE: { mod: typeof import("three") | null } = { mod: null };

async function loadThree() {
  if (!THREE_CACHE.mod) THREE_CACHE.mod = await import("three");
  return THREE_CACHE.mod;
}

export default function PublicBackgroundScene({
  className,
}: {
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || prefersReducedMotion()) return;

    let disposed = false;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let scene: import("three").Scene | null = null;
    let camera: import("three").PerspectiveCamera | null = null;
    let core: import("three").Group | null = null;
    let particles: import("three").Points | null = null;

    const pointer = { x: 0, y: 0, active: false };
    const scroll = { y: 0, lastY: 0, velocity: 0 };
    const target = { rotX: 0.15, rotY: 0, rotZ: 0 };
    const current = { rotX: 0.15, rotY: 0, rotZ: 0 };
    let idle = true;
    let narrow = false;

    const layoutCamera = () => {
      if (!mount || !camera || !renderer) return;
      const w = mount.clientWidth || window.innerWidth || 1;
      const h = mount.clientHeight || window.innerHeight || 1;
      narrow = w < 640;
      const mid = w < 1024;
      camera.fov = narrow ? 58 : mid ? 50 : 46;
      camera.position.z = narrow ? 4.35 : mid ? 5.4 : 6.2;
      camera.position.x = narrow ? 0.15 : 0.55;
      camera.position.y = narrow ? 0.05 : 0.1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const boot = async () => {
      const THREE = await loadThree();
      if (disposed || !mount) return;

      const w = mount.clientWidth || window.innerWidth || 1;
      const h = mount.clientHeight || window.innerHeight || 1;
      narrow = w < 640;
      const mid = w < 1024;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(narrow ? 58 : mid ? 50 : 46, w / h, 0.1, 60);
      camera.position.z = narrow ? 4.35 : mid ? 5.4 : 6.2;
      camera.position.x = narrow ? 0.15 : 0.55;
      camera.position.y = narrow ? 0.05 : 0.1;

      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: "low-power",
        stencil: false,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1 : 1.25));
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      mount.appendChild(renderer.domElement);

      core = new THREE.Group();
      scene.add(core);

      const count = narrow ? 56 : mid ? 64 : 80;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * (narrow ? 10 : 14);
        positions[i * 3 + 1] = (Math.random() - 0.5) * (narrow ? 12 : 9);
        positions[i * 3 + 2] = (Math.random() - 0.5) * (narrow ? 5 : 6);
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
          color: 0x22c55e,
          size: narrow ? 0.055 : 0.05,
          transparent: true,
          opacity: narrow ? 0.8 : 0.7,
          depthWrite: false,
        }),
      );
      scene.add(particles);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(narrow ? 1.55 : 1.9, 0.028, 12, 80),
        new THREE.MeshBasicMaterial({
          color: 0x16a34a,
          transparent: true,
          opacity: 0.4,
        }),
      );
      ring.rotation.x = Math.PI / 2.35;
      core.add(ring);

      core.add(
        new THREE.Mesh(
          new THREE.IcosahedronGeometry(narrow ? 0.85 : 0.7, 0),
          new THREE.MeshBasicMaterial({
            color: 0x86efac,
            wireframe: true,
            transparent: true,
            opacity: 0.65,
          }),
        ),
      );

      core.add(
        new THREE.Mesh(
          new THREE.IcosahedronGeometry(narrow ? 1.35 : 1.15, 0),
          new THREE.MeshBasicMaterial({
            color: 0x22c55e,
            wireframe: true,
            transparent: true,
            opacity: 0.18,
          }),
        ),
      );

      if (narrow) {
        core.scale.setScalar(1.15);
      }

      const onResize = () => {
        layoutCamera();
        if (core) {
          core.scale.setScalar(window.innerWidth < 640 ? 1.15 : 1);
        }
      };

      const onPointer = (e: PointerEvent) => {
        const nx = (e.clientX / window.innerWidth) * 2 - 1;
        const ny = (e.clientY / window.innerHeight) * 2 - 1;
        pointer.x = nx;
        pointer.y = ny;
        pointer.active = true;
        idle = false;
      };

      const onPointerLeave = () => {
        pointer.active = false;
      };

      const onScroll = () => {
        scroll.y = window.scrollY;
        const delta = scroll.y - scroll.lastY;
        scroll.lastY = scroll.y;
        scroll.velocity = scroll.velocity * 0.85 + delta * 0.15;
        idle = false;
      };

      window.addEventListener("resize", onResize, { passive: true });
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerleave", onPointerLeave, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      scroll.y = window.scrollY;
      scroll.lastY = scroll.y;

      const tick = () => {
        if (disposed || !renderer || !scene || !camera || !core || !particles)
          return;

        if (!document.hidden) {
          particles.rotation.y += 0.0009;
          particles.rotation.x += 0.00025;

          const max = Math.max(
            1,
            document.documentElement.scrollHeight - window.innerHeight,
          );
          const scrollT = scroll.y / max;
          const scrollSpin = scroll.velocity * 0.0022;
          const lookAmp = narrow ? 0.35 : 0.55;

          target.rotY =
            (pointer.active ? pointer.x * lookAmp : 0) +
            scrollT * Math.PI * 1.35 +
            scrollSpin;
          target.rotX =
            0.18 +
            (pointer.active ? -pointer.y * (narrow ? 0.22 : 0.35) : 0) +
            Math.sin(scrollT * Math.PI * 2) * 0.12;
          target.rotZ =
            (pointer.active ? pointer.x * 0.08 : 0) + scrollSpin * 0.35;

          const dx = Math.abs(target.rotX - current.rotX);
          const dy = Math.abs(target.rotY - current.rotY);
          const moving =
            dx > 0.0004 || dy > 0.0004 || Math.abs(scroll.velocity) > 0.15;

          if (moving || pointer.active) {
            idle = false;
            current.rotX += (target.rotX - current.rotX) * 0.06;
            current.rotY += (target.rotY - current.rotY) * 0.06;
            current.rotZ += (target.rotZ - current.rotZ) * 0.05;
          } else if (!idle) {
            current.rotX += (target.rotX - current.rotX) * 0.02;
            current.rotY += (target.rotY - current.rotY) * 0.02;
            current.rotZ += (target.rotZ - current.rotZ) * 0.02;
            if (
              Math.abs(target.rotX - current.rotX) < 0.0002 &&
              Math.abs(target.rotY - current.rotY) < 0.0002
            ) {
              idle = true;
            }
          }

          core.rotation.x = current.rotX;
          core.rotation.y = current.rotY;
          core.rotation.z = current.rotZ;

          scroll.velocity *= 0.92;
          renderer.render(scene, camera);
        }

        frame = requestAnimationFrame(tick);
      };

      tick();

      return () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("pointerleave", onPointerLeave);
        window.removeEventListener("scroll", onScroll);
      };
    };

    let cleanup: (() => void) | undefined;
    boot().then((fn) => {
      cleanup = fn;
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanup?.();
      if (scene) {
        scene.traverse((obj) => {
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
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden",
        className,
      )}
    />
  );
}
