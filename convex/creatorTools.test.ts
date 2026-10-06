import { convexTest } from 'convex-test'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { buildFeedXml, escapeXml } from './rss'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

// Same SDK/fetch stubbing approach as billing.test.ts: the pipeline reaches the
// script / audio steps deterministically with no network or API key.
const generateContent = vi.fn()
vi.mock('@google/generative-ai', () => {
  class GoogleGenerativeAI {
    getGenerativeModel() {
      return { generateContent: (...args: unknown[]) => generateContent(...args) }
    }
  }
  return { GoogleGenerativeAI }
})

function stubFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: unknown) => {
      if (String(url).includes('embedContent')) {
        return new Response(JSON.stringify({ embedding: { values: new Array(768).fill(0) } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { 'Content-Type': 'image/jpeg' },
      })
    }),
  )
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = 'test-key'
  vi.useFakeTimers()
  generateContent.mockReset()
  generateContent.mockImplementation(async (arg: unknown) => ({
    response: {
      text: () => 'First paragraph.\n\nSecond paragraph.',
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/L16;rate=24000',
                  data: Buffer.from('pcm').toString('base64'),
                },
              },
            ],
          },
        },
      ],
      _arg: arg,
    },
  }))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

type T = ReturnType<typeof convexTest>

async function seedUser(t: T, clerkId = 'user_1', extra: Record<string, unknown> = {}) {
  return t.run(async (ctx) =>
    ctx.db.insert('users', { clerkId, name: 'Ada', email: `${clerkId}@test.dev`, ...extra }),
  )
}

async function seedPodcast(
  t: T,
  authorId: Id<'users'>,
  extra: Record<string, unknown> = {},
) {
  return t.run(async (ctx) =>
    ctx.db.insert('podcasts', {
      title: 'Test Podcast',
      description: 'desc',
      category: 'Technology',
      authorId,
      topicPrompt: 'a topic',
      speaker1Voice: 'alloy',
      status: 'pending',
      listenerCount: 0,
      ...extra,
    } as never),
  )
}

const code = (err: unknown) => (err as { data?: { code?: string } })?.data?.code

