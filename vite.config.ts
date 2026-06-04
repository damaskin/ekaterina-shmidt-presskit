import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Имя репозитория на GitHub — должен совпадать с base для Pages */
const REPO_NAME = 'ekaterina-shmidt-presskit';

export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  base: process.env.GITHUB_PAGES === 'true' ? `/${REPO_NAME}/` : '/',
});
