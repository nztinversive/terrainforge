import { promises as fs } from 'fs';
import path from 'path';
import type { Project, DEM } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDataDir() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
}

// Projects
export async function getProjects(): Promise<Project[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(path.join(DATA_DIR, 'projects.json'), 'utf-8');
    return JSON.parse(data);
  } catch { return []; }
}

export async function saveProjects(projects: Project[]) {
  await ensureDataDir();
  await fs.writeFile(path.join(DATA_DIR, 'projects.json'), JSON.stringify(projects, null, 2));
}

// DEMs
export async function getDEMs(projectId: string): Promise<DEM[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(path.join(DATA_DIR, `dems-${projectId}.json`), 'utf-8');
    return JSON.parse(data);
  } catch { return []; }
}

export async function saveDEMs(projectId: string, dems: DEM[]) {
  await ensureDataDir();
  await fs.writeFile(path.join(DATA_DIR, `dems-${projectId}.json`), JSON.stringify(dems, null, 2));
}
