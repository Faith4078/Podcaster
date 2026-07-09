import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

// Load all Convex modules for the in-memory test backend.
const modules = import.meta.glob('./**/*.ts')

// Mutation-level tests for incrementListeners: the 30s playback threshold is
// enforced client-side (MiniPlayer/playerStore); the backend's contract is
// auth-required (silent no-op when signed out) + per-(podcast, user) dedup.

async function seedUser(t: ReturnType<typeof convexTest>, clerkId = 'user_1') {
  return t.run(async (ctx) =>
    ctx.db.insert('users', {
      clerkId,
      name: 'Test User',
      email: `${clerkId}@test.dev`,
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
    }),
  )
}

async function listenerCount(t: ReturnType<typeof convexTest>, id: Id<'podcasts'>) {
  return t.run(async (ctx) => (await ctx.db.get(id))?.listenerCount)
}

async function listenRows(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => ctx.db.query('listens').collect())
}

describe('incrementListeners', () => {
  test('first qualifying listen by an authenticated user increments the count and records a listen row', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    const userId = await seedUser(t, 'listener')
    const podcastId = await seedPodcast(t, authorId)

    const asUser = t.withIdentity({ subject: 'listener' })
    await asUser.mutation(api.podcasts.incrementListeners, { id: podcastId })

    expect(await listenerCount(t, podcastId)).toBe(1)
    const rows = await listenRows(t)
    expect(rows).toHaveLength(1)
    expect(rows[0].podcastId).toBe(podcastId)
    expect(rows[0].userId).toBe(userId)
  })

  test('repeat listens by the same user do NOT increment again (10 plays = 1 listen)', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    await seedUser(t, 'listener')
    const podcastId = await seedPodcast(t, authorId)

    const asUser = t.withIdentity({ subject: 'listener' })
    for (let i = 0; i < 10; i++) {
      await asUser.mutation(api.podcasts.incrementListeners, { id: podcastId })
    }

    expect(await listenerCount(t, podcastId)).toBe(1)
    expect(await listenRows(t)).toHaveLength(1)
  })

  test('unauthenticated calls silently no-op (no throw, no count change)', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    const podcastId = await seedPodcast(t, authorId)

    // No identity — must not throw (playback must never break) and not count.
    // Convex serializes a bare `return` as null.
    await expect(
      t.mutation(api.podcasts.incrementListeners, { id: podcastId }),
    ).resolves.toBeNull()

    expect(await listenerCount(t, podcastId)).toBe(0)
    expect(await listenRows(t)).toHaveLength(0)
  })

  test('an identity without a users row silently no-ops', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    const podcastId = await seedPodcast(t, authorId)

    const asGhost = t.withIdentity({ subject: 'not_synced_yet' })
    await expect(
      asGhost.mutation(api.podcasts.incrementListeners, { id: podcastId }),
    ).resolves.toBeNull()

    expect(await listenerCount(t, podcastId)).toBe(0)
    expect(await listenRows(t)).toHaveLength(0)
  })

  test('distinct users each count once', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    await seedUser(t, 'listener_a')
    await seedUser(t, 'listener_b')
    const podcastId = await seedPodcast(t, authorId)

    await t
      .withIdentity({ subject: 'listener_a' })
      .mutation(api.podcasts.incrementListeners, { id: podcastId })
    await t
      .withIdentity({ subject: 'listener_b' })
      .mutation(api.podcasts.incrementListeners, { id: podcastId })
    // A repeat from user A still doesn't add a third.
    await t
      .withIdentity({ subject: 'listener_a' })
      .mutation(api.podcasts.incrementListeners, { id: podcastId })

    expect(await listenerCount(t, podcastId)).toBe(2)
    expect(await listenRows(t)).toHaveLength(2)
  })

  test('dedup is per podcast — the same user listening to two podcasts counts each once', async () => {
    const t = convexTest(schema, modules)
    const authorId = await seedUser(t, 'author')
    await seedUser(t, 'listener')
    const podcastA = await seedPodcast(t, authorId)
    const podcastB = await seedPodcast(t, authorId)

    const asUser = t.withIdentity({ subject: 'listener' })
    await asUser.mutation(api.podcasts.incrementListeners, { id: podcastA })
    await asUser.mutation(api.podcasts.incrementListeners, { id: podcastB })

    expect(await listenerCount(t, podcastA)).toBe(1)
    expect(await listenerCount(t, podcastB)).toBe(1)
    expect(await listenRows(t)).toHaveLength(2)
  })
})
