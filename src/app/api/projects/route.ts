import { NextRequest, NextResponse } from 'next/server';
import { getProjects, saveProjects } from '@/lib/store';
import { generateSyntheticTerrain, computeStats } from '@/lib/terrain-generator';
import { saveDEMs } from '@/lib/store';
import type { DEM } from '@/lib/types';

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const projects = await getProjects();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const project = {
    id,
    name: body.name || 'Untitled Project',
    description: body.description || '',
    location: body.location || '',
    createdAt: now,
    updatedAt: now,
    demCount: 1,
    imageCount: 0,
  };

  projects.push(project);
  await saveProjects(projects);

  // Generate synthetic DEM for demo
  if (body.generateDemo !== false) {
    const terrain = generateSyntheticTerrain(200, 200);
    const stats = computeStats(terrain);
    const dem: DEM = {
      id: crypto.randomUUID(),
      projectId: id,
      name: 'Existing Terrain',
      type: 'existing',
      createdAt: now,
      resolution: 1.524, // 5 ft in meters
      width: 200,
      height: 200,
      bounds: { north: 30.2672, south: 30.2642, east: -97.7391, west: -97.7421 },
      elevationData: terrain,
      stats,
    };
    await saveDEMs(id, [dem]);
  }

  return NextResponse.json(project, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  let projects = await getProjects();
  projects = projects.filter(p => p.id !== id);
  await saveProjects(projects);
  return NextResponse.json({ ok: true });
}
