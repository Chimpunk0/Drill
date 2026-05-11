// ─── Centralized application state ───────────────────────────────────────
const state = {
    explanations: {},
    saveIndicatorTimer: null,
    practiceMode: false,
    incorrectQuestionIds: [],
    sidebarVisible: window.innerWidth > 768,
    rightSidebarVisible: false,
    capturingShortcut: false,
    flashcards: {
        queue: [],
        index: 0,
        correct: 0,
        wrong: 0,
        answered: false,
        sessionInitialLength: 0,
        sectionIds: [],
    },
};

Object.defineProperties(window, {
    EXPLANATIONS: {
        get: () => state.explanations,
        set: (value) => (state.explanations = value),
    },
    saveIndicatorTimer: {
        get: () => state.saveIndicatorTimer,
        set: (value) => (state.saveIndicatorTimer = value),
    },
    practiceMode: {
        get: () => state.practiceMode,
        set: (value) => (state.practiceMode = value),
    },
    incorrectQuestionIds: {
        get: () => state.incorrectQuestionIds,
        set: (value) => (state.incorrectQuestionIds = value),
    },
    sidebarVisible: {
        get: () => state.sidebarVisible,
        set: (value) => (state.sidebarVisible = value),
    },
    rightSidebarVisible: {
        get: () => state.rightSidebarVisible,
        set: (value) => (state.rightSidebarVisible = value),
    },
    capturingShortcut: {
        get: () => state.capturingShortcut,
        set: (value) => (state.capturingShortcut = value),
    },
    fcQueue: {
        get: () => state.flashcards.queue,
        set: (value) => (state.flashcards.queue = value),
    },
    fcIndex: {
        get: () => state.flashcards.index,
        set: (value) => (state.flashcards.index = value),
    },
    fcCorrect: {
        get: () => state.flashcards.correct,
        set: (value) => (state.flashcards.correct = value),
    },
    fcWrong: {
        get: () => state.flashcards.wrong,
        set: (value) => (state.flashcards.wrong = value),
    },
    fcAnswered: {
        get: () => state.flashcards.answered,
        set: (value) => (state.flashcards.answered = value),
    },
    fcSessionInitialLength: {
        get: () => state.flashcards.sessionInitialLength,
        set: (value) => (state.flashcards.sessionInitialLength = value),
    },
    fcSectionIds: {
        get: () => state.flashcards.sectionIds,
        set: (value) => (state.flashcards.sectionIds = value),
    },
});

export { state };
