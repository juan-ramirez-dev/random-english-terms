import { buildSession, grade } from './build-session'
import type { Exercise, Expression } from './types'

const make = (id: string, mastery: Expression['mastery']): Expression => ({
  id,
  phrase: `phrase ${id}`,
  type: 'idiom',
  meaning: `meaning ${id}`,
  example: `We say phrase ${id} here.`,
  mastery,
})

const POOL = [
  make('a', 'new'),
  make('b', 'learning'),
  make('c', 'mastered'),
  make('d', 'new'),
  make('e', 'new'),
]

const find = (kind: Exercise['kind']): Exercise => {
  const exercise = buildSession(POOL, 1).exercises.find(e => e.kind === kind)
  if (!exercise) throw new Error(`no ${kind} in session`)
  return exercise
}

describe('buildSession', () => {
  it('leaves mastered expressions out', () => {
    const ids = buildSession(POOL, 1).exercises.map(e => e.expression.id)
    expect(ids).not.toContain('c')
    expect(ids).toHaveLength(4)
  })

  it('gives each pending expression one exercise in a stable order for a seed', () => {
    const first = buildSession(POOL, 7).exercises.map(e => e.id)
    const second = buildSession(POOL, 7).exercises.map(e => e.id)
    expect(second).toEqual(first)
    expect(new Set(first.map(id => id.split('-')[0])).size).toBe(first.length)
  })
})

describe('grade', () => {
  it('accepts a multiple-choice or context answer only when it equals the answer', () => {
    const mc = find('multiple-choice')
    const context = find('context')
    if (mc.kind !== 'multiple-choice' || context.kind !== 'context')
      throw new Error('wrong kind')
    expect(grade(mc, mc.answer)).toBe(true)
    expect(grade(mc, 'something else')).toBe(false)
    expect(grade(context, context.answer)).toBe(true)
    expect(grade(context, 'something else')).toBe(false)
  })

  it('accepts a fill-gap answer ignoring case and extra spaces', () => {
    const gap = find('fill-gap')
    if (gap.kind !== 'fill-gap') throw new Error('wrong kind')
    expect(
      grade(gap, `  ${gap.answer.toUpperCase().replace(' ', '   ')} `),
    ).toBe(true)
    expect(grade(gap, 'nope')).toBe(false)
  })

  it('accepts a match only when every pair is right', () => {
    const match = find('match')
    if (match.kind !== 'match') throw new Error('wrong kind')
    const right = Object.fromEntries(
      match.pairs.map(p => [p.phrase, p.meaning]),
    )
    const wrong = { ...right, [match.pairs[0].phrase]: match.pairs[1].meaning }
    expect(grade(match, right)).toBe(true)
    expect(grade(match, wrong)).toBe(false)
  })
})
