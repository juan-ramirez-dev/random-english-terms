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
  },

  nav: {
    library: 'Library',
    study: 'Study',
    words: 'Words',
    settings: 'Settings',
  },

  library: {
    title: 'Library',
    subtitle: 'Your readings and transcripts.',
    empty: 'No texts yet.',
    emptyHint: 'Paste a reading or a meeting transcript to start.',
    addText: 'Add text',
    terms: (n: number) => (n === 1 ? '1 term' : `${n} terms`),
    toReview: (n: number) => `${n} to review`,
    allReviewed: 'All reviewed',
    review: 'Review',
    open: (title: string) => `Open ${title}`,
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

  study: {
    title: 'Study',
    pickFirst: 'Pick a text from the library first.',
    goToLibrary: 'Go to the library',
    progress: (i: number, total: number) => `${i} of ${total}`,
    known: 'I know this',
    learn: 'Want to learn',
    skip: 'Skip',
    hintKnow: '← Know',
    hintLearn: 'Learn →',
    hintSkip: '↑ / Space to skip',
    noTerms: 'No terms to review in this text.',
    doneTitle: 'Done for now',
    doneSummary: (known: number, learning: number) =>
      `${known} known · ${learning} to learn`,
    reviewAgain: 'Review again',
    backToLibrary: 'Back to the library',
  },

  words: {
    title: 'Words',
    subtitle: 'Across all your texts.',
    learning: 'Learning',
    known: 'Known',
    learningEmpty: 'Nothing to learn yet. Mark words with → while you study.',
    knownEmpty: 'No known words yet. Mark words with ← while you study.',
    from: (title: string) => `from ${title}`,
  },

  settings: {
    title: 'Settings',
    subtitle: 'Your data lives only on this computer.',
    language: 'Language',
    languages: { en: 'English', es: 'Español' },
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

  errors: {
    generic: 'Something went wrong. Try again.',
    invalidData: 'Invalid data',
    titleRequired: 'Give the text a title',
    textRequired: 'Paste some text first',
    noWords: "Couldn't find any words in that text",
    textNotFound: 'Text not found',
    termNotFound: 'Term not found',
    fileReadFailed: "Couldn't read that file",
  },
}

export type Messages = typeof en
export type ErrorCode = keyof Messages['errors']
