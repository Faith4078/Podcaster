import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),

    // Billing — mirrored from Clerk Billing via the webhook (http.ts).
    // Absent ⇒ free. The Convex generation gate reads this server-side.
    plan: v.optional(v.union(v.literal('free'), v.literal('pro'))),
    // Lifetime count of successful generations (absent ⇒ 0). Free users are
    // capped at 3; incremented idempotently when a podcast first reaches 'ready'.
    generationCount: v.optional(v.number()),
  }).index('by_clerk_id', ['clerkId']),

  // Token-bucket rate limiting for public, cost-incurring endpoints
  // (currently: semantic search, which embeds the query via Gemini).
  rateLimits: defineTable({
    key: v.string(),
    tokens: v.number(),
    lastRefill: v.number(),
  }).index('by_key', ['key']),

  // One row per (podcast, user) the first time that user plays a podcast, so
  // `listenerCount` reflects UNIQUE listeners rather than total plays/clicks.
  listens: defineTable({
    podcastId: v.id('podcasts'),
    userId: v.id('users'),
  }).index('by_podcast_user', ['podcastId', 'userId']),

  // A user's named bookmark collections. Every bookmark belongs to exactly one
  // folder. `by_user` lists a user's folders; `by_user_name` dedups folder names
  // per user (we lowercase the name into `nameLower` for case-insensitive dedup).
  // Folders are free to create — only the bookmarks inside them count toward the
  // Free-tier cap.
  bookmarkFolders: defineTable({
    userId: v.id('users'),
    name: v.string(),
    nameLower: v.string(),
  })
    .index('by_user', ['userId'])
    .index('by_user_name', ['userId', 'nameLower']),

  // One row per (user, podcast, folder) the user has saved into a collection.
  // `by_user` lists/counts ALL of a user's bookmarks (the Free-tier cap counts
  // across every folder); `by_user_podcast` powers the reactive toggle state
  // (saved anywhere?); `by_user_folder` lists a single folder's bookmarks.
  // Free users are capped at 3 total (FREE_BOOKMARK_LIMIT in convex/bookmarks.ts);
  // Pro is unlimited.
  bookmarks: defineTable({
    userId: v.id('users'),
    podcastId: v.id('podcasts'),
    // Optional ONLY for migration safety: every bookmark created by the app sets
    // a folder, but pre-folders rows (saved before this feature) have none, and a
    // required field would block the schema push against existing data. Folderless
    // rows simply don't appear under any folder.
    folderId: v.optional(v.id('bookmarkFolders')),
  })
    .index('by_user', ['userId'])
    .index('by_user_podcast', ['userId', 'podcastId'])
    .index('by_user_folder', ['userId', 'folderId']),

  // One row per (user, podcast) the user has downloaded. Deduped per podcast so
  // re-downloading the same episode is free; the Free-tier cap counts DISTINCT
  // podcasts downloaded (FREE_DOWNLOAD_LIMIT in convex/downloads.ts). Pro is
  // unlimited. `by_user` counts/lists a user's downloads; `by_user_podcast`
  // powers the "already downloaded?" dedup check.
  downloads: defineTable({
    userId: v.id('users'),
    podcastId: v.id('podcasts'),
  })
    .index('by_user', ['userId'])
    .index('by_user_podcast', ['userId', 'podcastId']),

  podcasts: defineTable({
    // Core metadata
    title: v.string(),
    description: v.string(),
    category: v.string(),
    authorId: v.id('users'),

    // AI generation inputs
    topicPrompt: v.string(),
    speaker1Voice: v.string(),

    // Generated outputs
    transcript: v.optional(v.string()),
    audioStorageId: v.optional(v.id('_storage')),
    audioUrl: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id('_storage')),
    thumbnailUrl: v.optional(v.string()),
    thumbnailPrompt: v.optional(v.string()),

    // Vector embedding for semantic search
    embedding: v.optional(v.array(v.float64())),

    // Pipeline state
    status: v.union(
      v.literal('pending'),
      v.literal('generating'),
      v.literal('ready'),
      v.literal('failed')
    ),
    failedStep: v.optional(v.string()),
    errorMsg: v.optional(v.string()),

    // Engagement
    listenerCount: v.number(),

    // Billing — idempotent quota marker. Set true the first time this podcast
    // reaches 'ready' (and its author's generationCount is incremented), so the
    // shared ready-step counter never double-counts across retry/edit re-runs.
    countedTowardQuota: v.optional(v.boolean()),
  })
    .index('by_author', ['authorId'])
    .index('by_status', ['status'])
    .index('by_listener_count', ['listenerCount'])
    .searchIndex('search_title', { searchField: 'title', filterFields: ['category'] })
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 768,
      filterFields: ['category'],
    }),
})
