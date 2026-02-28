import { NextRequest, NextResponse } from 'next/server';
import { getDEMs } from '@/lib/store';
import { computeCutFill, computeContours, computeSlope } from '@/lib/terrain-generator';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { projectId, demId, type, designElevation, contourInterval } = body;

  const dems = await getDEMs(projectId);
  const dem = dems.find(d => d.id === demId);
  if (!dem) return NextResponse.json({ error: 'DEM not found' }, { status: 404 });

  if (type === 'cutfill') {
    const result = computeCutFill(dem.elevationData, designElevation || 845, 5);
    return NextResponse.json({
      cutVolume: result.cutVolume,
      fillVolume: result.fillVolume,
      netVolume: result.netVolume,
      heatmap: result.heatmap,
    });
  }

  if (type === 'contours') {
    const contours = computeContours(dem.elevationData, contourInterval || 5);
    return NextResponse.json({ contours });
  }

  if (type === 'slope') {
    const slope = computeSlope(dem.elevationData, 5);
    return NextResponse.json(slope);
  }

  return NextResponse.json({ error: 'Unknown analysis type' }, { status: 400 });
}
