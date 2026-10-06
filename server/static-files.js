import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

export function serveMuseumFiles(app, rootDir) {
  const distDir = path.join(rootDir, 'dist');
  // Persistent media must win over Vite's copied public files, even after deletion.
  app.use('/uploads', express.static(path.join(rootDir, 'public/uploads'), {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Isolate any active documents already present in persistent storage.
      res.setHeader('Content-Security-Policy', 'sandbox');
    },
  }));
  app.use(['/uploads', '/api', '/convex'], (_req, res) => {
    res.status(404).set('Cache-Control', 'no-store').json({ error: 'Not found' });
  });

  if (fs.existsSync(distDir)) {
    app.use('/assets', express.static(path.join(distDir, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));
    app.use(express.static(distDir, {
      maxAge: '10m',
      setHeaders: (res, filePath) => {
        if (path.extname(filePath) === '.html') {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        }
      },
    }));
  }

  app.get('{*path}', (_req, res) => {
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Build not found. Run "npm run build" first.');
    }
  });
}
