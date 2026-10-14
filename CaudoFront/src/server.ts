import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { request as httpRequest, type IncomingMessage } from 'node:http';
import { request as httpsRequest } from 'node:https';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Proxy de /api/* hacia el backend NestJS (BACKEND_URL, default localhost:3000).
 * Solo usa módulos nativos de Node (cero dependencias): reenvía método,
 * cabeceras y cuerpo, y devuelve 502 si el backend no responde. Gracias a esto
 * el browser llama a /api same-origin y no hay CORS frontend -> backend.
 */
const backendUrl = new URL(process.env['BACKEND_URL'] ?? 'http://localhost:3000');

// Cabeceras hop-by-hop (RFC 9110 §7.6.1): no se reenvían ni se devuelven.
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

app.use((req, res, next) => {
  if (req.path !== '/api' && !req.path.startsWith('/api/')) {
    return next();
  }

  const headers: Record<string, string | string[] | undefined> = {};
  for (const [name, value] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP.has(name.toLowerCase())) headers[name] = value;
  }
  headers['host'] = backendUrl.host;

  const target = new URL(req.originalUrl, backendUrl);
  const onResponse = (upstreamRes: IncomingMessage) => {
    const responseHeaders: Record<string, string | string[] | undefined> = {};
    for (const [name, value] of Object.entries(upstreamRes.headers)) {
      if (!HOP_BY_HOP.has(name.toLowerCase())) responseHeaders[name] = value;
    }
    res.writeHead(upstreamRes.statusCode ?? 502, responseHeaders);
    upstreamRes.pipe(res);
  };
  const requestOptions = { method: req.method, headers };

  const upstream =
    backendUrl.protocol === 'https:'
      ? httpsRequest(target, requestOptions, onResponse)
      : httpRequest(target, requestOptions, onResponse);

  upstream.on('error', () => {
    if (res.headersSent) {
      res.end();
      return;
    }
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ statusCode: 502, message: 'Backend no disponible' }));
  });

  req.pipe(upstream);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
