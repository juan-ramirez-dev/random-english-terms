import {
  deleteAllTexts as dbDeleteAllTexts,
  deleteText as dbDeleteText,
  getText,
  insertText,
  listTextSummaries,
} from '@/lib/local-db/texts'
import { countWords, findPhrases } from '@/lib/terms/match'
import type { TextRecord, TextSummary } from '@/lib/terms/types'
import { ApiClientError } from './http'

const TITLE_MAX = 120
// Long enough for a meeting transcript; the AI never reads the whole text.
export const TEXT_MAX = 12_000

// A text with no built-in phrase in it has nothing to swipe: it isn't saved.
export async function addText(input: {
  title: string
  content: string
}): Promise<string> {
  const title = input.title.trim().slice(0, TITLE_MAX)
  const content = input.content.trim()
  if (!title) throw new ApiClientError(422, 'titleRequired')
  if (!content) throw new ApiClientError(422, 'textRequired')
  if (content.length > TEXT_MAX) {
    throw new ApiClientError(422, 'textTooLong', { max: TEXT_MAX })
  }

  if (findPhrases(content).length === 0) {
    throw new ApiClientError(422, 'noExpressions')
  }

  const id = crypto.randomUUID()
  await insertText({ id, title, content, wordCount: countWords(content) })
  return id
}

export const listTexts = (): Promise<TextSummary[]> => listTextSummaries()

export async function readText(id: string): Promise<TextRecord> {
  const text = await getText(id)
  if (!text) throw new ApiClientError(404, 'textNotFound')
  return text
}

export async function deleteText(id: string): Promise<void> {
  const affected = await dbDeleteText(id)
  if (affected === 0) throw new ApiClientError(404, 'textNotFound')
}

export const deleteAllTexts = (): Promise<void> => dbDeleteAllTexts()
