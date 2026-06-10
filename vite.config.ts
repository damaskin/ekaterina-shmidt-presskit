import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const REPO_NAME = 'ekaterina-shmidt-presskit';

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  publicDir: 'public',
  base: mode === 'ghpages' ? `/${REPO_NAME}/` : '/',
  build: {
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: entry('index.html'),
        guide: entry('guide/index.html'),
        // Скрытая страница полного гайда — ссылку покупателям отправляет Екатерина
        guideMaldives: entry('guide/maldives-311da15937d7/index.html'),
      },
    },
  },
}));
