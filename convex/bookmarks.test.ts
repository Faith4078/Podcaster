import { convexTest } from 'convex-test'
import { describe, expect, test } from 'vitest'
import { api } from './_generated/api'
import type { Id } from './_generated/dataModel'
import schema from './schema'

// Load all Convex modules for the in-memory test backend.
const modules = import.meta.glob('./**/*.ts')

type SeedUser = {
  clerkId?: string
  plan?: 'free' | 'pro'
}

async function seedUser(t: ReturnType<typeof convexTest>, u: SeedUser = {}) {
  return t.run(async (ctx) =>
    ctx.db.insert('users', {
      clerkId: u.clerkId ?? 'user_1',
      name: 'Test User',
      email: 'user@test.dev',
      plan: u.plan,
    }),
  )
}

async function seedPodcast(
  t: ReturnType<typeof convexTest>,
  authorId: Id<'users'>,
  status: 'pending' | 'generating' | 'ready' | 'failed' = 'ready',
) {
  return t.run(async (ctx) =>
    ctx.db.insert('podcasts', {
      title: 'Test Podcast',
      description: 'desc',
      category: 'Technology',
      authorId,
      topicPrompt: 'a topic',
      speaker1Voice: 'alloy',
      status,
      listenerCount: 0,
    }),
  )
}

function errorCode(err: unknown): string | undefined {
  return (err as { data?: { code?: string } })?.data?.code
}

// Total bookmark rows for a user, across ALL folders — what the Free gate counts.
async function bookmarkCount(t: ReturnType<typeof convexTest>, userId: Id<'users'>) {
  return t.run(async (ctx) => {
    const all = await ctx.db.query('bookmarks').collect()
    return all.filter((b) => b.userId === userId).length
  })
}

async function folderCount(t: ReturnType<typeof convexTest>, userId: Id<'users'>) {
  return t.run(async (ctx) => {
    const all = await ctx.db.query('bookmarkFolders').collect()
    return all.filter((f) => f.userId === userId).length
  })
}

describe('createFolder', () => {
  test('creates a folder and returns its id', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const folderId = await asUser.mutation(api.bookmarks.createFolder, { name: 'Faves' })

    expect(folderId).toBeDefined()
    expect(await folderCount(t, userId)).toBe(1)
  })

  test('dedups by case-insensitive name (returns the same folder)', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const a = await asUser.mutation(api.bookmarks.createFolder, { name: 'Faves' })
    const b = await asUser.mutation(api.bookmarks.createFolder, { name: '  faves ' })

    expect(b).toBe(a)
    expect(await folderCount(t, userId)).toBe(1)
  })

  test('rejects an empty / whitespace name', async () => {
    const t = convexTest(schema, modules)
    await seedUser(t)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await expect(
      asUser.mutation(api.bookmarks.createFolder, { name: '   ' }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'INVALID_FOLDER_NAME')
  })

  test('unauthenticated caller is rejected', async () => {
    const t = convexTest(schema, modules)
    await seedUser(t)

    await expect(
      t.mutation(api.bookmarks.createFolder, { name: 'Faves' }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'UNAUTHENTICATED')
  })
})

describe('addBookmark — save to existing folder', () => {
  test('Free user under the limit can bookmark into a folder', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'free' })
    const podcastId = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const folderId = await asUser.mutation(api.bookmarks.createFolder, { name: 'Tech' })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId, folderId })

    expect(await bookmarkCount(t, userId)).toBe(1)
  })

  test('rejects a folder that belongs to another user', async () => {
    const t = convexTest(schema, modules)
    const alice = await seedUser(t, { clerkId: 'alice' })
    await seedUser(t, { clerkId: 'bob' })
    const podcastId = await seedPodcast(t, alice)

    const asAlice = t.withIdentity({ subject: 'alice' })
    const aliceFolder = await asAlice.mutation(api.bookmarks.createFolder, { name: 'Mine' })

    const asBob = t.withIdentity({ subject: 'bob' })
    await expect(
      asBob.mutation(api.bookmarks.addBookmark, { podcastId, folderId: aliceFolder }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'FOLDER_NOT_FOUND')
  })

  test('addBookmark with neither folderId nor newFolderName is rejected', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t)
    const podcastId = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await expect(
      asUser.mutation(api.bookmarks.addBookmark, { podcastId }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'FOLDER_REQUIRED')
  })
})

