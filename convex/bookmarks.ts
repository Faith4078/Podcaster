import { ConvexError, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'

// Free users may keep up to this many bookmarks TOTAL, across all folders. The
// gate (addBookmark) and the usage/upgrade UI both key off this number. Pro is
// unlimited. Folders themselves are free to create — only the bookmarks inside
// them count. Mirrors the shape of FREE_GENERATION_LIMIT in convex/podcasts.ts.
export const FREE_BOOKMARK_LIMIT = 3

// ─── Auth helper ─────────────────────────────────────────────────────────────

// Resolve the current user from the authenticated Clerk identity (NOT a
// client-supplied id) so bookmarks/folders can't be written on another user's
// behalf. Mirrors requireProUser / the generatePodcast gate in convex/podcasts.ts.
async function requireUser(ctx: QueryCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError({ code: 'UNAUTHENTICATED' })
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .unique()
  if (!user) throw new ConvexError({ code: 'UNAUTHENTICATED' })
  return user
}

// Resolve media URLs + author for a podcast — the same hydrated shape the home /
// discover feeds use (mirrors withAuthorAndMedia in convex/podcasts.ts, which is
// not exported).
async function withAuthorAndMedia(ctx: QueryCtx, podcast: Doc<'podcasts'>) {
  const audioUrl = podcast.audioStorageId
    ? await ctx.storage.getUrl(podcast.audioStorageId)
    : podcast.audioUrl
  const thumbnailUrl = podcast.thumbnailStorageId
    ? await ctx.storage.getUrl(podcast.thumbnailStorageId)
    : podcast.thumbnailUrl
  const author = await ctx.db.get(podcast.authorId)
  return {
    ...podcast,
    audioUrl: audioUrl ?? undefined,
    thumbnailUrl: thumbnailUrl ?? undefined,
    author,
  }
}

// Find a user's folder by name, case-insensitively (used to dedup folder names
// per user). Returns the existing folder doc or null.
async function findFolderByName(
  ctx: QueryCtx,
  userId: Id<'users'>,
  nameLower: string,
): Promise<Doc<'bookmarkFolders'> | null> {
  return ctx.db
    .query('bookmarkFolders')
    .withIndex('by_user_name', (q) =>
      q.eq('userId', userId).eq('nameLower', nameLower),
    )
    .unique()
}

// Create (or reuse) a folder for this user. Server-authoritative — owner is the
// resolved user, never a client id. Rejects empty/whitespace names; dedups by
// case-insensitive name so the same folder isn't created twice. Returns the id.
async function ensureFolder(
  ctx: MutationCtx,
  userId: Id<'users'>,
  name: string,
): Promise<Id<'bookmarkFolders'>> {
  const trimmed = name.trim()
  if (!trimmed) throw new ConvexError({ code: 'INVALID_FOLDER_NAME' })
  const nameLower = trimmed.toLowerCase()

  const existing = await findFolderByName(ctx, userId, nameLower)
  if (existing) return existing._id

  return ctx.db.insert('bookmarkFolders', { userId, name: trimmed, nameLower })
}

// ─── Queries ─────────────────────────────────────────────────────────────────

// The current user's folders, each with a bookmark count, newest first. The
// count drives the per-folder "N saved" labels in the UI. Returns [] when signed
// out.
export const listMyFolders = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    const folders = await ctx.db
      .query('bookmarkFolders')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .collect()

    return Promise.all(
      folders.map(async (folder) => {
        const inFolder = await ctx.db
          .query('bookmarks')
          .withIndex('by_user_folder', (q) =>
            q.eq('userId', user._id).eq('folderId', folder._id),
          )
          .collect()
        return { _id: folder._id, name: folder.name, count: inFolder.length }
      }),
    )
  },
})

// The current user's saved podcasts, hydrated like the other feeds. Pass a
// `folderId` to scope to a single folder; omit it for every folder. Only `ready`
// podcasts are surfaced (a bookmarked podcast that was deleted or is mid-generation
// simply drops out of the list). Returns [] when signed out.
export const listMyBookmarks = query({
  args: { folderId: v.optional(v.id('bookmarkFolders')) },
  handler: async (ctx, { folderId }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    const rows = folderId
      ? await ctx.db
          .query('bookmarks')
          .withIndex('by_user_folder', (q) =>
            q.eq('userId', user._id).eq('folderId', folderId),
          )
          .order('desc')
          .collect()
      : await ctx.db
          .query('bookmarks')
          .withIndex('by_user', (q) => q.eq('userId', user._id))
          .order('desc')
          .collect()

    const podcasts = await Promise.all(rows.map((b) => ctx.db.get(b.podcastId)))
    const ready = podcasts.filter(
      (p): p is Doc<'podcasts'> => p !== null && p.status === 'ready',
    )
    return Promise.all(ready.map((p) => withAuthorAndMedia(ctx, p)))
  },
})

// The current user's bookmarked podcast ids (saved in ANY folder) — lets the UI
// render toggle state reactively (and show "N/3 used") without hydrating every
// podcast. A podcast saved in multiple folders appears once. Returns [] when
// signed out.
export const myBookmarkedIds = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    const rows = await ctx.db
      .query('bookmarks')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
    // Dedup — the same podcast can live in several folders, but the toggle/usage
    // copy treats "saved" as a single boolean per podcast.
    return [...new Set(rows.map((b) => b.podcastId))]
  },
})

// ─── Mutations ───────────────────────────────────────────────────────────────