describe('script review', () => {
  test('reviewScript writes the script, then stops before audio generation', async () => {
    const t = convexTest(schema, modules)
    stubFetch()
    const authorId = await seedUser(t)
    const podcastId = await seedPodcast(t, authorId)

    await t.withIdentity({ subject: 'user_1' }).action(api.podcasts.generatePodcast, {
      podcastId,
      reviewScript: true,
    })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const p = await t.run((ctx) => ctx.db.get(podcastId))
    expect(p?.status).toBe('script_review')
    expect(p?.transcript).toContain('First paragraph')
    expect(p?.audioStorageId).toBeUndefined()
    // Only the script call happened — no TTS call.
    expect(generateContent).toHaveBeenCalledTimes(1)
  })

  test('approving saves the edited script and generates audio from it (no new script)', async () => {
    const t = convexTest(schema, modules)
    stubFetch()
    const authorId = await seedUser(t)
    const podcastId = await seedPodcast(t, authorId, {
      status: 'script_review',
      transcript: 'Original draft.',
    })

    await t.withIdentity({ subject: 'user_1' }).action(api.podcasts.approveScript, {
      podcastId,
      transcript: '  My edited script.  ',
    })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const p = await t.run((ctx) => ctx.db.get(podcastId))
    expect(p?.status).toBe('ready')
    expect(p?.transcript).toBe('My edited script.')
    expect(p?.audioStorageId).toBeDefined()
    // Exactly one model call (TTS), and it voiced the EDITED text.
    expect(generateContent).toHaveBeenCalledTimes(1)
    expect(JSON.stringify(generateContent.mock.calls[0][0])).toContain('My edited script.')
  })

  test('only the owner can edit or approve; empty/oversized scripts are rejected', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'user_1')
    await seedUser(t, 'user_2')
    const podcastId = await seedPodcast(t, authorId, { status: 'script_review', transcript: 'x' })

    const other = t.withIdentity({ subject: 'user_2' })
    await expect(
      other.mutation(api.podcasts.saveScript, { podcastId, transcript: 'hijack' }),
    ).rejects.toSatisfy((e: unknown) => code(e) === 'FORBIDDEN')

    await expect(
      t.mutation(api.podcasts.saveScript, { podcastId, transcript: 'anon' }),
    ).rejects.toSatisfy((e: unknown) => code(e) === 'UNAUTHENTICATED')

    const owner = t.withIdentity({ subject: 'user_1' })
    await expect(
      owner.mutation(api.podcasts.saveScript, { podcastId, transcript: '   ' }),
    ).rejects.toSatisfy((e: unknown) => code(e) === 'SCRIPT_EMPTY')
    await expect(
      owner.mutation(api.podcasts.saveScript, { podcastId, transcript: 'a'.repeat(8001) }),
    ).rejects.toSatisfy((e: unknown) => code(e) === 'SCRIPT_TOO_LONG')
  })

  test('scripts cannot be saved while the pipeline is running', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t)
    const podcastId = await seedPodcast(t, authorId, { status: 'generating', transcript: 'x' })
    await expect(
      t.withIdentity({ subject: 'user_1' }).mutation(api.podcasts.saveScript, {
        podcastId,
        transcript: 'y',
      }),
    ).rejects.toSatisfy((e: unknown) => code(e) === 'NOT_EDITABLE')
  })

  test('a published podcast: "update text only" changes the transcript and keeps the rest', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t)
    const podcastId = await seedPodcast(t, authorId, {
      status: 'ready',
      transcript: 'Old text.',
      audioUrl: 'https://cdn.test/a.mp3',
    })

    await t.withIdentity({ subject: 'user_1' }).mutation(api.podcasts.saveScript, {
      podcastId,
      transcript: 'Corrected text.',
    })

    const p = await t.run((ctx) => ctx.db.get(podcastId))
    expect(p?.transcript).toBe('Corrected text.')
    expect(p?.status).toBe('ready')
    expect(p?.audioUrl).toBe('https://cdn.test/a.mp3')
  })

  test('re-voicing a published podcast costs no quota, keeps its cover, and replaces the audio', async () => {
    const t = convexTest(schema, modules)
    stubFetch()
    // Already at the free limit: a brand new generation would be refused.
    const authorId = await seedUser(t, 'user_1', { generationCount: 3 })
    const oldAudio = await t.run((ctx) => ctx.storage.store(new Blob(['old audio'])))
    const cover = await t.run((ctx) => ctx.storage.store(new Blob(['my uploaded cover'])))
    const podcastId = await seedPodcast(t, authorId, {
      status: 'ready',
      countedTowardQuota: true,
      transcript: 'Old text.',
      audioStorageId: oldAudio,
      thumbnailStorageId: cover,
    })

    await t.withIdentity({ subject: 'user_1' }).action(api.podcasts.approveScript, {
      podcastId,
      transcript: 'Brand new wording.',
    })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const p = await t.run((ctx) => ctx.db.get(podcastId))
    const author = await t.run((ctx) => ctx.db.get(authorId))
    expect(p?.status).toBe('ready')
    expect(p?.transcript).toBe('Brand new wording.')
    expect(author?.generationCount).toBe(3) // not charged again
    expect(p?.thumbnailStorageId).toBe(cover) // cover art untouched
    expect(p?.audioStorageId).toBeDefined()
    expect(p?.audioStorageId).not.toBe(oldAudio) // new audio
    expect(await t.run((ctx) => ctx.storage.getUrl(oldAudio))).toBeNull() // old file removed
    expect(JSON.stringify(generateContent.mock.calls[0][0])).toContain('Brand new wording.')
  })

  test('another user cannot edit a published podcast', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'user_1')
    await seedUser(t, 'user_2')
    const podcastId = await seedPodcast(t, authorId, { status: 'ready', transcript: 'x' })
    await expect(
      t.withIdentity({ subject: 'user_2' }).action(api.podcasts.approveScript, {
        podcastId,
        transcript: 'hijack',
      }),
    ).rejects.toSatisfy((e: unknown) => code(e) === 'FORBIDDEN')
  })

  test('approving is blocked once the generation quota is used up', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'user_1', { generationCount: 3 })
    const podcastId = await seedPodcast(t, authorId, { status: 'script_review', transcript: 'x' })
    await expect(
      t.withIdentity({ subject: 'user_1' }).action(api.podcasts.approveScript, {
        podcastId,
        transcript: 'x',
      }),
    ).rejects.toSatisfy((e: unknown) => code(e) === 'QUOTA_EXCEEDED')
  })

  test('regenerating drops the draft, writes a new script, and returns to review', async () => {
    const t = convexTest(schema, modules)
    stubFetch()
    const authorId = await seedUser(t)
    const podcastId = await seedPodcast(t, authorId, {
      status: 'script_review',
      transcript: 'Old draft.',
    })

    await t.withIdentity({ subject: 'user_1' }).action(api.podcasts.regenerateScript, { podcastId })
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const p = await t.run((ctx) => ctx.db.get(podcastId))
    expect(p?.status).toBe('script_review')
    expect(p?.transcript).toContain('First paragraph')
  })
})