describe('addBookmark — create folder during the bookmark flow', () => {
  test('creates the folder then saves into it (one call)', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'free' })
    const podcastId = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.mutation(api.bookmarks.addBookmark, {
      podcastId,
      newFolderName: 'Listen Later',
    })

    expect(await folderCount(t, userId)).toBe(1)
    expect(await bookmarkCount(t, userId)).toBe(1)
  })

  test('reuses an existing folder of the same name (no duplicate folder)', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'free' })
    const p1 = await seedPodcast(t, userId)
    const p2 = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p1, newFolderName: 'Faves' })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p2, newFolderName: 'faves' })

    expect(await folderCount(t, userId)).toBe(1)
    expect(await bookmarkCount(t, userId)).toBe(2)
  })
})

describe('addBookmark — dedup within a folder', () => {
  test('saving the same podcast twice into the same folder is a no-op', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'free' })
    const podcastId = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const folderId = await asUser.mutation(api.bookmarks.createFolder, { name: 'Tech' })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId, folderId })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId, folderId })

    expect(await bookmarkCount(t, userId)).toBe(1)
  })

  test('the same podcast CAN be saved into two different folders', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'pro' })
    const podcastId = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const f1 = await asUser.mutation(api.bookmarks.createFolder, { name: 'A' })
    const f2 = await asUser.mutation(api.bookmarks.createFolder, { name: 'B' })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId, folderId: f1 })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId, folderId: f2 })

    expect(await bookmarkCount(t, userId)).toBe(2)
    // …but the toggle/usage sees it as a single saved podcast.
    const ids = await asUser.query(api.bookmarks.myBookmarkedIds, {})
    expect(ids).toEqual([podcastId])
  })
})

describe('Free-tier gate counts across all folders', () => {
  test('Free user at the limit (3 total, spread over folders) is rejected', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'free' })
    const p1 = await seedPodcast(t, userId)
    const p2 = await seedPodcast(t, userId)
    const p3 = await seedPodcast(t, userId)
    const p4 = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const f1 = await asUser.mutation(api.bookmarks.createFolder, { name: 'A' })
    const f2 = await asUser.mutation(api.bookmarks.createFolder, { name: 'B' })

    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p1, folderId: f1 })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p2, folderId: f1 })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p3, folderId: f2 })

    await expect(
      asUser.mutation(api.bookmarks.addBookmark, { podcastId: p4, folderId: f2 }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'BOOKMARK_LIMIT')

    expect(await bookmarkCount(t, userId)).toBe(3)
  })

  test('creating folders never counts toward the bookmark limit', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'free' })
    const podcastId = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    // Plenty of folders, zero bookmarks — still allowed to save 3.
    await asUser.mutation(api.bookmarks.createFolder, { name: 'A' })
    await asUser.mutation(api.bookmarks.createFolder, { name: 'B' })
    const f = await asUser.mutation(api.bookmarks.createFolder, { name: 'C' })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId, folderId: f })

    expect(await bookmarkCount(t, userId)).toBe(1)
  })

  test('Pro user is never gated (can exceed the free limit)', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'pro' })
    const ids = await Promise.all(
      Array.from({ length: 5 }, () => seedPodcast(t, userId)),
    )

    const asUser = t.withIdentity({ subject: 'user_1' })
    const folderId = await asUser.mutation(api.bookmarks.createFolder, { name: 'All' })
    for (const podcastId of ids) {
      await asUser.mutation(api.bookmarks.addBookmark, { podcastId, folderId })
    }

    expect(await bookmarkCount(t, userId)).toBe(5)
  })

  test('unauthenticated caller is rejected', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t)
    const podcastId = await seedPodcast(t, userId)

    await expect(
      t.mutation(api.bookmarks.addBookmark, { podcastId, newFolderName: 'X' }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'UNAUTHENTICATED')
  })
})

