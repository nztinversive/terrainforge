export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  bounds?: { north: number; south: number; east: number; west: number };
  demCount: number;
  imageCount: number;
}

export interface DEM {
  id: string;
  projectId: string;
  name: string;
  type: 'existing' | 'design';
  createdAt: string;
  resolution: number; // meters per pixel
  width: number;
  height: number;
  bounds: { north: number; south: number; east: number; west: number };
  elevationData: number[][]; // 2D grid of elevations in feet
  stats: { min: number; max: number; mean: number; stddev: number };
}

export interface CutFillAnalysis {
  id: string;
  projectId: string;
  existingDemId: string;
  designSurfaceElevation: number; // flat pad elevation in feet
  createdAt: string;
  cutVolume: number; // cubic yards
  fillVolume: number; // cubic yards
  netVolume: number;
  heatmapData: number[][]; // positive=cut, negative=fill
  cellSizeYards: number;
}

export interface ContourLine {
  elevation: number;
  paths: [number, number][][]; // array of line segments, each is array of [x, y] grid coords
}

export interface SlopeData {
  gradient: number[][]; // percent slope
  aspect: number[][]; // degrees from north
}
