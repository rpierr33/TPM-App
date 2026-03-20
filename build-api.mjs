import { execSync } from "child_process";
import { mkdirSync, writeFileSync, cpSync } from "fs";

// Step 1: Build frontend with Vite
console.log("Building frontend...");
execSync("npx vite build", { stdio: "inherit" });

// Step 2: Bundle the API serverless function with esbuild
// Keep all npm packages external — they'll be installed in the function dir
console.log("Bundling API serverless function...");
const funcDir = ".vercel/output/functions/api.func";
mkdirSync(funcDir, { recursive: true });
execSync(
  [
    "npx esbuild server/api-entry.ts",
    "--bundle",
    "--platform=node",
    "--format=cjs",
    `--outfile=${funcDir}/index.js`,
    "--external:bufferutil",
    "--external:utf-8-validate",
  ].join(" "),
  { stdio: "inherit" }
);

// Step 3: Write Vercel Build Output config
console.log("Writing Vercel build output config...");

writeFileSync(
  `${funcDir}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.js",
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