describe('removeBookmark', () => {
  test('removing from a single folder frees a slot for a Free user', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'free' })
    const p1 = await seedPodcast(t, userId)
    const p2 = await seedPodcast(t, userId)
    const p3 = await seedPodcast(t, userId)
    const p4 = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const folderId = await asUser.mutation(api.bookmarks.createFolder, { name: 'Tech' })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p1, folderId })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p2, folderId })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p3, folderId })

    // At the limit — remove one, then a new bookmark fits again.
    await asUser.mutation(api.bookmarks.removeBookmark, { podcastId: p1, folderId })
    expect(await bookmarkCount(t, userId)).toBe(2)

    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p4, folderId })
    expect(await bookmarkCount(t, userId)).toBe(3)
  })

  test('removing without a folderId unsaves the podcast from every folder', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'pro' })
    const podcastId = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const f1 = await asUser.mutation(api.bookmarks.createFolder, { name: 'A' })
    const f2 = await asUser.mutation(api.bookmarks.createFolder, { name: 'B' })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId, folderId: f1 })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId, folderId: f2 })
    expect(await bookmarkCount(t, userId)).toBe(2)

    await asUser.mutation(api.bookmarks.removeBookmark, { podcastId })
    expect(await bookmarkCount(t, userId)).toBe(0)
  })

  test('removing a podcast that was not bookmarked is a no-op', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'free' })
    const podcastId = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.mutation(api.bookmarks.removeBookmark, { podcastId })
    expect(await bookmarkCount(t, userId)).toBe(0)
  })
})

describe('deleteFolder cascades', () => {
  test('deleting a folder removes its bookmarks (freeing slots)', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'free' })
    const p1 = await seedPodcast(t, userId)
    const p2 = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const folderId = await asUser.mutation(api.bookmarks.createFolder, { name: 'Tech' })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p1, folderId })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p2, folderId })
    expect(await bookmarkCount(t, userId)).toBe(2)

    await asUser.mutation(api.bookmarks.deleteFolder, { folderId })
    expect(await bookmarkCount(t, userId)).toBe(0)
    expect(await folderCount(t, userId)).toBe(0)
  })

  test('deleting another user\'s folder is a no-op (not deleted)', async () => {
    const t = convexTest(schema, modules)
    const alice = await seedUser(t, { clerkId: 'alice' })
    await seedUser(t, { clerkId: 'bob' })

    const asAlice = t.withIdentity({ subject: 'alice' })
    const aliceFolder = await asAlice.mutation(api.bookmarks.createFolder, { name: 'Mine' })

    const asBob = t.withIdentity({ subject: 'bob' })
    await asBob.mutation(api.bookmarks.deleteFolder, { folderId: aliceFolder })

    expect(await folderCount(t, alice)).toBe(1)
  })
})

describe('renameFolder', () => {
  test('renames the caller\'s folder', async () => {
    const t = convexTest(schema, modules)
    await seedUser(t)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const folderId = await asUser.mutation(api.bookmarks.createFolder, { name: 'Old' })
    await asUser.mutation(api.bookmarks.renameFolder, { folderId, name: 'New' })

    const folders = await asUser.query(api.bookmarks.listMyFolders, {})
    expect(folders.find((f) => f._id === folderId)?.name).toBe('New')
  })

  test('rejects renaming to a name another folder already uses', async () => {
    const t = convexTest(schema, modules)
    await seedUser(t)

    const asUser = t.withIdentity({ subject: 'user_1' })
    await asUser.mutation(api.bookmarks.createFolder, { name: 'A' })
    const b = await asUser.mutation(api.bookmarks.createFolder, { name: 'B' })

    await expect(
      asUser.mutation(api.bookmarks.renameFolder, { folderId: b, name: 'a' }),
    ).rejects.toSatisfy((err: unknown) => errorCode(err) === 'FOLDER_NAME_TAKEN')
  })
})

