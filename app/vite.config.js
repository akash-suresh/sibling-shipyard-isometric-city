import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
// @ts-ignore
import fs from 'node:fs';
// @ts-ignore
import path from 'node:path';
// @ts-ignore
import { fileURLToPath } from 'node:url';
// @ts-ignore
var _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
var saveProjectsPlugin = function () { return ({
    name: 'save-projects',
    configureServer: function (server) {
        server.middlewares.use('/api/save-projects', function (req, res) {
            var body = '';
            req.on('data', function (chunk) { return body += chunk; });
            req.on('end', function () {
                try {
                    var filePath = path.resolve(_dirname, 'src/data/projects.json');
                    fs.writeFileSync(filePath, JSON.stringify(JSON.parse(body), null, 2));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                }
                catch (e) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: String(e) }));
                }
            });
        });
    }
}); };
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
});
