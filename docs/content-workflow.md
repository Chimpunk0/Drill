# Content Workflow

Quiz content is intentionally separate from the web app code. The web app knows
how to load and render quizzes, while the content repository owns the actual
quiz sets, images, and runtime manifest.

## Source Of Truth

The quiz content directory is configured with `QUIZ_SETS_DIR`.

Create a private local `.env` file from the committed template:

```bash
cp .env.example .env
```

Then edit `.env`:

```bash
QUIZ_SETS_DIR=/absolute/path/to/drill_content/quiz_sets
```

This directory is the single runtime source for quiz content during local
development, validation, and production builds. `.env` is ignored by git because
it contains machine-specific local paths.

The app serves this content at:

```text
/quiz_sets/...
```

For example, this content file:

```text
${QUIZ_SETS_DIR}/bpc-vba-2026/default.json
```

is loaded by the app as:

```text
quiz_sets/bpc-vba-2026/default.json
```

## Temporary Source Override

Use `QUIZ_SETS_DIR` when testing a different content checkout:

```bash
QUIZ_SETS_DIR=/path/to/other/quiz_sets npm run dev
QUIZ_SETS_DIR=/path/to/other/quiz_sets npm run validate
QUIZ_SETS_DIR=/path/to/other/quiz_sets npm run build
```

The override must point at the `quiz_sets` directory itself, not at the parent
repository.

## Manifest

Every available quiz set must be registered in:

```text
${QUIZ_SETS_DIR}/index.json
```

Each manifest entry should include:

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

Field meanings:

- `id`: stable app identifier used in URLs and browser storage.
- `label`: human-readable name shown in the quiz selector.
- `dataUrl`: path to the quiz JSON, relative to `index.json`.
- `source`: where the quiz file lives in GitHub for PR/export workflows.
- `source.path`: repo-relative path, including the leading `quiz_sets/`.

## Adding A Quiz Set

1. Create a directory under the content source:

```text
${QUIZ_SETS_DIR}/my-course
```

2. Add the quiz JSON:

```text
${QUIZ_SETS_DIR}/my-course/default.json
```

3. Put images beside the quiz set when possible:

```text
${QUIZ_SETS_DIR}/my-course/img/example.png
```

4. Reference images from the quiz JSON using paths relative to the quiz JSON
directory:

```json
{
  "image": "img/example.png",
  "imageAlt": "Example diagram"
}
```

5. Register the set in `index.json`:

```json
{
  "id": "my-course/default",
  "label": "My Course",
  "dataUrl": "my-course/default.json",
  "source": {
    "type": "github",
    "owner": "Chimpunk0",
    "repo": "drill_content",
    "branch": "main",
    "path": "quiz_sets/my-course/default.json"
  }
}
```

6. Validate:

```bash
npm run validate
```

7. Start the app and open the set:

```bash
npm run dev
```

Then use:

```text
http://localhost:5173/?set=my-course/default
```

## Moving The Edge-Case Quiz

The app no longer overlays an edge-case quiz from the app repository. If the
edge-case quiz should be available at runtime or included in validation, keep it
in the content source:

```text
${QUIZ_SETS_DIR}/testing/edge-cases.json
```

The manifest entry should be:

```json
{
  "id": "testing/edge-cases",
  "label": "Testing - Edge Cases",
  "dataUrl": "testing/edge-cases.json",
  "source": {
    "type": "github",
    "owner": "Chimpunk0",
    "repo": "drill_content",
    "branch": "main",
    "path": "quiz_sets/testing/edge-cases.json"
  }
}
```

After moving it, run:

```bash
npm run validate
```

## Editing Content In The Web App

The browser editor saves drafts only in local browser storage until exported.
It does not directly modify the content repository.

Current export options:

- `Download JSON`: downloads the edited quiz JSON.
- `PR bundle`: downloads a patch and instructions, then opens GitHub's file
  editor for the manifest-provided source path.

Future plan:

- The web app detects an optional local desktop/helper client.
- The helper handles GitHub auth and creates branches, commits, pushes, and PRs.
- The browser sends a quiz-set ID and edited quiz data.
- The helper maps the quiz-set ID to the manifest source path.

## Validation And Build

Validate all registered quiz sets from the configured content source:

```bash
npm run validate
```

Build the static app and copy the configured content source into `dist/`:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Git Repositories

There are two repositories involved:

- App repository: web app code, tools, UI, documentation.
- Content repository: quiz JSON, images, and `quiz_sets/index.json`.

When changing quiz content, commit in the content repository. When changing app
logic or docs, commit in the app repository.