describe('listMyFolders + listMyBookmarks + myBookmarkedIds scoping', () => {
  test('listMyFolders returns the caller\'s folders with counts', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t, { plan: 'pro' })
    const p1 = await seedPodcast(t, userId)
    const p2 = await seedPodcast(t, userId)

    const asUser = t.withIdentity({ subject: 'user_1' })
    const f1 = await asUser.mutation(api.bookmarks.createFolder, { name: 'A' })
    await asUser.mutation(api.bookmarks.createFolder, { name: 'B' })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p1, folderId: f1 })
    await asUser.mutation(api.bookmarks.addBookmark, { podcastId: p2, folderId: f1 })

    const folders = await asUser.query(api.bookmarks.listMyFolders, {})
    expect(folders.length).toBe(2)
    expect(folders.find((f) => f._id === f1)?.count).toBe(2)
    expect(folders.find((f) => f.name === 'B')?.count).toBe(0)
  })

  test('listMyBookmarks filters by folder and to ready, scoped per user', async () => {
    const t = convexTest(schema, modules)
    const alice = await seedUser(t, { clerkId: 'alice', plan: 'pro' })
    const bob = await seedUser(t, { clerkId: 'bob', plan: 'free' })

    const aliceReady = await seedPodcast(t, alice, 'ready')
    const alicePending = await seedPodcast(t, alice, 'pending')
    const bobReady = await seedPodcast(t, bob, 'ready')

    const asAlice = t.withIdentity({ subject: 'alice' })
    const asBob = t.withIdentity({ subject: 'bob' })

    const aFolder = await asAlice.mutation(api.bookmarks.createFolder, { name: 'A' })
    await asAlice.mutation(api.bookmarks.addBookmark, { podcastId: aliceReady, folderId: aFolder })
    await asAlice.mutation(api.bookmarks.addBookmark, { podcastId: alicePending, folderId: aFolder })

    const bFolder = await asBob.mutation(api.bookmarks.createFolder, { name: 'B' })
    await asBob.mutation(api.bookmarks.addBookmark, { podcastId: bobReady, folderId: bFolder })

    // Scoped to Alice's folder: only ready, only Alice's.
    const aliceList = await asAlice.query(api.bookmarks.listMyBookmarks, { folderId: aFolder })
    expect(aliceList.map((p) => p._id).sort()).toEqual([aliceReady].sort())

    // Unfiltered list also only returns ready ones.
    const aliceAll = await asAlice.query(api.bookmarks.listMyBookmarks, {})
    expect(aliceAll.map((p) => p._id).sort()).toEqual([aliceReady].sort())

    // myBookmarkedIds: both of Alice's ids (ready filter is list-only), none of Bob's.
    const aliceIds = await asAlice.query(api.bookmarks.myBookmarkedIds, {})
    expect(aliceIds.sort()).toEqual([aliceReady, alicePending].sort())
    expect(aliceIds).not.toContain(bobReady)

    // Bob sees only his own.
    const bobIds = await asBob.query(api.bookmarks.myBookmarkedIds, {})
    expect(bobIds).toEqual([bobReady])
  })

  test('returns [] for a signed-out caller', async () => {
    const t = convexTest(schema, modules)
    const userId = await seedUser(t)
    await seedPodcast(t, userId)

    expect(await t.query(api.bookmarks.listMyFolders, {})).toEqual([])
    expect(await t.query(api.bookmarks.listMyBookmarks, {})).toEqual([])
    expect(await t.query(api.bookmarks.myBookmarkedIds, {})).toEqual([])
  })
})
