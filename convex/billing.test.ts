import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { api, internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

// Load all Convex modules for the in-memory test backend.
const modules = import.meta.glob('./**/*.ts')

// ── Gemini SDK mock ──────────────────────────────────────────────────────────
// runPipeline drives the real generation through the @google/generative-ai SDK
// (script + TTS audio) plus a couple of fetch calls (embedding + thumbnail). We
// stub the SDK so the pipeline reaches `ready` deterministically, with no network
// and no API key, which lets us assert the quota counter at the real `ready` seam.
const fakeAudioBase64 = Buffer.from('fake-pcm-audio').toString('base64')

vi.mock('@google/generative-ai', () => {
  class GoogleGenerativeAI {
    getGenerativeModel() {
      return {
        // Script step calls generateContent(prompt) → response.text()
        // Audio step calls generateContent({ contents, generationConfig }) and
        // reads response.candidates[0].content.parts[].inlineData.
        generateContent: vi.fn(async () => ({
          response: {
            text: () => 'A fake generated transcript for the test.',
            candidates: [
              {
                content: {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'audio/L16;rate=24000',
                        data: fakeAudioBase64,
                      },
                    },
                  ],
                },
              },
            ],
          },
        })),
      }
    }
  }
  return { GoogleGenerativeAI }
})

