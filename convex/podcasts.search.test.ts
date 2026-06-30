import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

// Load all Convex modules for the in-memory test backend.
const modules = import.meta.glob('./**/*.ts')

const DIM = 768

// A unit vector pointing along axis `i` in 768-d space. Distinct axes are
// orthogonal, so cosine similarity cleanly separates seeded podcasts and the
// nearest one to a query is fully determined by which axis the query points at.
function axisVector(i: number): number[] {
  const v = new Array<number>(DIM).fill(0)
  v[i] = 1
  return v
}

// Stub Gemini's embedContent HTTP endpoint so semanticSearch never hits the
// network (PRD Seam-1: the embedder is the injected boundary). The fake returns
// whatever query embedding the current test wants.
function stubEmbedder(queryVector: number[]) {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify({ embedding: { values: queryVector } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

type SeedPodcast = {
  title: string
  category: string
  embedding?: number[]
  listenerCount?: number
  status?: 'ready' | 'pending'
}

async function seed(t: ReturnType<typeof convexTest>, podcasts: SeedPodcast[]) {
  return t.run(async (ctx) => {
    const authorId = await ctx.db.insert('users', {
      clerkId: 'author_1',
      name: 'Test Author',
      email: 'author@test.dev',
    })
    const ids: Id<'podcasts'>[] = []
    for (const p of podcasts) {
      const id = await ctx.db.insert('podcasts', {
        title: p.title,
        description: `${p.title} description`,
        category: p.category,
        authorId,
        topicPrompt: 'topic',
        speaker1Voice: 'alloy',
        status: p.status ?? 'ready',
        listenerCount: p.listenerCount ?? 0,
        embedding: p.embedding,
      })
      ids.push(id)
    }
    return ids
  })
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key'
  // Neutralize the relevance cutoff by default so ranking/category/ready tests
  // see every seeded neighbor. The cutoff has its own dedicated test below.
  process.env.GEMINI_SEARCH_MIN_SCORE = '-1'
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('semanticSearch', () => {
  test('returns results ranked by embedding similarity', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [
      { title: 'Alpha', category: 'Technology', embedding: axisVector(0) },
      { title: 'Beta', category: 'Business', embedding: axisVector(1) },
      { title: 'Gamma', category: 'Science', embedding: axisVector(2) },
    ])

    // Query points mostly along axis 0 (Alpha), with a small lean toward axis 1
    // (Beta) so the expected order is Alpha, then Beta, then Gamma.
    const queryVector = axisVector(0)
    queryVector[1] = 0.4
    stubEmbedder(queryVector)

    const results = await t.action(api.podcasts.semanticSearch, { query: 'machines' })

    expect(results.map((r) => r.title)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  test('category filter narrows results to that category', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [
      { title: 'Alpha', category: 'Technology', embedding: axisVector(0) },
      { title: 'Beta', category: 'Business', embedding: axisVector(1) },
      { title: 'Gamma', category: 'Business', embedding: axisVector(2) },
    ])

    // Query is closest to Alpha (Technology) overall, but the category filter
    // restricts the vector search to Business, so Alpha must not appear.
    const queryVector = axisVector(0)
    stubEmbedder(queryVector)

    const results = await t.action(api.podcasts.semanticSearch, {
      query: 'business things',
      category: 'Business',
    })

    expect(results.length).toBe(2)
    expect(results.every((r) => r.category === 'Business')).toBe(true)
    expect(results.map((r) => r.title)).not.toContain('Alpha')
  })

  test('a no-match query (category with nothing in it) yields an empty result', async () => {
    const t = convexTest(schema, modules)
    // Index is non-empty (one Technology podcast), but the category filter points
    // at a category no indexed podcast belongs to, so the result is empty.
    await seed(t, [{ title: 'OnlyTech', category: 'Technology', embedding: axisVector(0) }])
    stubEmbedder(axisVector(0))

    const results = await t.action(api.podcasts.semanticSearch, {
      query: 'anything',
      category: 'Comedy',
    })
    expect(results).toEqual([])
  })

  test('only ready podcasts are returned', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [
      { title: 'ReadyOne', category: 'Technology', embedding: axisVector(0), status: 'ready' },
      { title: 'PendingOne', category: 'Technology', embedding: axisVector(1), status: 'pending' },
    ])
    // Query leans toward the pending one, but it must be filtered out.
    const queryVector = axisVector(1)
    stubEmbedder(queryVector)

    const results = await t.action(api.podcasts.semanticSearch, { query: 'x' })
    expect(results.map((r) => r.title)).toEqual(['ReadyOne'])
  })

  test('excludes off-topic matches below the relevance threshold', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [
      { title: 'OnTopic', category: 'Technology', embedding: axisVector(0) },
      { title: 'OffTopic', category: 'Technology', embedding: axisVector(1) },
    ])
    // Query points exactly at OnTopic (cosine 1.0); OffTopic is orthogonal
    // (cosine 0.0) and must be dropped by the cutoff — this is the "saas query
    // returned the Ozempic podcast" bug, in miniature.
    process.env.GEMINI_SEARCH_MIN_SCORE = '0.5'
    stubEmbedder(axisVector(0))

    const results = await t.action(api.podcasts.semanticSearch, { query: 'tech' })
    expect(results.map((r) => r.title)).toEqual(['OnTopic'])
  })
})