// Create a named folder for the current user. Server-authoritative; dedups by
// case-insensitive name (returns the existing folder's id rather than erroring);
// rejects empty/whitespace. Creating a folder is always free — no quota gate.
export const createFolder = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const user = await requireUser(ctx)
    return ensureFolder(ctx, user._id, name)
  },
})

// Save a podcast into a folder for the current user. Supports two flows in one
// call: "save to existing folder" (pass `folderId`) and "create-then-save" (pass
// `newFolderName` — the folder is created/reused, then the podcast is saved into
// it). Mirrors the generatePodcast quota gate: identity resolves the user, dedup
// makes it a no-op if already in that folder, and a Free user at
// FREE_BOOKMARK_LIMIT (counted across ALL folders) is rejected with a typed
// ConvexError (the UI surfaces the upgrade nudge instead of a raw error).
export const addBookmark = mutation({
  args: {
    podcastId: v.id('podcasts'),
    folderId: v.optional(v.id('bookmarkFolders')),
    newFolderName: v.optional(v.string()),
  },
  handler: async (ctx, { podcastId, folderId, newFolderName }) => {
    const user = await requireUser(ctx)

    // Resolve the destination folder. Exactly one of folderId / newFolderName is
    // expected; folderId wins if both are somehow supplied.
    let targetFolderId: Id<'bookmarkFolders'>
    if (folderId) {
      const folder = await ctx.db.get(folderId)
      if (!folder || folder.userId !== user._id) {
        throw new ConvexError({ code: 'FOLDER_NOT_FOUND' })
      }
      targetFolderId = folder._id
    } else if (newFolderName !== undefined) {
      targetFolderId = await ensureFolder(ctx, user._id, newFolderName)
    } else {
      throw new ConvexError({ code: 'FOLDER_REQUIRED' })
    }

    // Dedup within the folder — no-op if this (user, podcast) is already saved in
    // this folder, so a double tap or a race never inserts twice or over-counts.
    const inFolder = await ctx.db
      .query('bookmarks')
      .withIndex('by_user_folder', (q) =>
        q.eq('userId', user._id).eq('folderId', targetFolderId),
      )
      .collect()
    if (inFolder.some((b) => b.podcastId === podcastId)) return targetFolderId

    // Free-tier gate counts TOTAL bookmarks across every folder. Saving a podcast
    // already saved in another folder still counts as a new row toward the cap.
    const isPro = user.plan === 'pro'
    if (!isPro) {
      const all = await ctx.db
        .query('bookmarks')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect()
      if (all.length >= FREE_BOOKMARK_LIMIT) {
        throw new ConvexError({ code: 'BOOKMARK_LIMIT' })
      }
    }

    await ctx.db.insert('bookmarks', {
      userId: user._id,
      podcastId,
      folderId: targetFolderId,
    })
    return targetFolderId
  },
})

// Remove a saved podcast. Pass `folderId` to remove it from a single folder;
// omit it to remove the podcast from EVERY folder (the toggle "unsave" path).
// No-op for anything that wasn't saved.
export const removeBookmark = mutation({
  args: {
    podcastId: v.id('podcasts'),
    folderId: v.optional(v.id('bookmarkFolders')),
  },
  handler: async (ctx, { podcastId, folderId }) => {
    const user = await requireUser(ctx)

    const rows = await ctx.db
      .query('bookmarks')
      .withIndex('by_user_podcast', (q) =>
        q.eq('userId', user._id).eq('podcastId', podcastId),
      )
      .collect()

    const toDelete = folderId
      ? rows.filter((b) => b.folderId === folderId)
      : rows
    await Promise.all(toDelete.map((b) => ctx.db.delete(b._id)))
  },
})

// Rename one of the current user's folders. Owner-checked; rejects empty names
// and a name that collides (case-insensitively) with a DIFFERENT folder.
export const renameFolder = mutation({
  args: { folderId: v.id('bookmarkFolders'), name: v.string() },
  handler: async (ctx, { folderId, name }) => {
    const user = await requireUser(ctx)
    const folder = await ctx.db.get(folderId)
    if (!folder || folder.userId !== user._id) {
      throw new ConvexError({ code: 'FOLDER_NOT_FOUND' })
    }
    const trimmed = name.trim()
    if (!trimmed) throw new ConvexError({ code: 'INVALID_FOLDER_NAME' })
    const nameLower = trimmed.toLowerCase()

    const clash = await findFolderByName(ctx, user._id, nameLower)
    if (clash && clash._id !== folder._id) {
      throw new ConvexError({ code: 'FOLDER_NAME_TAKEN' })
    }
    await ctx.db.patch(folder._id, { name: trimmed, nameLower })
  },
})

// Delete one of the current user's folders. Cascades — every bookmark inside the
// folder is removed too (freeing those slots toward the Free-tier cap). No-op for
// a folder that isn't the caller's.
export const deleteFolder = mutation({
  args: { folderId: v.id('bookmarkFolders') },
  handler: async (ctx, { folderId }) => {
    const user = await requireUser(ctx)
    const folder = await ctx.db.get(folderId)
    if (!folder || folder.userId !== user._id) return

    const inFolder = await ctx.db
      .query('bookmarks')
      .withIndex('by_user_folder', (q) =>
        q.eq('userId', user._id).eq('folderId', folder._id),
      )
      .collect()
    await Promise.all(inFolder.map((b) => ctx.db.delete(b._id)))
    await ctx.db.delete(folder._id)
  },
})
