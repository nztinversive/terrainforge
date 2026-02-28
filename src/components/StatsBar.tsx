'use client';

interface StatsBarProps {
  stats: { min: number; max: number; mean: number; stddev: number };
  gridSize: { width: number; height: number };
}

export default function StatsBar({ stats, gridSize }: StatsBarProps) {
  const acreage = (gridSize.width * 5 * gridSize.height * 5) / 43560; // 5ft cells, sq ft to acres

  return (
    <div className="flex flex-wrap gap-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 px-4 py-3">
      <Stat label="Min Elevation" value={`${stats.min} ft`} />
      <Stat label="Max Elevation" value={`${stats.max} ft`} />
      <Stat label="Mean" value={`${stats.mean} ft`} />
      <Stat label="Std Dev" value={`${stats.stddev} ft`} />
      <Stat label="Relief" value={`${(stats.max - stats.min).toFixed(1)} ft`} />
      <Stat label="Grid" value={`${gridSize.width} x ${gridSize.height}`} />
      <Stat label="Area" value={`${acreage.toFixed(1)} acres`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-500 text-xs uppercase tracking-wider">{label}</span>
      <span className="text-white font-mono text-sm">{value}</span>
    </div>
  );
}