describe('searchPodcasts (keyword)', () => {
  test('matches podcasts by a literal title word', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [
      { title: 'The Startup Playbook', category: 'Business' },
      { title: 'Cooking Basics', category: 'Education' },
    ])

    // No embedder stub needed — this is a plain full-text query, no Gemini.
    const results = await t.query(api.podcasts.searchPodcasts, { query: 'startup' })
    expect(results.map((r) => r.title)).toEqual(['The Startup Playbook'])
  })

  test('respects the category filter', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [
      { title: 'Startup Stories', category: 'Business' },
      { title: 'Startup Science', category: 'Science' },
    ])

    const results = await t.query(api.podcasts.searchPodcasts, {
      query: 'startup',
      category: 'Business',
    })
    expect(results.map((r) => r.title)).toEqual(['Startup Stories'])
  })

  test('returns only ready podcasts', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [
      { title: 'Ready Startup', category: 'Business', status: 'ready' },
      { title: 'Pending Startup', category: 'Business', status: 'pending' },
    ])

    const results = await t.query(api.podcasts.searchPodcasts, { query: 'startup' })
    expect(results.map((r) => r.title)).toEqual(['Ready Startup'])
  })

  test('strips stop words before matching', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [{ title: 'Startup Playbook', category: 'Business' }])

    // "the startup" → "startup" after stop-word stripping, so it still matches.
    const results = await t.query(api.podcasts.searchPodcasts, { query: 'the startup' })
    expect(results.map((r) => r.title)).toEqual(['Startup Playbook'])
  })

  test('strips domain filler so cross-topic titles do not match', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [
      { title: 'Starting a Business 101', category: 'Business' },
      { title: 'A podcast about air india crash', category: 'News' },
    ])

    // "podcast about starting a business" → "starting business" after stripping
    // the filler "podcast"/"about"/"a". Without stripping, the crash episode would
    // match on the shared words "podcast"/"about"; with it, only the business one does.
    const results = await t.query(api.podcasts.searchPodcasts, {
      query: 'podcast about starting a business',
    })
    expect(results.map((r) => r.title)).toEqual(['Starting a Business 101'])
  })
})

