import { NextRequest, NextResponse } from 'next/server';
import { getDEMs } from '@/lib/store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'Missing projectId' }, { status: 400 });

  const dems = await getDEMs(projectId);
  return NextResponse.json(dems);
}
