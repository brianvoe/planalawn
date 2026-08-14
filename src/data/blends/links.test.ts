import { describe, expect, it } from 'vitest'
import curated from './curated.json'
import type { Blend } from '../../types'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function probe(url: string): Promise<number> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const head = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        signal: AbortSignal.timeout(15000),
      })
      if (head.status !== 405 && head.status !== 403 && head.status !== 0) return head.status
      const get = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        signal: AbortSignal.timeout(20000),
      })
      return get.status
    } catch {
      await sleep(400 * 2 ** attempt)
    }
  }
  return 0
}

const catalog = curated as Blend[]

describe('curated blend URLs', () => {
  it('strict product and company pages are not 404/410', async () => {
    const urls: { id: string; kind: string; url: string; mode: 'strict' | 'lenient' }[] = []
    catalog.forEach((blend) => {
      const mode = blend.urlCheck || 'strict'
      if (blend.url) urls.push({ id: blend.id, kind: 'url', url: blend.url, mode })
      if (blend.companyUrl) urls.push({ id: blend.id, kind: 'companyUrl', url: blend.companyUrl, mode })
    })

    const failures: string[] = []
    for (const row of urls) {
      const status = await probe(row.url)
      const dead = status === 404 || status === 410
      const unreachable = status === 0
      if (row.mode === 'lenient') continue
      if (dead || unreachable) {
        failures.push(`${row.id} ${row.kind} → ${status || 'no response'} ${row.url}`)
      }
    }
    expect(failures, failures.join('\n')).toEqual([])
  }, 180000)
})
