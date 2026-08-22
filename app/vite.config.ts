import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"
// @ts-ignore
import fs from 'node:fs'
// @ts-ignore
import path from 'node:path'
// @ts-ignore
import { fileURLToPath } from 'node:url'

// @ts-ignore
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const saveProjectsPlugin = () => ({
  name: 'save-projects',
  configureServer(server: any) {
    server.middlewares.use('/api/save-projects', (req: any, res: any) => {
      let body = '';
      req.on('data', (chunk: any) => body += chunk);
      req.on('end', () => {
        try {
          const filePath = path.resolve(_dirname, 'src/data/projects.json');
          fs.writeFileSync(filePath, JSON.stringify(JSON.parse(body), null, 2));
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: String(e) }));
        }
      });
    });
  }
});

export default defineConfig({
  plugins: [react(), saveProjectsPlugin()],
  resolve: {
    alias: [
      { find: /^three$/, replacement: 'three/webgpu' }
    ]
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
})
