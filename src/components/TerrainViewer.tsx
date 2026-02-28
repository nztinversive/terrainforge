'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface TerrainViewerProps {
  elevationData: number[][];
  heatmapData?: number[][] | null;
  mode: 'elevation' | 'cutfill' | 'slope';
  slopeData?: number[][] | null;
  stats: { min: number; max: number; mean: number };
}

function getElevationColor(value: number, min: number, max: number): THREE.Color {
  const t = (value - min) / (max - min || 1);
  // Green-brown-white gradient (topo style)
  if (t < 0.25) return new THREE.Color().lerpColors(new THREE.Color(0x1a472a), new THREE.Color(0x2d8c4e), t / 0.25);
  if (t < 0.5) return new THREE.Color().lerpColors(new THREE.Color(0x2d8c4e), new THREE.Color(0x8c7a3c), (t - 0.25) / 0.25);
  if (t < 0.75) return new THREE.Color().lerpColors(new THREE.Color(0x8c7a3c), new THREE.Color(0xa0825c), (t - 0.5) / 0.25);
  return new THREE.Color().lerpColors(new THREE.Color(0xa0825c), new THREE.Color(0xf0f0f0), (t - 0.75) / 0.25);
}

function getCutFillColor(value: number): THREE.Color {
  if (value > 0) {
    // Cut = red
    const t = Math.min(value / 15, 1);
    return new THREE.Color().lerpColors(new THREE.Color(0x333333), new THREE.Color(0xff2222), t);
  } else {
    // Fill = blue
    const t = Math.min(Math.abs(value) / 15, 1);
    return new THREE.Color().lerpColors(new THREE.Color(0x333333), new THREE.Color(0x2266ff), t);
  }
}

function getSlopeColor(percent: number): THREE.Color {
  if (percent < 5) return new THREE.Color(0x22cc44); // gentle = green
  if (percent < 15) return new THREE.Color(0xcccc22); // moderate = yellow
  if (percent < 30) return new THREE.Color(0xff8800); // steep = orange
  return new THREE.Color(0xff2222); // very steep = red
}

export default function TerrainViewer({ elevationData, heatmapData, mode, slopeData, stats }: TerrainViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!mountRef.current || !elevationData.length) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(120, 80, 120);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(50, 0, 50);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 100, 50);
    scene.add(dirLight);

    // Terrain geometry
    const rows = elevationData.length;
    const cols = elevationData[0].length;
    const scale = 100 / Math.max(rows, cols); // fit in 100 unit box
    const elevScale = 0.3; // vertical exaggeration

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const elev = elevationData[y][x];
        vertices.push(x * scale, (elev - stats.min) * elevScale * scale, y * scale);

        let color: THREE.Color;
        if (mode === 'cutfill' && heatmapData) {
          color = getCutFillColor(heatmapData[y]?.[x] || 0);
        } else if (mode === 'slope' && slopeData) {
          color = getSlopeColor(slopeData[y]?.[x] || 0);
        } else {
          color = getElevationColor(elev, stats.min, stats.max);
        }
        colors.push(color.r, color.g, color.b);
      }
    }

    for (let y = 0; y < rows - 1; y++) {
      for (let x = 0; x < cols - 1; x++) {
        const i = y * cols + x;
        indices.push(i, i + cols, i + 1);
        indices.push(i + 1, i + cols, i + cols + 1);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Grid helper
    const gridHelper = new THREE.GridHelper(100, 20, 0x333333, 0x222222);
    gridHelper.position.set(50 * scale, -0.1, 50 * scale);
    scene.add(gridHelper);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [elevationData, heatmapData, mode, slopeData, stats]);

  return <div ref={mountRef} className="w-full h-full min-h-[500px]" />;
}
