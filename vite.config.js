import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, relative, resolve, sep } from "node:path";
import { defineConfig, loadEnv } from "vite";

const rootDir = resolve(".");

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

function getQuizSetsDir(mode) {
  const env = loadEnv(mode, rootDir, "");
  const value = process.env.QUIZ_SETS_DIR || env.QUIZ_SETS_DIR;
  if (!value) {
    throw new Error(
      "QUIZ_SETS_DIR is not set. Create .env from .env.example or run with QUIZ_SETS_DIR=/path/to/quiz_sets.",
    );
  }
  return resolve(value);
}

function buildQuizManifest(quizSetsDir) {
  return JSON.stringify(readJson(join(quizSetsDir, "index.json")), null, 2);
}

function serveFile(res, filePath) {
  res.statusCode = 200;
  res.setHeader("Content-Type", contentTypeFor(filePath));
  createReadStream(filePath).pipe(res);
}

export default defineConfig(({ mode }) => {
  const quizSetsDir = getQuizSetsDir(mode);

  return {
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
              res.end(buildQuizManifest(quizSetsDir));
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
  };
});
