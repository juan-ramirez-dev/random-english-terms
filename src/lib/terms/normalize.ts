// The dedup key for a word: lowercase, straight apostrophes, no surrounding marks.
export function normalize(word: string): string {
  return word
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/^['-]+|['-]+$/g, '')
}
