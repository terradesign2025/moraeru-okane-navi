import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3939,
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // データ（毎月更新）とライブラリ（更新なし）を分割してキャッシュを効かせる
        manualChunks: {
          vendor: ['react', 'react-dom'],
          subsidies: ['./src/data/all_subsidies.js', './src/data/japan_cities.js'],
        },
      },
    },
  },
})
