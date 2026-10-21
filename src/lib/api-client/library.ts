import {
  deleteAllTexts as dbDeleteAllTexts,
  deleteText as dbDeleteText,
  getText,
  insertText,
  listTextSummaries,
} from '@/lib/local-db/texts'
import {
  insertTerms,
  listTerms,
  listTermsByStatus,
  setTermStatus,
} from '@/lib/local-db/terms'
import { countWords, extractTerms } from '@/lib/terms/extract'
import type {
  Term,
  TermStatus,
  TermWithText,
  TextRecord,
  TextSummary,
} from '@/lib/terms/types'
import { ApiClientError } from './http'

const TITLE_MAX = 120
// Fits the local model's context with room for the prompt and the answer.
export const TEXT_MAX = 12_000

// Create a text and the review terms pulled from it. v1: single words.
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

  const candidates = extractTerms(content)
  if (candidates.length === 0) throw new ApiClientError(422, 'noWords')

  const id = crypto.randomUUID()
  await insertText({ id, title, content, wordCount: countWords(content) })
  await insertTerms(id, candidates)
  return id
}

export const listTexts = (): Promise<TextSummary[]> => listTextSummaries()

export async function readText(id: string): Promise<TextRecord> {
  const text = await getText(id)
  if (!text) throw new ApiClientError(404, 'textNotFound')
  return text
}

export const getTerms = (textId: string): Promise<Term[]> => listTerms(textId)

export const listWords = (status: TermStatus): Promise<TermWithText[]> =>
  listTermsByStatus(status)

export async function decideTerm(
  id: string,
  status: TermStatus,
): Promise<void> {
  const affected = await setTermStatus(id, status)
  if (affected === 0) throw new ApiClientError(404, 'termNotFound')
}

export async function deleteText(id: string): Promise<void> {
  const affected = await dbDeleteText(id)
  if (affected === 0) throw new ApiClientError(404, 'textNotFound')
}

export const deleteAllTexts = (): Promise<void> => dbDeleteAllTexts()
