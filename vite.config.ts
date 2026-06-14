import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { fileURLToPath } from 'node:url';

const REPO_NAME = 'ekaterina-shmidt-presskit';

const entry = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/** Same-origin deploy: без crossorigin браузер не маскирует 404 HTML как CORS. */
function stripCrossorigin(): Plugin {
  return {
    name: 'strip-crossorigin',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace(/\s+crossorigin(?=\s|>)/g, '');
      },
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    stripCrossorigin(),
    viteCompression({ algorithm: 'gzip', ext: '.gz', threshold: 256 }),
  ],
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
        // Админ-панель (защищена паролем на стороне API)
        admin: entry('admin/index.html'),
        // Юридические страницы продавца (ИНН, оферта, политика, оплата/возврат)
        legalOffer: entry('guide/legal/offer/index.html'),
        legalPrivacy: entry('guide/legal/privacy/index.html'),
        legalPayment: entry('guide/legal/payment/index.html'),
        legalContacts: entry('guide/legal/contacts/index.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
}));
