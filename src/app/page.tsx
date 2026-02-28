'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import StatsBar from '@/components/StatsBar';
import CutFillPanel from '@/components/CutFillPanel';
import ContourMap from '@/components/ContourMap';

const TerrainViewer = dynamic(() => import('@/components/TerrainViewer'), { ssr: false });

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  createdAt: string;
  demCount: number;
}

interface DEM {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  elevationData: number[][];
  stats: { min: number; max: number; mean: number; stddev: number };
}

type ViewMode = 'elevation' | 'cutfill' | 'slope' | 'contour';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dem, setDem] = useState<DEM | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('elevation');
  const [cutFillResult, setCutFillResult] = useState<{ cutVolume: number; fillVolume: number; netVolume: number; heatmap: number[][] } | null>(null);
  const [contours, setContours] = useState<{ elevation: number; points: [number, number][] }[]>([]);
  const [slopeData, setSlopeData] = useState<number[][] | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);

  // Load projects
  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects);
  }, []);

  // Load DEM when project selected
  useEffect(() => {
    if (!selectedProject) { setDem(null); return; }
    fetch(`/api/dem?projectId=${selectedProject.id}`)
      .then(r => r.json())
      .then((dems: DEM[]) => {
        if (dems.length > 0) setDem(dems[0]);
      });
  }, [selectedProject]);

  // Auto-load contours
  useEffect(() => {
    if (!dem || !selectedProject) return;
    fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: selectedProject.id, demId: dem.id, type: 'contours', contourInterval: 5 })
    }).then(r => r.json()).then(data => setContours(data.contours || []));
  }, [dem, selectedProject]);

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    setCreating(true);
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName, description: 'Demo terrain - Texas Hill Country', location: 'Austin, TX' })
    });
    const project = await res.json();
    setProjects(prev => [...prev, project]);
    setSelectedProject(project);
    setNewProjectName('');
    setShowNewForm(false);
    setCreating(false);
  };

  const runCutFill = async (elevation: number) => {
    if (!dem || !selectedProject) return;
    setLoading(true);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: selectedProject.id, demId: dem.id, type: 'cutfill', designElevation: elevation })
    });
    const data = await res.json();
    setCutFillResult(data);
    setViewMode('cutfill');
    setLoading(false);
  };

  const loadSlope = async () => {
    if (!dem || !selectedProject) return;
    setLoading(true);
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: selectedProject.id, demId: dem.id, type: 'slope' })
    });
    const data = await res.json();
    setSlopeData(data.gradient);
    setViewMode('slope');
    setLoading(false);
  };

  const deleteProject = async (id: string) => {
    await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
    if (selectedProject?.id === id) {
      setSelectedProject(null);
      setDem(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-black font-bold text-sm">TF</div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">TerrainForge</h1>
              <p className="text-xs text-gray-500">Drone-to-Terrain Intelligence</p>
            </div>
          </div>
          {selectedProject && (
            <div className="text-sm text-gray-400">
              {selectedProject.name} &middot; {selectedProject.location}
            </div>
          )}
        </div>
      </header>

      <div className="flex max-w-[1800px] mx-auto">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 p-4 min-h-[calc(100vh-65px)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Projects</h2>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="text-emerald-400 hover:text-emerald-300 text-lg leading-none"
            >+</button>
          </div>

          {showNewForm && (
            <div className="mb-3 space-y-2">
              <input
                type="text"
                placeholder="Project name..."
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createProject()}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button
                onClick={createProject}
                disabled={creating || !newProjectName.trim()}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white text-sm rounded-lg transition-colors"
              >
                {creating ? 'Creating...' : 'Create with Demo Terrain'}
              </button>
            </div>
          )}

          <div className="space-y-1">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedProject?.id === p.id ? 'bg-emerald-500/20 border border-emerald-500/30' : 'hover:bg-white/5'
                }`}
              >
                <div className="truncate">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.demCount} DEM{p.demCount !== 1 ? 's' : ''}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteProject(p.id); }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs"
                >&times;</button>
              </div>
            ))}

            {projects.length === 0 && !showNewForm && (
              <div className="text-center py-8 text-gray-600">
                <div className="text-2xl mb-2">&#9968;</div>
                <div className="text-sm">No projects yet</div>
                <div className="text-xs mt-1">Click + to create one with demo terrain</div>
              </div>
            )}
          </div>

          {/* View mode controls */}
          {dem && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">View</h3>
              <div className="space-y-1">
                {[
                  { mode: 'elevation' as ViewMode, label: 'Elevation', icon: '&#9650;' },
                  { mode: 'cutfill' as ViewMode, label: 'Cut/Fill', icon: '&#9878;' },
                  { mode: 'slope' as ViewMode, label: 'Slope', icon: '&#8599;' },
                  { mode: 'contour' as ViewMode, label: 'Contour Map', icon: '&#9737;' },
                ].map(({ mode: m, label, icon }) => (
                  <button
                    key={m}
                    onClick={() => {
                      if (m === 'slope' && !slopeData) loadSlope();
                      else setViewMode(m);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      viewMode === m ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span dangerouslySetInnerHTML={{ __html: icon }} /> {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 space-y-4">
          {!dem ? (
            <div className="flex items-center justify-center h-[600px] text-gray-600">
              <div className="text-center">
                <div className="text-6xl mb-4">&#127956;</div>
                <div className="text-xl font-semibold mb-1">TerrainForge</div>
                <div className="text-sm">Select or create a project to visualize terrain</div>
              </div>
            </div>
          ) : (
            <>
              <StatsBar stats={dem.stats} gridSize={{ width: dem.width, height: dem.height }} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 3D Viewer or Contour Map */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden" style={{ height: 550 }}>
                  {viewMode === 'contour' ? (
                    <div className="p-4 flex items-center justify-center h-full">
                      <ContourMap
                        elevationData={dem.elevationData}
                        contours={contours}
                        stats={dem.stats}
                        width={600}
                        height={600}
                      />
                    </div>
                  ) : (
                    <TerrainViewer
                      elevationData={dem.elevationData}
                      heatmapData={viewMode === 'cutfill' ? cutFillResult?.heatmap : null}
                      mode={viewMode === 'cutfill' ? 'cutfill' : viewMode === 'slope' ? 'slope' : 'elevation'}
                      slopeData={viewMode === 'slope' ? slopeData : null}
                      stats={dem.stats}
                    />
                  )}
                </div>

                {/* Analysis Panel */}
                <div className="space-y-4">
                  <CutFillPanel
                    stats={dem.stats}
                    onAnalyze={runCutFill}
                    result={cutFillResult}
                    loading={loading}
                  />

                  {/* Legend */}
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                    <h3 className="text-white font-semibold mb-3">Legend</h3>
                    {viewMode === 'elevation' && (
                      <div className="space-y-2">
                        <div className="h-4 rounded bg-gradient-to-r from-[#1a472a] via-[#8c7a3c] to-[#f0f0f0]" />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{dem.stats.min} ft</span>
                          <span>{dem.stats.max} ft</span>
                        </div>
                      </div>
                    )}
                    {viewMode === 'cutfill' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-red-500" />
                          <span className="text-sm text-gray-300">Cut (remove material)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-blue-500" />
                          <span className="text-sm text-gray-300">Fill (add material)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gray-600" />
                          <span className="text-sm text-gray-300">Near grade (minimal work)</span>
                        </div>
                      </div>
                    )}
                    {viewMode === 'slope' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-green-500" />
                          <span className="text-sm text-gray-300">&lt;5% Gentle</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-yellow-500" />
                          <span className="text-sm text-gray-300">5-15% Moderate</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-orange-500" />
                          <span className="text-sm text-gray-300">15-30% Steep</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-red-500" />
                          <span className="text-sm text-gray-300">&gt;30% Very Steep</span>
                        </div>
                      </div>
                    )}
                    {viewMode === 'contour' && (
                      <div className="space-y-2">
                        <div className="text-sm text-gray-300">
                          Contour interval: 5 ft<br />
                          Bold lines: 10 ft intervals
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Contour count */}
                  {contours.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4">
                      <h3 className="text-white font-semibold mb-2">Contour Lines</h3>
                      <div className="text-sm text-gray-400">
                        {contours.length} contours generated<br />
                        Range: {contours[0]?.elevation} ft - {contours[contours.length - 1]?.elevation} ft
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
