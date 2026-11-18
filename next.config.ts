import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a new build go to a separate folder while the running server keeps
  // serving the old one (NEXT_DIST_DIR=.next-xyz next build / next start).
  // Unset (e.g. on Vercel) it is the normal .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: false,
  transpilePackages: ["@manycore/aholo-viewer"],
  serverExternalPackages: [
    "@manycore/aholo-sdk-lux3d",
    "@manycore/aholo-sdk-world",
    "@manycore/aholo-sdk-asset",
    "@manycore/aholo-sdk-core",
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Preview builds only (NEXT_SKIP_TYPECHECK=1): lets several people build
  // while other files are mid-edit. Release builds always type-check.
  typescript: {
    ignoreBuildErrors: process.env.NEXT_SKIP_TYPECHECK === "1",
  },
  webpack: (config, { isServer }) => {
    // Next.js forces `module.parser.javascript.url = 'relative'`, which turns
    // aholo-viewer's `new URL("./splat-worker.js", import.meta.url)` into a
    // root-relative path. The viewer then does `import "<path>"` inside a blob:
    // module worker, where root-relative specifiers cannot resolve, so the
    // splat / sort / KTX2 workers die on startup and every splat load hangs.
    // Absolute URLs (`url: true`) fix it on the client.
    if (!isServer) {
      config.module.parser = {
        ...config.module.parser,
        javascript: { ...config.module.parser?.javascript, url: true },
      };
    }
    return config;
  },
};

export default nextConfig;
