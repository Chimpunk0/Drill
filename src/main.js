// Vite entrypoint.
//
// The runtime currently loads as ordered classic browser scripts because it
// still relies on shared window globals. This file keeps Vite attached to the
// page and is the future place to import ES modules as the app is modernized.
import "./config/quizSets.js";
import "./state/state.js";
import "./storage/storage.js";
import "./quiz/practice.js";
import "./ui/ui.js";
import "./quiz/quiz.js";
import "./flashcards/flashcards.js";
import "./quiz/loadQuizContent.js";
import "./editor/quizEditor.js";
import "./bootstrap.js";
