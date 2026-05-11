# Quiz Test

Static web app for practicing exam material with quizzes, flashcards, saved answers, and wrong-answer practice.

## What This App Is

This project is best described as a **static web app**:

- It is a web app because users interact with quizzes, flashcards, filters, progress, and saved answers.
- It is static because it does not need a backend server or database to run.
- Python scripts are used as local import/build tools for quiz content, not as the production server.

## Local Development

Install dependencies once:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build the static production files:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Validate quiz fragments:

```bash
npm run validate
```

## Project Structure

- `index.html` contains the current app shell.
- `src/app.js` contains the current quiz runtime.
- `src/config/quizSets.js` registers available quiz sets.
- `src/styles/style.css` contains the current visual styles.
- `quiz_sets/` contains generated static quiz files.
- `context/` contains source/import examples and templates.
- Python scripts in the root import, generate, embed, and validate quiz content.

The current app runtime is still loaded as classic browser scripts for compatibility. Future refactors can split `src/app.js` into modules under `src/quiz/`, `src/flashcards/`, `src/ui/`, and `src/storage/`.

## Hosting

The app can be hosted as static files. After `npm run build`, deploy the contents of `dist/` to a static host such as GitHub Pages, Cloudflare Pages, Netlify, or Vercel.
