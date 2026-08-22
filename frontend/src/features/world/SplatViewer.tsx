import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

/**
 * Renders a Marble Gaussian-splat world (.spz) with World Labs' Spark
 * renderer — the same engine marble.worldlabs.ai uses — so the in-app
 * preview is the actual generated world, not a flat panorama.
 *
 * Drag to look around, wheel to move forward/back.
 */
export function SplatViewer({
  src,
  className,
  onError,
}: {
  src: string;
  className?: string;
  onError?: () => void;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 320;

    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
    camera.position.set(0, 0, 0);

    const spark = new SparkRenderer({ renderer });
    scene.add(spark);

    let disposed = false;
    const splat = new SplatMesh({ url: src });
    // Marble SPZ assets use the marble_raw_opencv axis convention; the web
    // viewer applies a 180° rotation around X, so we do the same.
    splat.quaternion.set(1, 0, 0, 0);
    scene.add(splat);

    // Surface load failures so the caller can fall back to the panorama.
    const initialized: Promise<unknown> | undefined = (
      splat as unknown as { initialized?: Promise<unknown> }
    ).initialized;
    initialized?.catch?.(() => {
      if (!disposed) onErrorRef.current?.();
    });

    // Look controls: drag to pan (yaw/pitch), wheel to dolly along the view.
    let lon = 0;
    let lat = 0;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    const canvas = renderer.domElement;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      lon -= (e.clientX - lastX) * 0.12;
      lat += (e.clientY - lastY) * 0.12;
      lat = Math.max(-85, Math.min(85, lat));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = () => (dragging = false);
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      camera.position.addScaledVector(dir, e.deltaY * -0.002);
      // Stay inside the generated scene rather than flying out of it.
      camera.position.clampLength(0, 4);
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const look = new THREE.Vector3();
    renderer.setAnimationLoop(() => {
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      look
        .set(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta)
        )
        .add(camera.position);
      camera.lookAt(look);
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      scene.remove(splat);
      (splat as unknown as { dispose?: () => void }).dispose?.();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [src]);

  return <div ref={mountRef} className={className} />;
}