describe('RSS feed', () => {
  test('escapes XML-significant characters', () => {
    expect(escapeXml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; &apos;Jerry&apos;&lt;/a&gt;',
    )
  })

  test('buildFeedXml produces a valid podcast feed with enclosures via the tracking route', () => {
    const xml = buildFeedXml(
      {
        title: "Ada's Podcasts",
        description: 'desc',
        author: 'Ada',
        email: 'ada@test.dev',
        link: 'https://app.test',
        feedUrl: 'https://x.convex.site/rss/u1.xml',
        episodes: [
          {
            id: 'p1',
            title: 'Tom & Jerry',
            description: 'About <cats>',
            category: 'Comedy',
            transcript: 'One.\n\nTwo.',
            publishedAt: Date.UTC(2026, 0, 2),
            audioBytes: 1234,
            audioType: 'audio/wav',
          },
        ],
      },
      'https://x.convex.site',
    )
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<title>Tom &amp; Jerry</title>')
    expect(xml).toContain('<description>About &lt;cats&gt;</description>')
    expect(xml).toContain(
      '<enclosure url="https://x.convex.site/audio/p1.wav" length="1234" type="audio/wav"/>',
    )
    expect(xml).toContain('<guid isPermaLink="false">p1</guid>')
    expect(xml).toContain('<pubDate>Fri, 02 Jan 2026 00:00:00 GMT</pubDate>')
    expect(xml).toContain('<itunes:category text="Comedy"/>')
  })

  test('/rss/<userId>.xml lists only ready episodes with audio; unknown ids 404', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t)
    const readyId = await seedPodcast(t, authorId, {
      status: 'ready',
      title: 'Live Episode',
      audioUrl: 'https://cdn.test/a.mp3',
    })
    await seedPodcast(t, authorId, { status: 'ready', title: 'No Audio Episode' })
    await seedPodcast(t, authorId, {
      status: 'script_review',
      title: 'Draft Episode',
      audioUrl: 'https://cdn.test/b.mp3',
    })

    const res = await t.fetch(`/rss/${authorId}.xml`)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/rss+xml')
    const xml = await res.text()
    expect(xml).toContain('Live Episode')
    expect(xml).toContain(`/audio/${readyId}.wav`)
    expect(xml).not.toContain('No Audio Episode')
    expect(xml).not.toContain('Draft Episode')

    expect((await t.fetch('/rss/not-a-real-id.xml')).status).toBe(404)
  })

  test('/audio/<id> records a download and redirects to the file', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t)
    const podcastId = await seedPodcast(t, authorId, {
      status: 'ready',
      audioUrl: 'https://cdn.test/a.mp3',
    })

    const res = await t.fetch(`/audio/${podcastId}.wav`, { redirect: 'manual' })
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('https://cdn.test/a.mp3')
    const rows = await t.run((ctx) => ctx.db.query('rssDownloads').collect())
    expect(rows).toHaveLength(1)
    expect(rows[0].podcastId).toBe(podcastId)

    // Unpublished / unknown episodes are not served and not counted.
    const draftId = await seedPodcast(t, authorId, {
      status: 'script_review',
      audioUrl: 'https://cdn.test/b.mp3',
    })
    expect((await t.fetch(`/audio/${draftId}.wav`, { redirect: 'manual' })).status).toBe(404)
    expect((await t.fetch('/audio/garbage.wav', { redirect: 'manual' })).status).toBe(404)
    expect(await t.run((ctx) => ctx.db.query('rssDownloads').collect())).toHaveLength(1)
  })
})

