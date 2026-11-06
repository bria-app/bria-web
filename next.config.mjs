/**
 * Security headers (audit M-13).
 *
 * The CSP is built from NEXT_PUBLIC_API_BASE_URL (same fallback as `src/services/api/client.ts`),
 * so the browser may only talk to this site and to the API. Notes on what it allows:
 * - script-src 'unsafe-inline': the root layout ships an inline bootstrap script (theme
 *   before first paint) and Next.js injects inline hydration scripts; moving to nonces
 *   would need a middleware and dynamic rendering of every page.
 * - style-src 'unsafe-inline': React `style` props, Recharts and Next inject inline styles.
 * - Development only: 'unsafe-eval' (React Refresh) and ws: (HMR socket).
 * Fonts come from next/font (self-hosted at build time), so no third-party font origin.
 */
const isDev = process.env.NODE_ENV !== "production";

function apiOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin()}${isDev ? " ws: wss:" : ""}`.trim(),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
