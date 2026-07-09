import { convexTest } from 'convex-test'
import { ConvexError } from 'convex/values'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { FREE_DOWNLOAD_LIMIT } from './downloads'
import schema from './schema'

const modules = import.meta.glob('./**/*.ts')

async function seedUser(
  t: ReturnType<typeof convexTest>,
  clerkId: string,
  plan?: 'free' | 'pro',
) {
  return t.run(async (ctx) =>
    ctx.db.insert('users', {
      clerkId,
      name: 'Test User',
      email: `${clerkId}@test.dev`,
      ...(plan ? { plan } : {}),
    }),
  )
}

async function seedPodcast(t: ReturnType<typeof convexTest>, authorId: Id<'users'>) {
  return t.run(async (ctx) =>
    ctx.db.insert('podcasts', {
      title: 'Test Podcast',
      description: 'desc',
      category: 'Technology',
      authorId,
      topicPrompt: 'a topic',
      speaker1Voice: 'alloy',
      status: 'ready',
      listenerCount: 0,
      audioUrl: 'https://example.com/audio.mp3',
    }),
  )
}

async function downloadRows(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => ctx.db.query('downloads').collect())
}

describe('recordDownload', () => {
  test('a free user can download up to the limit, then is blocked', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    await seedUser(t, 'free', 'free')
    const asUser = t.withIdentity({ subject: 'free' })

    const ids: Id<'podcasts'>[] = []
    for (let i = 0; i < FREE_DOWNLOAD_LIMIT; i++) {
      const p = await seedPodcast(t, authorId)
      ids.push(p)
      const res = await asUser.mutation(api.downloads.recordDownload, { podcastId: p })
      expect(res.audioUrl).toBe('https://example.com/audio.mp3')
    }
    expect(await downloadRows(t)).toHaveLength(FREE_DOWNLOAD_LIMIT)

    // One more DISTINCT podcast exceeds the free cap.
    const extra = await seedPodcast(t, authorId)
    await expect(
      asUser.mutation(api.downloads.recordDownload, { podcastId: extra }),
    ).rejects.toThrow(ConvexError)
    expect(await downloadRows(t)).toHaveLength(FREE_DOWNLOAD_LIMIT)
  })

  test('re-downloading an already-downloaded podcast is free (no new slot)', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    await seedUser(t, 'free', 'free')
    const asUser = t.withIdentity({ subject: 'free' })
    const p = await seedPodcast(t, authorId)

    await asUser.mutation(api.downloads.recordDownload, { podcastId: p })
    await asUser.mutation(api.downloads.recordDownload, { podcastId: p })
    await asUser.mutation(api.downloads.recordDownload, { podcastId: p })

    expect(await downloadRows(t)).toHaveLength(1)
  })

  test('a pro user has unlimited downloads', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    await seedUser(t, 'pro', 'pro')
    const asUser = t.withIdentity({ subject: 'pro' })

    for (let i = 0; i < FREE_DOWNLOAD_LIMIT + 3; i++) {
      const p = await seedPodcast(t, authorId)
      await asUser.mutation(api.downloads.recordDownload, { podcastId: p })
    }
    expect(await downloadRows(t)).toHaveLength(FREE_DOWNLOAD_LIMIT + 3)
  })

  test('a signed-out user cannot download', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    const p = await seedPodcast(t, authorId)

    await expect(
      t.mutation(api.downloads.recordDownload, { podcastId: p }),
    ).rejects.toThrow(ConvexError)
    expect(await downloadRows(t)).toHaveLength(0)
  })

  test('myDownloadInfo reports usage for a free user', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    await seedUser(t, 'free', 'free')
    const asUser = t.withIdentity({ subject: 'free' })
    const p = await seedPodcast(t, authorId)
    await asUser.mutation(api.downloads.recordDownload, { podcastId: p })

    const info = await asUser.query(api.downloads.myDownloadInfo, {})
    expect(info.isPro).toBe(false)
    expect(info.count).toBe(1)
    expect(info.limit).toBe(FREE_DOWNLOAD_LIMIT)
    expect(info.downloadedIds).toContain(p)
  })
})
