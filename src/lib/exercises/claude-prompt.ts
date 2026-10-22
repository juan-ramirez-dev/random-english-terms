import type { PendingPhrase } from './types'

// The prompt the user pastes into Claude. Built here, not in Rust, so "Copy" writes
// to the clipboard inside the click: the webview refuses it after an await.
// Keep the rules and schema in sync with src-tauri/src/ai/prompt.rs.

// One paste stays a reasonable size for Claude's answer.
export const CLAUDE_MAX = 15

const RULES = `You help a person learn English expressions they picked from their own readings and meetings.

You get a list of expressions. Each one has its "phrase" (base form), its "type" and the "sentence" where the person saw it. An empty "sentence" means they didn't see it anywhere: use its most common meaning.

Before any exercise, the person reads a short lesson. For EACH expression, return:
- "phrase": copied exactly as given.
- "meaning": one short line in simple English, the meaning it has in that sentence. Don't use the phrase itself in it.
- "usage": one or two short lines on when to use it: the situation, and if it's formal, casual or neutral.
- "translation": the closest natural way to say it in Spanish.
- "examples": exactly 3 new, short, natural sentences that use the phrase, each in a different situation.
- "dialog": a short dialog of 3 or 4 lines that uses the phrase once. Each line starts with "A: " or "B: ".
- "exercises": exactly 4, one of each kind below. Always fill all four fields; a field the kind doesn't use is "" or [].

1. "multiple-choice": the person sees the phrase and picks its meaning.
   - "options": 3 meanings. One is "meaning" copied exactly; the other two are wrong but believable.
   - "answer": "meaning" copied exactly.
   - "sentence": "".
   Example for "look forward to": {"kind":"multiple-choice","sentence":"","options":["to be happy about something that will happen","to look at something behind you","to tell a secret"],"answer":"to be happy about something that will happen"}

2. "fill-gap": the person types the missing phrase.
   - "sentence": a NEW sentence where the phrase fits exactly as given (base form), replaced by ___ (three underscores, once).
   - "answer": the phrase exactly as given.
   - "options": [].
   Example: {"kind":"fill-gap","sentence":"We really ___ the holidays every year.","options":[],"answer":"look forward to"}

3. "context": the person picks the phrase that fits a sentence.
   - "sentence": a NEW sentence with ___ where the phrase goes, in base form. Only that phrase must fit.
   - "options": 3 phrases. One is the phrase; the other two are other real English expressions that clearly don't fit.
   - "answer": the phrase exactly as given.
   Example: {"kind":"context","sentence":"Please don't ___ about the surprise party.","options":["spill the beans","look forward to","break the ice"],"answer":"spill the beans"}

4. "usage": the person picks the sentence that uses the phrase correctly.
   - "options": 3 NEW sentences that all contain the phrase. Only one uses it with the right meaning; the other two use it in a situation where it makes no sense.
   - "answer": the right sentence copied exactly.
   - "sentence": "".
   Example: {"kind":"usage","sentence":"","options":["I look forward to seeing you next week.","I look forward to yesterday's meeting.","She looked forward to the floor."],"answer":"I look forward to seeing you next week."}

Rules:
- Return one entry per expression you got, in the same order. Never add others.
- Simple English. One idea per sentence.
- The sentence must make the right answer clear and the wrong ones clearly wrong.`

const strings = { type: 'array', items: { type: 'string' } }

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['expressions'],
  properties: {
    expressions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'phrase',
          'meaning',
          'usage',
          'translation',
          'examples',
          'dialog',
          'exercises',
        ],
        properties: {
          phrase: { type: 'string' },
          meaning: { type: 'string' },
          usage: { type: 'string' },
          translation: { type: 'string' },
          examples: strings,
          dialog: strings,
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['kind', 'sentence', 'options', 'answer'],
              properties: {
                kind: {
                  type: 'string',
                  enum: ['multiple-choice', 'fill-gap', 'context', 'usage'],
                },
                sentence: { type: 'string' },
                options: strings,
                answer: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
}

// The first CLAUDE_MAX pending phrases.
export function claudePrompt(pending: readonly PendingPhrase[]): string {
  const expressions = pending
    .slice(0, CLAUDE_MAX)
    .map(({ phrase, type, sentence }) => ({ phrase, type, sentence }))
  return [
    RULES,
    `Answer with JSON only, no other text. It must follow this JSON schema:\n${JSON.stringify(SCHEMA, null, 2)}`,
    `The expressions:\n${JSON.stringify({ expressions })}`,
  ].join('\n\n')
}
