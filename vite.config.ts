import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

type Handler = (req: IncomingMessage, res: ServerResponse) => unknown;

/**
 * Serves the api/ folder in `vite dev` exactly the way Vercel serves it in
 * production, so local sign-in exercises the deployed code path. Without this the
 * dev server has no /api at all unless a separate backend happens to be running,
 * which is the usual cause of "could not reach the sign-in service".
 *
 * Set ANVAYA_API=proxy to bypass this and proxy /api to the Express server
 * (npm run server) instead.
 */
function anvayaApiRoutes(): Plugin {
  const apiDir = fileURLToPath(new URL('./api/', import.meta.url));

  return {
    name: 'anvaya-api-routes',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api', async (req, res, next) => {
        const route = (req.url ?? '/').split('?')[0].replace(/\/+$/, '');
        // Never expose the shared helpers as endpoints.
        if (!route || route.includes('..') || route.split('/').some((part) => part.startsWith('_'))) {
          next();
          return;
        }

        const relative = `api${route}.ts`;
        if (!existsSync(new URL(relative, new URL('./', import.meta.url)))) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Not found' }));
          return;
        }

        try {
          const module = await server.ssrLoadModule(`/${relative}`);
          const handler = (module as { default?: Handler }).default;
          if (typeof handler !== 'function') {
            throw new Error(`${relative} does not export a default handler`);
          }
          await handler(req, res);
        } catch (error) {
          server.config.logger.error(`[anvaya-api] ${relative} failed: ${String(error)}`);
          if (!res.writableEnded) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        }
      });

      server.config.logger.info(`  ➜  API:      serving ${apiDir} in-process`);
    },
  };
}

export default defineConfig(({ mode }) => {
  // `npm run dev:express` (vite --mode express) proxies /api to the Express
  // server instead of running the api/ handlers in-process.
  const useExpressProxy = mode === 'express' || process.env.ANVAYA_API === 'proxy';

  return {
    plugins: [react(), tailwindcss(), ...(useExpressProxy ? [] : [anvayaApiRoutes()])],
    server: {
      port: 5173,
      ...(useExpressProxy
        ? {
            proxy: {
              '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
              },
            },
          }
        : {}),
    },
  };
});
