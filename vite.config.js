import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, relative, resolve, sep } from "node:path";
import { defineConfig } from "vite";

const rootDir = resolve(".");
const localQuizSetsDir = join(rootDir, "quiz_sets");
const externalQuizSetsDir = resolve(
  process.env.QUIZ_SETS_DIR ||
    "/Users/simonpollak/Documents/Projects/drill_content/quiz_sets",
);
const edgeCasesManifestEntry = {
  id: "testing/edge-cases",
  label: "Testing – Edge Cases",
  dataUrl: "testing/edge-cases.json",
};

function isInside(parent, child) {
  const rel = relative(parent, child);
  return rel && !rel.startsWith("..") && !rel.includes(`..${sep}`);
}

function contentTypeFor(filePath) {
  const types = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
  };
  return types[extname(filePath).toLowerCase()] || "application/octet-stream";
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function buildQuizManifest() {
  const manifestPath = join(externalQuizSetsDir, "index.json");
  const manifest = existsSync(manifestPath)
    ? readJson(manifestPath)
    : readJson(join(localQuizSetsDir, "index.json"));
  const sets = Array.isArray(manifest.sets) ? [...manifest.sets] : [];
  if (!sets.some((set) => set?.id === edgeCasesManifestEntry.id)) {
    sets.push(edgeCasesManifestEntry);
  }
  return JSON.stringify({ ...manifest, sets }, null, 2);
}

function serveFile(res, filePath) {
  res.statusCode = 200;
  res.setHeader("Content-Type", contentTypeFor(filePath));
  createReadStream(filePath).pipe(res);
}

export default defineConfig({
  server: {
    fs: {
      allow: [rootDir, externalQuizSetsDir],
    },
  },
  plugins: [
    {
      name: "external-quiz-sets",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith("/quiz_sets/")) {
            next();
            return;
          }

          const requestPath = decodeURIComponent(
            new URL(req.url, "http://localhost").pathname,
          );
          const relativePath = normalize(requestPath.replace(/^\/quiz_sets\//, ""));
          if (!relativePath || relativePath.startsWith("..")) {
            res.statusCode = 400;
            res.end("Invalid quiz asset path.");
            return;
          }

          if (relativePath === "index.json") {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
            res.end(buildQuizManifest());
            return;
          }

          const localOverride = join(localQuizSetsDir, relativePath);
          if (
            relativePath === "testing/edge-cases.json" &&
            existsSync(localOverride)
          ) {
            serveFile(res, localOverride);
            return;
          }

          const externalPath = join(externalQuizSetsDir, relativePath);
          if (
            existsSync(externalPath) &&
            isInside(externalQuizSetsDir, externalPath) &&
            statSync(externalPath).isFile()
          ) {
            serveFile(res, externalPath);
            return;
          }

          next();
        });
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
