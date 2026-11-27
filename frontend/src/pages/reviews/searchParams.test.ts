import { parseReviewSearch, writeReviewSearch } from './searchParams'

describe('review search params', () => {
  it('uses defaults for an empty URL', () => {
    expect(parseReviewSearch(new URLSearchParams())).toMatchObject({
      q: '', status: null, reportType: null, year: null, sort: 'updatedAt', dir: 'desc', page: 1,
    })
  })

  it('ignores values outside the allowed lists', () => {
    const s = parseReviewSearch(new URLSearchParams('status=HACKED&sort=password&page=-3&year=abc'))
    expect(s).toMatchObject({ status: null, sort: 'updatedAt', page: 1, year: null })
  })

  it('round-trips a full search and omits defaults', () => {
    const params = new URLSearchParams('q=acme&status=FAILED&reportType=SOC+2&year=2026&sort=vendorName&dir=asc&page=3')
    const out = writeReviewSearch(parseReviewSearch(params))
    expect(Object.fromEntries(out)).toEqual(Object.fromEntries(params))
    expect(writeReviewSearch(parseReviewSearch(new URLSearchParams())).toString()).toBe('')
  })
})
