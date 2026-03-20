import { execSync } from "child_process";
import { mkdirSync, writeFileSync, cpSync } from "fs";

// Step 1: Build frontend with Vite
console.log("Building frontend...");
execSync("npx vite build", { stdio: "inherit" });

// Step 2: Bundle the API serverless function with esbuild
// Keep SDK packages that break when bundled as external
console.log("Bundling API serverless function...");
execSync(
  [
    "npx esbuild server/api-entry.ts",
    "--bundle",
    "--platform=node",
    "--format=cjs",
    "--outfile=.vercel/output/functions/api.func/index.js",
    "--external:@anthropic-ai/sdk",
    "--external:openai",
    "--external:bufferutil",
    "--external:utf-8-validate",
  ].join(" "),
  { stdio: "inherit" }
);

// Step 3: Copy node_modules needed by external packages into the function dir
console.log("Copying external dependencies...");
const funcDir = ".vercel/output/functions/api.func";
const externals = ["@anthropic-ai/sdk", "openai"];
for (const pkg of externals) {
  try {
    cpSync(
      `node_modules/${pkg}`,
      `${funcDir}/node_modules/${pkg}`,
      { recursive: true }
    );
  } catch {
    console.warn(`Warning: Could not copy ${pkg}`);
  }
}
// Copy transitive deps that the SDKs need
const transitiveDeps = [
  "@anthropic-ai/sdk/node_modules",
  "agentkeepalive",
  "humanize-ms",
  "ms",
  "node-fetch",
  "form-data-encoder",
  "formdata-node",
];
for (const dep of transitiveDeps) {
  try {
    cpSync(
      `node_modules/${dep}`,
      `${funcDir}/node_modules/${dep}`,
      { recursive: true }
    );
  } catch {
    // Not all transitive deps exist — that's fine
  }
}

// Step 4: Write Vercel Build Output config
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
