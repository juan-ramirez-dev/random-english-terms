import { en, type ErrorCode, type Messages } from '@/lib/i18n/en'

// Errors carry a code, not text: the UI turns them into the user's language.

export type ErrorParams = Record<string, string | number>

export interface AppError {
  code: ErrorCode
  params?: ErrorParams
}

export class ApiClientError extends Error implements AppError {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    readonly params: ErrorParams = {},
  ) {
    super(code)
  }
}

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && Object.hasOwn(en.errors, value)
}

const fill = (template: string, params: ErrorParams) =>
  template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  )

export function errorText(
  t: Messages,
  { code, params = {} }: AppError,
): string {
  return fill(t.errors[code], params)
}

export function errorMessage(error: unknown, t: Messages): string {
  return error instanceof ApiClientError
    ? errorText(t, error)
    : t.errors.generic
}
