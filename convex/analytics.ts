import { v } from 'convex/values'
import { query } from './_generated/server'

const DAY_MS = 24 * 60 * 60 * 1000

// UTC calendar day key, e.g. "2026-10-05". Buckets are UTC so the server and
// every viewer agree on which day an event belongs to.
function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

// Zero-filled list of the last `days` day keys, oldest first (today last).
export function lastDays(now: number, days: number): string[] {
  const keys: string[] = []
  for (let i = days - 1; i >= 0; i--) keys.push(dayKey(now - i * DAY_MS))
  return keys
}

// Creator analytics for the signed-in user: audience, feed downloads and
// engagement across all of their ready episodes. Strictly scoped to the caller's
// own podcasts (identity-derived, never a client-supplied author id).
//
// Each creator has few episodes (per-user lifetime generation caps), so the
// per-episode index reads below stay small. Time series use range scans on the
// implicit _creationTime suffix of the by_podcast indexes.
export const myOverview = query({
  args: {
    days: v.optional(v.number()),
    // The viewer's current UTC day (YYYY-MM-DD). A query only re-runs when its
    // data or arguments change, so without this a quiet account would keep
    // showing yesterday's window after midnight. The page updates it at UTC
    // midnight, which re-runs the query.
    today: v.optional(v.string()),
  },
  handler: async (ctx, { days: requestedDays, today }) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return null

    const days = Math.min(Math.max(Math.floor(requestedDays ?? 30), 1), 90)
    // Anchor the window on the viewer's day, but only trust it within two days of
    // the server clock so a wrong device clock can't hide recent activity.
    const serverNow = Date.now()
    const claimed = today && /^\d{4}-\d{2}-\d{2}$/.test(today) ? Date.parse(`${today}T23:59:59.999Z`) : NaN
    const now = Math.abs(claimed - serverNow) <= 2 * DAY_MS ? claimed : serverNow
    const keys = lastDays(now, days)
    const since = new Date(`${keys[0]}T00:00:00.000Z`).getTime()

    const podcasts = await ctx.db
      .query('podcasts')
      .withIndex('by_author', (q) => q.eq('authorId', user._id))
      .collect()
    const ready = podcasts.filter((p) => p.status === 'ready')

    const series = new Map(keys.map((k) => [k, { date: k, listeners: 0, rssDownloads: 0 }]))
    const sevenDaysAgo = now - 7 * DAY_MS

    const episodes = await Promise.all(
      ready.map(async (p) => {
        const [listens, rss, rssTotal, bookmarks, appDownloads] = await Promise.all([
          ctx.db
            .query('listens')
            .withIndex('by_podcast', (q) => q.eq('podcastId', p._id).gte('_creationTime', since))
            .collect(),
          ctx.db
            .query('rssDownloads')
            .withIndex('by_podcast', (q) => q.eq('podcastId', p._id).gte('_creationTime', since))
            .collect(),
          ctx.db
            .query('rssDownloads')
            .withIndex('by_podcast', (q) => q.eq('podcastId', p._id))
            .collect(),
          ctx.db
            .query('bookmarks')
            .withIndex('by_podcast', (q) => q.eq('podcastId', p._id))
            .collect(),
          ctx.db
            .query('downloads')
            .withIndex('by_podcast', (q) => q.eq('podcastId', p._id))
            .collect(),
        ])

        for (const l of listens) {
          const bucket = series.get(dayKey(l._creationTime))
          if (bucket) bucket.listeners++
        }
        for (const r of rss) {
          const bucket = series.get(dayKey(r._creationTime))
          if (bucket) bucket.rssDownloads++
        }

        return {
          id: p._id,
          title: p.title,
          category: p.category,
          publishedAt: p._creationTime,
          listeners: p.listenerCount,
          listenersInRange: listens.length,
          listenersLast7Days: listens.filter((l) => l._creationTime >= sevenDaysAgo).length,
          rssDownloads: rssTotal.length,
          rssDownloadsInRange: rss.length,
          // Distinct users who saved the episode (a user can save it to several folders).
          bookmarks: new Set(bookmarks.map((b) => b.userId)).size,
          appDownloads: appDownloads.length,
        }
      }),
    )

    episodes.sort((a, b) => b.listeners - a.listeners || b.rssDownloads - a.rssDownloads)

    const sum = (f: (e: (typeof episodes)[number]) => number) =>
      episodes.reduce((total, e) => total + f(e), 0)

    return {
      userId: user._id,
      days,
      totals: {
        episodes: ready.length,
        listeners: sum((e) => e.listeners),
        listenersInRange: sum((e) => e.listenersInRange),
        rssDownloads: sum((e) => e.rssDownloads),
        rssDownloadsInRange: sum((e) => e.rssDownloadsInRange),
        bookmarks: sum((e) => e.bookmarks),
        appDownloads: sum((e) => e.appDownloads),
      },
      series: [...series.values()],
      episodes,
    }
  },
})