describe('creator analytics', () => {
  test('signed-out users get null', async () => {
    const t = convexTest(schema, modules)
    await seedUser(t)
    expect(await t.query(api.analytics.myOverview, {})).toBeNull()
  })

  test("aggregates only the caller's own episodes: listeners, RSS, saves, downloads, series", async () => {
    const t = convexTest(schema, modules)
    const me = await seedUser(t, 'user_1')
    const fan1 = await seedUser(t, 'fan_1')
    const fan2 = await seedUser(t, 'fan_2')
    const other = await seedUser(t, 'other')

    const mine = await seedPodcast(t, me, { status: 'ready', title: 'Mine', listenerCount: 2 })
    const theirs = await seedPodcast(t, other, { status: 'ready', title: 'Theirs', listenerCount: 9 })
    await seedPodcast(t, me, { status: 'script_review', title: 'Draft' })

    await t.run(async (ctx) => {
      await ctx.db.insert('listens', { podcastId: mine, userId: fan1 })
      await ctx.db.insert('listens', { podcastId: mine, userId: fan2 })
      await ctx.db.insert('listens', { podcastId: theirs, userId: fan1 })
      await ctx.db.insert('rssDownloads', { podcastId: mine, authorId: me })
      await ctx.db.insert('rssDownloads', { podcastId: mine, authorId: me })
      await ctx.db.insert('rssDownloads', { podcastId: theirs, authorId: other })
      const folder = await ctx.db.insert('bookmarkFolders', {
        userId: fan1,
        name: 'F',
        nameLower: 'f',
      })
      const folder2 = await ctx.db.insert('bookmarkFolders', {
        userId: fan1,
        name: 'G',
        nameLower: 'g',
      })
      // Same fan saves into two folders → counts as ONE save.
      await ctx.db.insert('bookmarks', { userId: fan1, podcastId: mine, folderId: folder })
      await ctx.db.insert('bookmarks', { userId: fan1, podcastId: mine, folderId: folder2 })
      await ctx.db.insert('downloads', { userId: fan2, podcastId: mine })
    })

    const data = await t.withIdentity({ subject: 'user_1' }).query(api.analytics.myOverview, {
      days: 7,
    })
    expect(data).not.toBeNull()
    expect(data?.totals).toMatchObject({
      episodes: 1, // drafts and other creators' episodes excluded
      listeners: 2,
      listenersInRange: 2,
      rssDownloads: 2,
      rssDownloadsInRange: 2,
      bookmarks: 1,
      appDownloads: 1,
    })
    expect(data?.episodes).toHaveLength(1)
    expect(data?.episodes[0]).toMatchObject({ title: 'Mine', listenersLast7Days: 2 })

    // Zero-filled 7-day series; today's bucket holds the events.
    expect(data?.series).toHaveLength(7)
    const today = data?.series[6]
    expect(today).toMatchObject({ listeners: 2, rssDownloads: 2 })
    expect(data?.series.slice(0, 6).every((p) => p.listeners === 0 && p.rssDownloads === 0)).toBe(
      true,
    )
  })

  test('the window follows the viewer day, but ignores a wildly wrong clock', async () => {
    const t = convexTest(schema, modules)
    await seedUser(t)
    const asMe = t.withIdentity({ subject: 'user_1' })
    const day = (offsetDays: number) =>
      new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10)

    // Viewer is already in tomorrow (UTC midnight just passed for them).
    const ahead = await asMe.query(api.analytics.myOverview, { days: 3, today: day(1) })
    expect(ahead?.series.map((p) => p.date)).toEqual([day(-1), day(0), day(1)])

    // A clock a year off falls back to the server's day.
    const bogus = await asMe.query(api.analytics.myOverview, { days: 3, today: '2020-01-01' })
    expect(bogus?.series[2].date).toBe(day(0))
  })

  test('the requested window is clamped to 1..90 days', async () => {
    const t = convexTest(schema, modules)
    await seedUser(t)
    const asMe = t.withIdentity({ subject: 'user_1' })
    expect((await asMe.query(api.analytics.myOverview, { days: 9999 }))?.series).toHaveLength(90)
    expect((await asMe.query(api.analytics.myOverview, { days: 0 }))?.series).toHaveLength(1)
  })
})
