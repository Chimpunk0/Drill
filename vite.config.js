import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, relative, resolve, sep } from "node:path";
import { defineConfig } from "vite";

const rootDir = resolve(".");
const quizSetsDir = resolve(
  process.env.QUIZ_SETS_DIR ||
    "/Users/simonpollak/Documents/Projects/drill_content/quiz_sets",
);

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
  return JSON.stringify(readJson(join(quizSetsDir, "index.json")), null, 2);
}

function serveFile(res, filePath) {
  res.statusCode = 200;
  res.setHeader("Content-Type", contentTypeFor(filePath));
  createReadStream(filePath).pipe(res);
}

export default defineConfig({
  server: {
    fs: {
      allow: [rootDir, quizSetsDir],
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

          const externalPath = join(quizSetsDir, relativePath);
          if (
            existsSync(externalPath) &&
            isInside(quizSetsDir, externalPath) &&
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
