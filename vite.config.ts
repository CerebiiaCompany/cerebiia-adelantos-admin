// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath } from "node:url";

// Cabeceras de seguridad (hallazgo ADL-001 del informe de seguridad). TanStack Start
// inyecta scripts inline para la hidratación del SSR, de ahí 'unsafe-inline' en
// script-src; aun así no se permite ningún script de origen externo.
const SECURITY_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://api-adelantos.cerebiia.com.co wss://api-adelantos.cerebiia.com.co https://*.amazonaws.com",
    "img-src 'self' data: blob: https://api-adelantos.cerebiia.com.co https://*.amazonaws.com",
    "frame-src 'self' blob: https://api-adelantos.cerebiia.com.co https://*.amazonaws.com",
    "media-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()",
};

// Ruta propia en lugar de routeRules: el preset vercel de Nitro 3 (beta) emite las
// rutas de cabeceras sin `continue: true`, lo que detendría el ruteo hacia el SSR.
// Se declara aparte porque el tipo de `nitro` en @lovable.dev/vite-tanstack-config
// no incluye la opción `vercel`, aunque Nitro sí la recibe.
const nitro = {
  preset: "vercel",
  vercel: {
    config: {
      routes: [{ src: "/(.*)", headers: SECURITY_HEADERS, continue: true }],
    },
  },
};

export default defineConfig({
  nitro,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: [
        {
          find: /^xlsx-js-style$/,
          replacement: fileURLToPath(
            new URL("./node_modules/xlsx-js-style/dist/xlsx.bundle.js", import.meta.url),
          ),
        },
      ],
    },
    server: {
      proxy: {
        "/api/v1": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/media": {
          target: "http://localhost:8000",
          changeOrigin: true,
        },
        "/ws": {
          target: "http://localhost:8000",
          ws: true,
          changeOrigin: true,
        },
      },
    },
  },
});
