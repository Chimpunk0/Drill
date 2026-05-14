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

Validate quiz JSON data:

```bash
npm run validate
```

## Quiz Content Source

By default, local development and production builds load quiz content from the
separate content repository:

```text
/Users/simonpollak/Documents/Projects/drill_content/quiz_sets
```

This is the single runtime quiz-set source. During development, Vite serves
`/quiz_sets/...` from that directory. During `npm run build`, the build script
copies that directory into `dist/quiz_sets`.

To use a different content checkout temporarily:

```bash
QUIZ_SETS_DIR=/path/to/other/quiz_sets npm run dev
QUIZ_SETS_DIR=/path/to/other/quiz_sets npm run build
QUIZ_SETS_DIR=/path/to/other/quiz_sets npm run validate
```

Each quiz-set manifest entry can include GitHub source metadata. The editor uses
this to target PR exports and future local-helper PR creation:

```json
{
  "id": "bpc-vba-2026/default",
  "label": "BPC-VBA 2026",
  "dataUrl": "bpc-vba-2026/default.json",
  "source": {
    "type": "github",
    "owner": "Chimpunk0",
    "repo": "drill_content",
    "branch": "main",
    "path": "quiz_sets/bpc-vba-2026/default.json"
  }
}
```

## Editing Quiz Sets and Making a PR

The app has a browser-only quiz editor. Open the app, click **editor** in the paper toolbar, edit the current quiz set, then use **Preview in app** to check the result.

Drafts are saved only in your browser until you export them. They do not change the Git repository automatically.

To propose your edits as a pull request:

1. Click **Save draft** in the editor.
2. Click **PR bundle**.
3. The app downloads:
   - a `.patch` file with the quiz JSON change,
   - a `.txt` file with PR instructions.
4. Create a new Git branch:

```bash
git switch -c quiz-content-edit
```

5. Apply the downloaded patch:

```bash
git apply /path/to/quiz-editor-your-set.patch
```

6. Validate and build:

```bash
npm run validate
npm run build
```

7. Commit and push:

```bash
git add quiz_sets
git commit -m "Update quiz content"
git push -u origin quiz-content-edit
```

8. Open GitHub and create a pull request from `quiz-content-edit`.

The editor also opens GitHub’s file editor for the active quiz JSON file. You can use that instead by replacing the file contents with the exported JSON, but the local patch workflow is safer for larger edits.

## Project Structure

- `index.html` contains the current app shell.
- `src/bootstrap.js` starts the app after the page loads.
- `src/state/` contains shared browser state bindings.
- `src/storage/` contains localStorage and progress persistence behavior.
- `src/quiz/` contains quiz loading, evaluation, filtering, and practice behavior.
- `src/flashcards/` contains flashcard queue, answer checking, and session restore behavior.
- `src/editor/` contains the browser-only quiz set editor and PR export helpers.
- `src/ui/` contains sidebar, theme, command palette, shortcuts, and layout behavior.
- `src/assets/` contains shared app images, icons, and visual theme assets.
- `src/config/quizSets.js` registers available quiz sets.
- `src/styles/style.css` contains the current visual styles.
- `quiz_sets/` contains generated static quiz JSON files and colocated quiz images.
- `context/` contains source/import examples and templates.
- Python scripts in the root import, generate, migrate, and validate quiz content.

Quiz content now uses structured JSON at runtime. YAML/Markdown remain the human-editable input formats, and the Python scripts generate the JSON files that the browser loads.

## Hosting

The app can be hosted as static files. After `npm run build`, deploy the contents of `dist/` to a static host such as GitHub Pages, Cloudflare Pages, Netlify, or Vercel.
