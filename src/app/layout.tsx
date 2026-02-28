import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TerrainForge - Drone-to-Terrain Intelligence',
  description: 'Upload drone imagery, get 3D terrain models, contour maps, and cut/fill volume calculations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
