import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages 公開先：https://<user>.github.io/furiko-aim/
// dist/index.html のアセット参照を /furiko-aim/... 起点にする
export default defineConfig({
  base: '/furiko-aim/',
  plugins: [react()],
})
