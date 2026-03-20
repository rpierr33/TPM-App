import { execSync } from "child_process";
import { mkdirSync, writeFileSync, cpSync, existsSync } from "fs";

// Step 1: Build frontend with Vite
console.log("Building frontend...");
execSync("npx vite build", { stdio: "inherit" });

// Step 2: Bundle the API serverless function with esbuild
console.log("Bundling API serverless function...");
execSync(
  "npx esbuild api/index.ts --bundle --platform=node --packages=external --format=esm --outfile=.vercel/output/functions/api.func/index.mjs",
  { stdio: "inherit" }
);

// Step 3: Write Vercel Build Output config
console.log("Writing Vercel build output config...");

// Function config
writeFileSync(
  ".vercel/output/functions/api.func/.vc-config.json",
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      maxDuration: 60,
    },
    null,
    2
  )
);

// Copy static frontend output
mkdirSync(".vercel/output/static", { recursive: true });
cpSync("dist/public", ".vercel/output/static", { recursive: true });

// Global config with rewrites
writeFileSync(
  ".vercel/output/config.json",
  JSON.stringify(
    {
      version: 3,
      routes: [
        { src: "/api/(.*)", dest: "/api" },
        { handle: "filesystem" },
        { src: "/(.*)", dest: "/index.html" },
      ],
    },
    null,
    2
  )
);

console.log("Build complete!");