// Stub fetch so the embedding step and the thumbnail provider never hit the
// network. The embedding step is non-fatal; the thumbnail step is non-fatal too.
function stubFetch() {
  const fetchMock = vi.fn(async (url: any) => {
    const u = String(url)
    if (u.includes('embedContent')) {
      return new Response(
        JSON.stringify({ embedding: { values: new Array(768).fill(0) } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
    if (u.includes('generateContent')) {
      // Gemini image generation endpoint
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/png',
                      data: Buffer.from('img').toString('base64'),
                    },
                  },
                ],
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }
    // Fallback thumbnail provider (pollinations) — any other fetch
    return new Response(new Uint8Array([1, 2, 3]), {
      status: 200,
      headers: { 'Content-Type': 'image/jpeg' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

type SeedUser = {
  clerkId?: string
  plan?: 'free' | 'pro'
  generationCount?: number
}

async function seedUser(t: ReturnType<typeof convexTest>, u: SeedUser = {}) {
  return t.run(async (ctx) =>
    ctx.db.insert('users', {
      clerkId: u.clerkId ?? 'user_1',
      name: 'Test User',
      email: 'user@test.dev',
      plan: u.plan,
      generationCount: u.generationCount,
    }),
  )
}

async function seedPodcast(
  t: ReturnType<typeof convexTest>,
  authorId: Id<'users'>,
  overrides: Partial<{
    status: 'pending' | 'generating' | 'ready' | 'failed'
    countedTowardQuota: boolean
  }> = {},
) {
  return t.run(async (ctx) =>
    ctx.db.insert('podcasts', {
      title: 'Test Podcast',
      description: 'desc',
      category: 'Technology',
      authorId,
      topicPrompt: 'a topic',
      speaker1Voice: 'alloy',
      status: overrides.status ?? 'pending',
      listenerCount: 0,
      countedTowardQuota: overrides.countedTowardQuota,
    }),
  )
}

function errorCode(err: unknown): string | undefined {
  return (err as { data?: { code?: string } })?.data?.code
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key'
  // generatePodcast/retry/edit now schedule runPipeline (runAfter 0). Fake timers
  // let finishAllScheduledFunctions(vi.runAllTimers) drive it to completion.
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('generatePodcast gate', () => {
  test('Free user at the limit is rejected with QUOTA_EXCEEDED', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, { generationCount: 3 })
    const podcastId = await seedPodcast(t, authorId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await expect(
      asUser.action(api.podcasts.generatePodcast, { podcastId }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'QUOTA_EXCEEDED')
  })

  test('Free user under the limit is allowed and the podcast reaches ready', async () => {
    const t = convexTest(schema, modules)
    stubFetch()
    const authorId = await seedUser(t, { generationCount: 2 })
    const podcastId = await seedPodcast(t, authorId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.action(api.podcasts.generatePodcast, { podcastId })
    // generatePodcast schedules runPipeline (background); run it before asserting.
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const podcast = await t.run((ctx) => ctx.db.get(podcastId))
    expect(podcast?.status).toBe('ready')
  })

  test('Pro user under the Pro limit (past the free limit) is allowed', async () => {
    const t = convexTest(schema, modules)
    stubFetch()
    // 6 is past the free limit (3) but under the Pro limit (7).
    const authorId = await seedUser(t, { plan: 'pro', generationCount: 6 })
    const podcastId = await seedPodcast(t, authorId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.action(api.podcasts.generatePodcast, { podcastId })
    // generatePodcast schedules runPipeline (background); run it before asserting.
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const podcast = await t.run((ctx) => ctx.db.get(podcastId))
    expect(podcast?.status).toBe('ready')
  })

  test('Pro user at the Pro limit (7) is rejected with QUOTA_EXCEEDED', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, { plan: 'pro', generationCount: 7 })
    const podcastId = await seedPodcast(t, authorId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await expect(
      asUser.action(api.podcasts.generatePodcast, { podcastId }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'QUOTA_EXCEEDED')
  })

  test('unauthenticated caller is rejected', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t)
    const podcastId = await seedPodcast(t, authorId)

    await expect(
      t.action(api.podcasts.generatePodcast, { podcastId }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'UNAUTHENTICATED')
  })
})

describe('generationCount — idempotent counter at the ready step', () => {
  test('a fresh successful generation increments the author exactly once', async () => {
    const t = convexTest(schema, modules)
    stubFetch()
    const authorId = await seedUser(t, { generationCount: 0 })
    const podcastId = await seedPodcast(t, authorId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.action(api.podcasts.generatePodcast, { podcastId })
    // generatePodcast schedules runPipeline (background); run it before asserting.
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const author = await t.run((ctx) => ctx.db.get(authorId))
    const podcast = await t.run((ctx) => ctx.db.get(podcastId))
    expect(author?.generationCount).toBe(1)
    expect(podcast?.countedTowardQuota).toBe(true)
    expect(podcast?.status).toBe('ready')
  })

  test('a failed generation does not increment the counter', async () => {
    const t = convexTest(schema, modules)
    // No API key → the script step fails immediately, status becomes 'failed',
    // and the ready step (the only place that counts) is never reached.
    delete process.env.GEMINI_API_KEY
    const authorId = await seedUser(t, { generationCount: 0 })
    const podcastId = await seedPodcast(t, authorId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.action(api.podcasts.generatePodcast, { podcastId })
    // generatePodcast schedules runPipeline (background); run it before asserting.
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const author = await t.run((ctx) => ctx.db.get(authorId))
    const podcast = await t.run((ctx) => ctx.db.get(podcastId))
    expect(podcast?.status).toBe('failed')
    expect(author?.generationCount ?? 0).toBe(0)
    expect(podcast?.countedTowardQuota ?? false).toBe(false)
  })

  test('retry of a previously-failed podcast counts exactly once', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, { generationCount: 0 })
    const podcastId = await seedPodcast(t, authorId, { status: 'failed' })

    // First attempt fails (no key) — no increment.
    delete process.env.GEMINI_API_KEY
    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.action(api.podcasts.retryGeneration, { podcastId })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    let author = await t.run((ctx) => ctx.db.get(authorId))
    expect(author?.generationCount ?? 0).toBe(0)

    // Retry now succeeds — counts exactly once.
    process.env.GEMINI_API_KEY = 'test-key'
    stubFetch()
    await asUser.action(api.podcasts.retryGeneration, { podcastId })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    author = await t.run((ctx) => ctx.db.get(authorId))
    const podcast = await t.run((ctx) => ctx.db.get(podcastId))
    expect(author?.generationCount).toBe(1)
    expect(podcast?.status).toBe('ready')
    expect(podcast?.countedTowardQuota).toBe(true)
  })

  test('regenerating an already-ready (already-counted) podcast does not re-count', async () => {
    const t = convexTest(schema, modules)
    stubFetch()
    const authorId = await seedUser(t, { generationCount: 1 })
    // Already ready + already counted (e.g. the fresh success above).
    const podcastId = await seedPodcast(t, authorId, {
      status: 'ready',
      countedTowardQuota: true,
    })

    // Edit + regenerate runs the pipeline again and lands on ready again, but the
    // marker is already set so the count must stay at 1.
    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.action(api.podcasts.editAndRegenerate, {
      id: podcastId,
      authorId,
      topicPrompt: 'a changed topic',
      needsRegeneration: true,
    })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const author = await t.run((ctx) => ctx.db.get(authorId))
    const podcast = await t.run((ctx) => ctx.db.get(podcastId))
    expect(author?.generationCount).toBe(1)
    expect(podcast?.status).toBe('ready')
  })

  test('markReadyAndCount is idempotent when invoked twice', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, { generationCount: 0 })
    const podcastId = await seedPodcast(t, authorId)

    await t.mutation(internal.podcasts.markReadyAndCount, { id: podcastId })
    await t.mutation(internal.podcasts.markReadyAndCount, { id: podcastId })

    const author = await t.run((ctx) => ctx.db.get(authorId))
    expect(author?.generationCount).toBe(1)
  })
})

describe('custom thumbnail upload — Pro enforcement', () => {
  test('a Free user is rejected from requesting an upload URL', async () => {
    const t = convexTest(schema, modules)
    await seedUser(t, { plan: 'free' })

    const asUser = t.withIdentity({ subject: 'user_1' })
    await expect(
      asUser.mutation(api.podcasts.generateThumbnailUploadUrl, {}),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'PRO_REQUIRED')
  })

  test('a Free user is rejected from setting a custom thumbnail', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, { plan: 'free' })
    const podcastId = await seedPodcast(t, authorId, { status: 'ready' })
    const storageId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })),
    )

    const asUser = t.withIdentity({ subject: 'user_1' })
    await expect(
      asUser.mutation(api.podcasts.setCustomThumbnail, { podcastId, storageId }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'PRO_REQUIRED')
  })

  test('a Pro user can set a custom thumbnail on their own podcast', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, { plan: 'pro' })
    const podcastId = await seedPodcast(t, authorId, { status: 'ready' })
    const storageId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' })),
    )

    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.mutation(api.podcasts.setCustomThumbnail, { podcastId, storageId })

    const podcast = await t.run((ctx) => ctx.db.get(podcastId))
    expect(podcast?.thumbnailStorageId).toBe(storageId)
  })
})

describe('setPlan webhook mirror', () => {
  test('mirrors the Pro plan onto an existing user doc', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'free' })

    await t.mutation(internal.users.setPlan, { clerkId: 'user_1', plan: 'pro' })

    const user = await t.run((ctx) => ctx.db.get(userId))
    expect(user?.plan).toBe('pro')
  })

  test('is a no-op when no matching user exists yet', async () => {
    const t = convexTest(schema, modules)
    // Should not throw even though there is no user with this clerkId.
    await t.mutation(internal.users.setPlan, { clerkId: 'ghost', plan: 'pro' })
    const users = await t.run((ctx) => ctx.db.query('users').collect())
    expect(users.length).toBe(0)
  })
})