describe('hybridSearch', () => {
  test('merges keyword and semantic results, deduping a doc matched by both', async () => {
    const t = convexTest(schema, modules)
    // "Startup Guide" matches BOTH the keyword "startup" and the query vector
    // (axis 0). It must appear exactly once.
    await seed(t, [
      { title: 'Startup Guide', category: 'Business', embedding: axisVector(0) },
    ])
    stubEmbedder(axisVector(0))

    const results = await t.action(api.podcasts.hybridSearch, { query: 'startup' })
    expect(results.map((r) => r.title)).toEqual(['Startup Guide'])
  })

  test('surfaces a keyword-only match and a semantic-only match', async () => {
    const t = convexTest(schema, modules)
    // KeywordOnly: title contains "startup" but its embedding is orthogonal to
    // the query (dropped by the semantic cutoff). SemanticOnly: title shares no
    // words with the query but its embedding points at the query vector.
    await seed(t, [
      { title: 'Startup Diaries', category: 'Business', embedding: axisVector(9) },
      { title: 'Founder Wisdom', category: 'Business', embedding: axisVector(0) },
    ])
    // Cutoff active so the orthogonal keyword match is excluded from the
    // SEMANTIC half (it still arrives via the keyword half).
    process.env.GEMINI_SEARCH_MIN_SCORE = '0.5'
    stubEmbedder(axisVector(0))

    const results = await t.action(api.podcasts.hybridSearch, { query: 'startup' })
    const titles = results.map((r) => r.title)
    // Keyword hits lead, then semantic-only.
    expect(titles[0]).toBe('Startup Diaries')
    expect(titles).toContain('Founder Wisdom')
    expect(titles.length).toBe(2)
  })

  test('respects the category filter on both halves', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [
      { title: 'Startup Business', category: 'Business', embedding: axisVector(0) },
      { title: 'Startup Tech', category: 'Technology', embedding: axisVector(0) },
    ])
    stubEmbedder(axisVector(0))

    const results = await t.action(api.podcasts.hybridSearch, {
      query: 'startup',
      category: 'Business',
    })
    expect(results.every((r) => r.category === 'Business')).toBe(true)
    expect(results.map((r) => r.title)).not.toContain('Startup Tech')
  })

  test('rejects once the global rate-limit bucket is drained', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [{ title: 'Startup', category: 'Business', embedding: axisVector(0) }])
    stubEmbedder(axisVector(0))

    let rejected = false
    for (let i = 0; i < 40; i++) {
      try {
        await t.action(api.podcasts.hybridSearch, { query: `startup ${i}` })
      } catch (err) {
        const msg = String((err as { data?: { code?: string } })?.data?.code ?? err)
        expect(msg.includes('RATE_LIMITED') || String(err).includes('RATE_LIMITED')).toBe(true)
        rejected = true
        break
      }
    }
    expect(rejected).toBe(true)
  })
})

describe('getSimilar', () => {
  test('returns vector-nearest podcasts and excludes the source itself', async () => {
    const t = convexTest(schema, modules)
    const [sourceId] = await seed(t, [
      { title: 'Source', category: 'Technology', embedding: axisVector(0) },
      { title: 'Near', category: 'Technology', embedding: axisVector(0).map((x, i) => (i === 1 ? 0.9 : x)) },
      { title: 'Far', category: 'Technology', embedding: axisVector(5) },
    ])

    // No fetch stub needed: getSimilar reuses the STORED embedding (no Gemini).
    const results = await t.action(api.podcasts.getSimilar, { podcastId: sourceId, limit: 4 })

    const titles = results.map((r) => r.title)
    expect(titles).not.toContain('Source')
    expect(titles[0]).toBe('Near')
  })

  test('falls back to popularity when the source has no embedding', async () => {
    const t = convexTest(schema, modules)
    const [sourceId] = await seed(t, [
      { title: 'Source', category: 'Technology' }, // no embedding
      { title: 'Popular', category: 'Technology', embedding: axisVector(1), listenerCount: 999 },
      { title: 'Quiet', category: 'Technology', embedding: axisVector(2), listenerCount: 1 },
    ])

    const results = await t.action(api.podcasts.getSimilar, { podcastId: sourceId, limit: 4 })
    const titles = results.map((r) => r.title)
    expect(titles).not.toContain('Source')
    expect(titles[0]).toBe('Popular') // most-listened first
  })
})

describe('rate limiting', () => {
  test('semanticSearch rejects once the global bucket is drained', async () => {
    const t = convexTest(schema, modules)
    await seed(t, [{ title: 'Alpha', category: 'Technology', embedding: axisVector(0) }])
    stubEmbedder(axisVector(0))

    // Capacity is 30 (burst). Drain it, then the next call must be rejected.
    // Calls run back-to-back so refill (0.5/sec) is negligible within the loop.
    let rejected = false
    for (let i = 0; i < 40; i++) {
      try {
        await t.action(api.podcasts.semanticSearch, { query: `q${i}` })
      } catch (err) {
        const msg = String((err as { data?: { code?: string } })?.data?.code ?? err)
        expect(msg.includes('RATE_LIMITED') || String(err).includes('RATE_LIMITED')).toBe(true)
        rejected = true
        break
      }
    }
    expect(rejected).toBe(true)
  })
})
