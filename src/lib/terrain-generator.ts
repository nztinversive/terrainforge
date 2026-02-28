// Generate synthetic terrain data resembling Texas Hill Country
// Rolling hills with a drainage channel, elevation 820-870 ft

export function generateSyntheticTerrain(width: number = 200, height: number = 200): number[][] {
  const grid: number[][] = [];
  const baseElevation = 845;

  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const ny = y / height;

      // Base rolling hills using multiple sine waves
      let elevation = baseElevation;

      // Large hill in NW quadrant
      elevation += 15 * Math.exp(-((nx - 0.3) ** 2 + (ny - 0.3) ** 2) / 0.04);

      // Ridge running NE-SW
      const ridgeDist = Math.abs((nx - ny) * 0.7 + 0.1);
      elevation += 10 * Math.exp(-(ridgeDist ** 2) / 0.01);

      // Gentle rolling
      elevation += 5 * Math.sin(nx * Math.PI * 3) * Math.cos(ny * Math.PI * 2.5);
      elevation += 3 * Math.sin(nx * Math.PI * 7 + 1.2) * Math.cos(ny * Math.PI * 5.3 + 0.8);

      // Drainage channel running roughly N-S with some meandering
      const channelX = 0.6 + 0.08 * Math.sin(ny * Math.PI * 3);
      const channelDist = Math.abs(nx - channelX);
      elevation -= 12 * Math.exp(-(channelDist ** 2) / 0.002);

      // Small depression (pond area)
      elevation -= 6 * Math.exp(-((nx - 0.75) ** 2 + (ny - 0.7) ** 2) / 0.005);

      // Flat building pad area (for cut/fill demo) - slight existing slope
      const padCenterX = 0.4;
      const padCenterY = 0.65;
      const padDist = Math.sqrt((nx - padCenterX) ** 2 + (ny - padCenterY) ** 2);
      if (padDist < 0.12) {
        // Blend toward a slightly sloped surface
        const blend = 1 - padDist / 0.12;
        const padElev = 842 + (ny - padCenterY) * 20; // slight N-S slope
        elevation = elevation * (1 - blend * 0.5) + padElev * blend * 0.5;
      }

      // Add micro noise for realism
      elevation += 0.5 * (Math.sin(x * 13.7 + y * 7.3) + Math.cos(x * 9.1 - y * 11.9));

      row.push(Math.round(elevation * 100) / 100);
    }
    grid.push(row);
  }

  return grid;
}

export function computeStats(grid: number[][]): { min: number; max: number; mean: number; stddev: number } {
  let min = Infinity, max = -Infinity, sum = 0, count = 0;
  for (const row of grid) {
    for (const v of row) {
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      count++;
    }
  }
  const mean = sum / count;
  let variance = 0;
  for (const row of grid) {
    for (const v of row) {
      variance += (v - mean) ** 2;
    }
  }
  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    stddev: Math.round(Math.sqrt(variance / count) * 100) / 100
  };
}

export function computeContours(grid: number[][], interval: number = 5): { elevation: number; points: [number, number][] }[] {
  const stats = computeStats(grid);
  const contours: { elevation: number; points: [number, number][] }[] = [];
  const startElev = Math.ceil(stats.min / interval) * interval;
  const endElev = Math.floor(stats.max / interval) * interval;

  for (let elev = startElev; elev <= endElev; elev += interval) {
    const points: [number, number][] = [];
    // Simple marching: find cells where the contour crosses
    for (let y = 0; y < grid.length - 1; y++) {
      for (let x = 0; x < grid[0].length - 1; x++) {
        const tl = grid[y][x], tr = grid[y][x + 1];
        const bl = grid[y + 1][x];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _br = grid[y + 1][x + 1];

        // Check each edge for crossing
        // Top edge
        if ((tl - elev) * (tr - elev) < 0) {
          const t = (elev - tl) / (tr - tl);
          points.push([x + t, y]);
        }
        // Left edge
        if ((tl - elev) * (bl - elev) < 0) {
          const t = (elev - tl) / (bl - tl);
          points.push([x, y + t]);
        }
      }
    }
    if (points.length > 0) {
      contours.push({ elevation: elev, points });
    }
  }

  return contours;
}

export function computeCutFill(
  existing: number[][],
  designElevation: number,
  cellSizeFt: number = 5 // each cell is 5x5 feet
): { cutVolume: number; fillVolume: number; netVolume: number; heatmap: number[][] } {
  let cutCubicFt = 0;
  let fillCubicFt = 0;
  const heatmap: number[][] = [];
  const cellArea = cellSizeFt * cellSizeFt;

  for (let y = 0; y < existing.length; y++) {
    const row: number[] = [];
    for (let x = 0; x < existing[0].length; x++) {
      const diff = existing[y][x] - designElevation; // positive = cut needed
      const volume = diff * cellArea;
      if (diff > 0) {
        cutCubicFt += volume;
      } else {
        fillCubicFt += Math.abs(volume);
      }
      row.push(Math.round(diff * 100) / 100);
    }
    heatmap.push(row);
  }

  // Convert cubic feet to cubic yards (1 yd^3 = 27 ft^3)
  return {
    cutVolume: Math.round(cutCubicFt / 27),
    fillVolume: Math.round(fillCubicFt / 27),
    netVolume: Math.round((cutCubicFt - fillCubicFt) / 27),
    heatmap
  };
}

export function computeSlope(grid: number[][], cellSizeFt: number = 5): { gradient: number[][]; aspect: number[][] } {
  const h = grid.length;
  const w = grid[0].length;
  const gradient: number[][] = [];
  const aspect: number[][] = [];

  for (let y = 0; y < h; y++) {
    const gRow: number[] = [];
    const aRow: number[] = [];
    for (let x = 0; x < w; x++) {
      // Central differences (clamped at edges)
      const left = grid[y][Math.max(0, x - 1)];
      const right = grid[y][Math.min(w - 1, x + 1)];
      const up = grid[Math.max(0, y - 1)][x];
      const down = grid[Math.min(h - 1, y + 1)][x];

      const dx = (right - left) / (2 * cellSizeFt);
      const dy = (down - up) / (2 * cellSizeFt);

      const slopePercent = Math.sqrt(dx * dx + dy * dy) * 100;
      const aspectDeg = (Math.atan2(-dy, dx) * 180 / Math.PI + 360) % 360;

      gRow.push(Math.round(slopePercent * 10) / 10);
      aRow.push(Math.round(aspectDeg));
    }
    gradient.push(gRow);
    aspect.push(aRow);
  }

  return { gradient, aspect };
}
