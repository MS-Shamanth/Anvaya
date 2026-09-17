import { defineConfig, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

type Handler = (req: IncomingMessage, res: ServerResponse) => unknown;

/**
 * Serves the api/ folder in `vite dev` the way Vercel serves it in production, so
 * local sign-in exercises the deployed code path. Without this the dev server has
 * no /api at all unless a separate backend happens to be running, which is the
 * usual cause of "could not reach the sign-in service".
 *
 * Resolution mirrors vercel.json: an exact file first (/api/health → api/health.ts),
 * then the nearest parent function (/api/auth/login → api/auth.ts), which is what
 * the "/api/auth/:action" rewrite does in production.
 *
 * Set ANVAYA_API=proxy to bypass this and proxy /api to the Express server
 * (npm run server) instead.
 */
function anvayaApiRoutes(): Plugin {
  const root = new URL('./', import.meta.url);
  const apiDir = fileURLToPath(new URL('./api/', import.meta.url));

  /** Candidate handler files for a request path, most specific first. */
  function candidatesFor(route: string): string[] {
    const segments = route.split('/').filter(Boolean);
    const candidates: string[] = [];

    for (let end = segments.length; end > 0; end -= 1) {
      candidates.push(`api/${segments.slice(0, end).join('/')}.ts`);
    }

    return candidates;
  }

  return {
    name: 'anvaya-api-routes',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api', async (req, res, next) => {
        const route = (req.url ?? '/').split('?')[0].replace(/\/+$/, '');

        // Never expose internal helpers (Vercel ignores "_" files too).
        if (!route || route.includes('..') || route.split('/').some((part) => part.startsWith('_'))) {
          next();
          return;
        }

        const relative = candidatesFor(route).find((candidate) =>
          existsSync(new URL(candidate, root)),
        );

        if (!relative) {
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
