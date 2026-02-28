'use client';

import { useState } from 'react';

interface CutFillPanelProps {
  stats: { min: number; max: number; mean: number };
  onAnalyze: (elevation: number) => void;
  result: { cutVolume: number; fillVolume: number; netVolume: number } | null;
  loading: boolean;
}

export default function CutFillPanel({ stats, onAnalyze, result, loading }: CutFillPanelProps) {
  const [elevation, setElevation] = useState(Math.round(stats.mean));

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span className="text-red-400">&#9650;</span>
        <span className="text-blue-400">&#9660;</span>
        Cut/Fill Calculator
      </h3>

      <div className="space-y-3">
        <div>
          <label className="text-gray-400 text-sm block mb-1">Design Pad Elevation (ft)</label>
          <input
            type="range"
            min={Math.floor(stats.min)}
            max={Math.ceil(stats.max)}
            step={0.5}
            value={elevation}
            onChange={(e) => setElevation(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{Math.floor(stats.min)} ft</span>
            <span className="text-emerald-400 font-mono text-sm">{elevation} ft</span>
            <span>{Math.ceil(stats.max)} ft</span>
          </div>
        </div>

        <button
          onClick={() => onAnalyze(elevation)}
          disabled={loading}
          className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          {loading ? 'Calculating...' : 'Calculate Earthwork'}
        </button>

        {result && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
              <div className="text-red-400 text-xs uppercase tracking-wider">Cut</div>
              <div className="text-white text-lg font-bold">{result.cutVolume.toLocaleString()}</div>
              <div className="text-gray-500 text-xs">yd&sup3;</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
              <div className="text-blue-400 text-xs uppercase tracking-wider">Fill</div>
              <div className="text-white text-lg font-bold">{result.fillVolume.toLocaleString()}</div>
              <div className="text-gray-500 text-xs">yd&sup3;</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <div className="text-gray-400 text-xs uppercase tracking-wider">Net</div>
              <div className={`text-lg font-bold ${result.netVolume > 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {result.netVolume > 0 ? '+' : ''}{result.netVolume.toLocaleString()}
              </div>
              <div className="text-gray-500 text-xs">yd&sup3;</div>
            </div>
          </div>
        )}

        {result && (
          <div className="text-xs text-gray-500 mt-2">
            {result.netVolume > 0 ? (
              <span>Net <span className="text-red-400">export</span> — {result.netVolume.toLocaleString()} yd&sup3; excess material to haul off-site</span>
            ) : (
              <span>Net <span className="text-blue-400">import</span> — {Math.abs(result.netVolume).toLocaleString()} yd&sup3; fill material needed</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
