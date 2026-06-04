import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const REPO_NAME = 'ekaterina-shmidt-presskit';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  publicDir: 'public',
  base: mode === 'ghpages' ? `/${REPO_NAME}/` : '/',
}));
