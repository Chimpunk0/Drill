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
- `src/bootstrap.js` starts the app after the page loads.
- `src/state/` contains shared browser state bindings.
- `src/storage/` contains localStorage and progress persistence behavior.
- `src/quiz/` contains quiz loading, evaluation, filtering, and practice behavior.
- `src/flashcards/` contains flashcard queue, answer checking, and session restore behavior.
- `src/ui/` contains sidebar, theme, command palette, shortcuts, and layout behavior.
- `src/assets/` contains shared app images, icons, and visual theme assets.
- `src/config/quizSets.js` registers available quiz sets.
- `src/styles/style.css` contains the current visual styles.
- `quiz_sets/` contains generated static quiz files.
- `context/` contains source/import examples and templates.
- Python scripts in the root import, generate, embed, and validate quiz content.

The current app runtime is split into ordered classic browser scripts for compatibility. Future refactors can convert each area to ES module imports and exports.

## Hosting

The app can be hosted as static files. After `npm run build`, deploy the contents of `dist/` to a static host such as GitHub Pages, Cloudflare Pages, Netlify, or Vercel.
