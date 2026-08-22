import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Renders an equirectangular panorama (e.g. a World Labs / Marble world pano)
 * as an inside-out sphere the user can look around by dragging. Same-origin
 * object URLs only, so the WebGL texture is never CORS-tainted.
 */
export function PanoramaViewer({
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

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 100);

    // Sphere flipped inside-out so the texture is viewed from within.
    const geometry = new THREE.SphereGeometry(10, 60, 40);
    geometry.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    let disposed = false;
    let mesh: THREE.Mesh | null = null;

    loader.load(
      src,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({ map: texture })
        );
        scene.add(mesh);
      },
      undefined,
      () => onErrorRef.current?.()
    );

    // Look controls: drag to pan (yaw/pitch), wheel to change FOV (zoom).
    let lon = 0;
    let lat = 0;
    let dragging = false;
    let autoRotate = true;
    let lastX = 0;
    let lastY = 0;
    let idle: ReturnType<typeof setTimeout> | null = null;
    const canvas = renderer.domElement;

    const pauseAuto = () => {
      autoRotate = false;
      if (idle) clearTimeout(idle);
      idle = setTimeout(() => (autoRotate = true), 3500);
    };
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      pauseAuto();
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
      camera.fov = Math.max(35, Math.min(90, camera.fov + e.deltaY * 0.03));
      camera.updateProjectionMatrix();
      pauseAuto();
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

    let raf = 0;
    const animate = () => {
      if (autoRotate && !dragging) lon += 0.04;
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta)
      );
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (idle) clearTimeout(idle);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      geometry.dispose();
      if (mesh) {
        (mesh.material as THREE.MeshBasicMaterial).map?.dispose();
        (mesh.material as THREE.MeshBasicMaterial).dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [src]);

  return <div ref={mountRef} className={className} />;
}
