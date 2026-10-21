// Every text the app shows. es.ts has the same shape: TypeScript flags a missing key.
// Errors are codes; only the UI turns them into text.
export const en = {
  meta: {
    description: 'English vocabulary from your own readings.',
  },

  common: {
    save: 'Save',
    saving: 'Saving…',
    cancel: 'Cancel',
    close: 'Close',
    delete: 'Delete',
    back: 'Back',
    of: 'of',
    notNow: 'Not now',
    remove: 'Remove',
    recommended: 'recommended',
  },

  nav: {
    home: 'Today',
    practice: 'Practice',
    material: 'Material',
    progress: 'Progress',
    settings: 'Settings',
  },

  expressions: {
    types: {
      'phrasal-verb': 'Phrasal verb',
      idiom: 'Idiom',
      collocation: 'Collocation',
      expression: 'Expression',
    },
    mastery: {
      new: 'New',
      learning: 'Learning',
      mastered: 'Mastered',
    },
    count: (n: number) => (n === 1 ? '1 expression' : `${n} expressions`),
  },

  home: {
    greeting: 'Ready to level up?',
    streak: (n: number) => (n === 1 ? '1 day streak' : `${n} day streak`),
    toLearn: (n: number) =>
      n === 1 ? '1 expression to learn' : `${n} expressions to learn`,
    allDone: 'You are all caught up.',
    cta: 'Practice now',
    recent: 'Recent material',
    seeAll: 'See all',
    recentEmpty: 'Add a text to find expressions in it.',
    addText: 'Add text',
    progress: 'Your progress',
  },

  material: {
    title: 'Material',
    subtitle: 'Your texts and the expressions inside them.',
    empty: 'No texts yet.',
    emptyHint: 'Paste a reading or a meeting transcript to start.',
    addText: 'Add text',
    open: (title: string) => `Open ${title}`,
    all: 'All material',
    loading: 'Looking for expressions…',
    retry: 'Try again',
    learning: (n: number) =>
      n === 1 ? '1 expression to practice' : `${n} expressions to practice`,
    practice: 'Practice these',
  },

  swipe: {
    step: (i: number, total: number) => `${i} of ${total}`,
    known: 'I know it',
    learn: 'Learn it',
    skip: 'Skip',
    keys: '← know · → learn · ↑ skip',
    learnNow: (n: number) =>
      n === 1 ? 'Learn the 1 I picked' : `Learn the ${n} I picked`,
    keepSwiping: (n: number) =>
      n === 1 ? 'Keep swiping (1 left)' : `Keep swiping (${n} left)`,
    done: 'You went through every expression in this text.',
    nothingNew: 'No new expressions in this text.',
  },

  learn: {
    title: (n: number) =>
      n === 1 ? '1 expression to learn' : `${n} expressions to learn`,
    hint: 'Get the meaning, an example and exercises for each one.',
    withAi: 'Generate with my AI',
    generating: 'Writing your exercises…',
    orClaude: 'Or use Claude',
    claudeHint:
      'Copy the prompt, paste it in Claude, then paste its answer here.',
    firstOnly: (n: number) => `The prompt holds the first ${n}.`,
    copy: 'Copy prompt',
    copied: 'Copied',
    pastePlaceholder: 'Paste Claude’s answer here…',
    save: 'Save',
    saved: (n: number) =>
      n === 1
        ? '1 expression ready to practice.'
        : `${n} expressions ready to practice.`,
  },

  practice: {
    title: 'Practice',
    building: 'Building your session…',
    nothing: 'Nothing to practice yet.',
    nothingHint: 'Open a text in Material and pick what you want to learn.',
    goMaterial: 'Go to Material',
    retry: 'Try again',
    step: (i: number, total: number) => `${i} of ${total}`,
    kinds: {
      'multiple-choice': 'What does it mean?',
      'fill-gap': 'Fill the gap',
      context: 'Which one fits?',
      match: 'Match the pairs',
    },
    typeHere: 'Type the expression',
    check: 'Check',
    next: 'Next',
    alreadyKnow: 'I already know this',
    finish: 'Finish',
    correct: 'Correct!',
    wrong: 'Not quite',
    answerWas: (answer: string) => `Answer: ${answer}`,
    pickMeaning: 'Pick a phrase, then its meaning.',
    quit: 'Quit',
    doneTitle: 'Session complete',
    score: (correct: number, total: number) => `${correct} of ${total} correct`,
    streak: (n: number) => (n === 1 ? '1 day streak' : `${n} day streak`),
    again: 'Practice again',
    backHome: 'Back to Today',
  },

  progress: {
    title: 'Progress',
    subtitle: 'Every expression, by how well you know it.',
    empty: 'No expressions yet.',
    emptyHint: 'They show up here as you add texts.',
  },

  add: {
    title: 'Add a text',
    subtitle: 'Paste it, or import a .txt file.',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. Team sync — March 3',
    textLabel: 'Text',
    textPlaceholder: 'Paste your reading or transcript here…',
    import: 'Import .txt',
    save: 'Save and extract',
    saving: 'Extracting…',
  },

  settings: {
    title: 'Settings',
    subtitle: 'Your data lives only on this computer.',
    language: 'Language',
    languages: { en: 'English', es: 'Español' },
    ai: 'AI',
    about: 'About Lexio',
    version: 'Version',
    dataFile: 'Data file',
    danger: 'Danger zone',
    deleteAll: 'Delete all texts',
    deleteAllHint: 'Removes every text and its terms. This cannot be undone.',
    deleteAllConfirm: 'Delete everything?',
    deleteAllMessage:
      'All your texts and words get deleted from this computer.',
    deleteAllOk: 'Delete everything',
  },

  ai: {
    hint: 'The AI that turns your words into exercises.',
    none: 'No AI set up yet.',
    localModel: 'On this computer',
    setUp: 'Set up AI',
    change: 'Change AI',
  },

  aiSetup: {
    eyebrow: 'AI',
    title: 'Choose an AI',
    aiType: 'Type of AI',
    local: 'On this computer',
    online: 'Online service',
    privateTitle: 'Private.',
    privateText: 'Runs on your computer. Nothing leaves it.',
    provider: 'Provider',
    model: 'Model',
    keyLabel: 'API key',
    keyPlaceholder: 'Paste your key',
    keyWhere: (url: string) => `Get a key at ${url}`,
    keySafe: 'Your key is safe:',
    keychain: 'Stored in your system keychain, never in the app.',
    onlyFor: (name: string) => `Only sent to ${name}.`,
    testing: 'Testing…',
    testAndSave: 'Test and save',
    downloadAndUse: 'Download and use',
    downloading: 'Downloading…',
    downloaded: 'Downloaded',
    available: 'Already on this computer',
    reuse: 'Use without downloading',
    importing: 'Importing…',
    useThis: 'Use this',
    replaces: (name: string) => `Replaces ${name}.`,
  },

  update: {
    check: 'Check for updates',
    checking: 'Checking…',
    upToDate: "You're up to date.",
    failed: "Couldn't update. Try again.",
    available: (version: string) => `A new version is out (${version}).`,
    updating: 'Updating…',
    update: 'Update',
  },

  errors: {
    generic: 'Something went wrong. Try again.',
    invalidData: 'Invalid data',
    titleRequired: 'Give the text a title',
    textRequired: 'Paste some text first',
    textTooLong: 'That text is too long. The limit is {max} characters.',
    noExpressions: "Couldn't find any expressions in that text",
    badJson: "That doesn't look like JSON. Copy Claude's whole answer.",
    nothingValid: 'None of those expressions were usable. Try again.',
    copyFailed: "Couldn't copy the prompt",
    noAi: 'Set up an AI first',
    textNotFound: 'Text not found',
    fileReadFailed: "Couldn't read that file",
    offline: "Couldn't reach {provider}. Check your connection.",
    badResponse: '{provider} sent back something unexpected.',
    keyRejected: '{provider} rejected the key.',
    modelNotFound: "{provider} doesn't have that model.",
    rateLimited: '{provider} is rate limiting. Try again later.',
    providerFailed: '{provider} failed ({status}). Try again.',
    unknownProvider: 'Unknown provider',
    emptyKey: 'Paste your API key first',
    keychainFailed: "Couldn't reach the system keychain",
    keyMissing: '{provider} has no key saved. Add it in Settings.',
    refused: 'The AI refused to answer. Try again.',
    invalidModel: 'The AI sent back something unexpected.',
    tooLong: 'That text is too long for the AI on this computer.',
    localModelMissing:
      'The AI model is not on this computer. Set it up in Settings.',
    localModelBroken: "Couldn't open the AI model. Download it again.",
    localModelFailed: 'The AI on this computer failed. Try again.',
    localModelBusy: 'The AI on this computer is busy. Try again in a moment.',
    downloadFailed: "Couldn't download the model. Try again.",
    diskFull: 'Not enough space on disk',
    downloadCorrupt: 'The download was corrupt. Try again.',
    modelSaveFailed: "Couldn't save the model",
    modelDeleteFailed: "Couldn't delete the model",
    unknownModel: 'Unknown model',
    appFolderMissing: "Couldn't find the app folder",
  },
}

export type Messages = typeof en
export type ErrorCode = keyof Messages['errors']
