import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^three$/, replacement: 'three/webgpu' }
    ]
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
})
