'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { useInView, useReducedMotion, type MotionValue } from 'motion/react';

/** The optional WebGL scene is loaded only when near the viewport. */
export function TravelGlobe({ progress }: { progress: MotionValue<number> }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const inView = useInView(host, { margin: '200px' });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView || !canvas.current || !host.current) return;
    const el = canvas.current;
    const container = host.current;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    void import('three').then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try { renderer = new THREE.WebGLRenderer({ canvas: el, alpha: true, antialias: true, powerPreference: 'low-power' }); }
      catch { return; } // The static globe remains visible if WebGL is unavailable.
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.z = 4.1;
      const earth = new THREE.Group();
      scene.add(earth);
      const geometry = new THREE.SphereGeometry(1, 56, 40);
      const texture = new THREE.TextureLoader().load('/media/earth-map.png', () => { if (!disposed) { el.style.opacity = '1'; render(); } });
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshPhongMaterial({ map: texture, color: 0x91aec4, shininess: 15, specular: 0x516c84 });
      earth.add(new THREE.Mesh(geometry, material));
      scene.add(new THREE.AmbientLight(0xffffff, 1.3));
      const sun = new THREE.DirectionalLight(0xd6eaff, 2.4);
      sun.position.set(-3, 3, 5);
      scene.add(sun);
      const rim = new THREE.DirectionalLight(0xd6b56b, 1.8);
      rim.position.set(3, -1, -2);
      scene.add(rim);
      const point = (lat: number, lng: number, r = 1.015) => {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lng + 180) * Math.PI / 180;
        return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
      };
      const origin = point(41.3, 69.24);
      const resources: Array<{ dispose: () => void }> = [geometry, material, texture];
      for (const [lat, lng] of [[41, 29], [25.2, 55.3], [-8.4, 115.2], [4.17, 73.5]]) {
        const end = point(lat, lng);
        const middle = origin.clone().add(end).normalize().multiplyScalar(1.32);
        const curve = new THREE.QuadraticBezierCurve3(origin, middle, end);
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xe9ca87, transparent: true, opacity: .85 });
        earth.add(new THREE.Line(lineGeometry, lineMaterial));
        const pinGeometry = new THREE.SphereGeometry(.014, 10, 10);
        const pinMaterial = new THREE.MeshBasicMaterial({ color: 0xffe6b0 });
        const pin = new THREE.Mesh(pinGeometry, pinMaterial);
        pin.position.copy(end);
        earth.add(pin);
        resources.push(lineGeometry, lineMaterial, pinGeometry, pinMaterial);
      }
      function render() {
        if (disposed || document.hidden) return;
        earth.rotation.y = -.65 + (reduced ? .3 : progress.get() * 1.4);
        earth.rotation.z = -.12;
        renderer.render(scene, camera);
      }
      const resize = new ResizeObserver(([entry]) => { const size = entry.contentRect.width; if (size > 0) { renderer.setSize(size, size, false); render(); } });
      resize.observe(container);
      const unsubscribe = progress.on('change', render);
      document.addEventListener('visibilitychange', render);
      const lost = (event: Event) => { event.preventDefault(); el.style.opacity = '0'; };
      el.addEventListener('webglcontextlost', lost);
      cleanup = () => { unsubscribe(); resize.disconnect(); document.removeEventListener('visibilitychange', render); el.removeEventListener('webglcontextlost', lost); resources.forEach((r) => r.dispose()); renderer.dispose(); el.style.opacity = '0'; };
      render();
    }).catch(() => {});
    return () => { disposed = true; cleanup?.(); };
  }, [inView, progress, reduced]);

  return <div ref={host} className="journey-globe" aria-hidden="true">
    <div className="absolute inset-[15%] overflow-hidden rounded-full opacity-60 shadow-[inset_-25px_-15px_60px_#050f22,0_0_90px_#34516a55]">
      <Image src="/media/earth-map.png" alt="" fill sizes="(max-width: 768px) 70vw, 440px" className="object-cover" />
      <div className="absolute inset-0 rounded-full shadow-[inset_-40px_-20px_70px_#050f22]" />
    </div>
    <canvas ref={canvas} className="relative opacity-0 transition-opacity duration-700" />
  </div>;
}
