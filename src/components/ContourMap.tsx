'use client';

import { useRef, useEffect } from 'react';

interface ContourMapProps {
  elevationData: number[][];
  contours: { elevation: number; points: [number, number][] }[];
  stats: { min: number; max: number };
  width?: number;
  height?: number;
}

function getTopoColor(value: number, min: number, max: number): string {
  const t = (value - min) / (max - min || 1);
  const r = Math.round(30 + t * 180);
  const g = Math.round(120 - t * 60);
  const b = Math.round(30 + (1 - t) * 40);
  return `rgb(${r},${g},${b})`;
}

export default function ContourMap({ elevationData, contours, stats, width = 600, height = 600 }: ContourMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !elevationData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rows = elevationData.length;
    const cols = elevationData[0].length;
    const cellW = width / cols;
    const cellH = height / rows;

    // Draw elevation colors
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = getTopoColor(elevationData[y][x], stats.min, stats.max);
        ctx.fillRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // Draw contour points
    for (const contour of contours) {
      const isMajor = contour.elevation % 10 === 0;
      ctx.fillStyle = isMajor ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
      for (const [px, py] of contour.points) {
        ctx.fillRect(px * cellW - 0.5, py * cellH - 0.5, isMajor ? 2 : 1, isMajor ? 2 : 1);
      }

      // Label major contours
      if (isMajor && contour.points.length > 0) {
        const labelPoint = contour.points[Math.floor(contour.points.length / 2)];
        ctx.fillStyle = 'white';
        ctx.font = '10px monospace';
        ctx.fillText(`${contour.elevation}'`, labelPoint[0] * cellW + 3, labelPoint[1] * cellH - 3);
      }
    }
  }, [elevationData, contours, stats, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg border border-white/10"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
