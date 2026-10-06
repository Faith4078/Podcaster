import { v } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'

// ─── RSS distribution ───────────────────────────────────────────────────────
//
// Every creator is a "show": their ready episodes are published as a standard
// podcast RSS 2.0 feed (with iTunes tags) at  <site>/rss/<userId>.xml  so they
// can submit it to Apple Podcasts, Spotify, Pocket Casts, etc.
//
// Episode audio is referenced through <site>/audio/<podcastId>.<ext>, which
// records a download (rssDownloads — the only way to count feed downloads,
// since apps fetch the enclosure directly) and 302-redirects to the real file.

export type FeedEpisode = {
  id: string
  title: string
  description: string
  category: string
  transcript?: string
  publishedAt: number // ms epoch
  audioBytes?: number
  audioType: string // MIME type of the enclosure
  imageUrl?: string
}

export type FeedShow = {
  title: string
  description: string
  author: string
  email: string
  imageUrl?: string
  link: string
  feedUrl: string
  episodes: FeedEpisode[]
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Strip control chars that are illegal in XML 1.0 (keeps \t \n \r).
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}

export function audioExtension(mime: string): string {
  const m = mime.toLowerCase()
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3'
  if (m.includes('ogg')) return 'ogg'
  if (m.includes('aac') || m.includes('mp4') || m.includes('m4a')) return 'm4a'
  return 'wav'
}

export function buildFeedXml(show: FeedShow, audioBase: string): string {
  const items = show.episodes
    .map((e) => {
      const url = `${audioBase}/audio/${e.id}.${audioExtension(e.audioType)}`
      return [
        '    <item>',
        `      <title>${escapeXml(e.title)}</title>`,
        `      <description>${escapeXml(e.description || e.title)}</description>`,
        `      <itunes:summary>${escapeXml(e.description || e.title)}</itunes:summary>`,
        `      <guid isPermaLink="false">${escapeXml(e.id)}</guid>`,
        `      <pubDate>${new Date(e.publishedAt).toUTCString()}</pubDate>`,
        `      <enclosure url="${escapeXml(url)}" length="${e.audioBytes ?? 0}" type="${escapeXml(e.audioType)}"/>`,
        `      <itunes:explicit>false</itunes:explicit>`,
        e.imageUrl ? `      <itunes:image href="${escapeXml(e.imageUrl)}"/>` : '',
        e.transcript
          ? `      <content:encoded>${escapeXml(
              e.transcript
                .split(/\n{2,}/)
                .map((p) => `<p>${escapeXml(p.trim())}</p>`)
                .join(''),
            )}</content:encoded>`
          : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const category = show.episodes[0]?.category
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    `    <title>${escapeXml(show.title)}</title>`,
    `    <link>${escapeXml(show.link)}</link>`,
    `    <atom:link href="${escapeXml(show.feedUrl)}" rel="self" type="application/rss+xml"/>`,
    `    <description>${escapeXml(show.description)}</description>`,
    '    <language>en</language>',
    `    <itunes:author>${escapeXml(show.author)}</itunes:author>`,
    `    <itunes:owner><itunes:name>${escapeXml(show.author)}</itunes:name><itunes:email>${escapeXml(show.email)}</itunes:email></itunes:owner>`,
    '    <itunes:explicit>false</itunes:explicit>',
    category ? `    <itunes:category text="${escapeXml(category)}"/>` : '',
    show.imageUrl ? `    <itunes:image href="${escapeXml(show.imageUrl)}"/>` : '',
    items,
    '  </channel>',
    '</rss>',
    '',
  ]
    .filter((l) => l !== '')
    .join('\n')
}

// Internal: everything the feed needs for one creator, or null if the id isn't
// a user. Only `ready` episodes with audio are published.
export const feedData = internalQuery({
  args: { authorId: v.string() },
  handler: async (ctx, { authorId }) => {
    const id = ctx.db.normalizeId('users', authorId)
    if (!id) return null
    const user = await ctx.db.get(id)
    if (!user) return null

    const podcasts = await ctx.db
      .query('podcasts')
      .withIndex('by_author', (q) => q.eq('authorId', id))
      .filter((q) => q.eq(q.field('status'), 'ready'))
      .order('desc')
      .collect()

    const episodes: FeedEpisode[] = []
    for (const p of podcasts) {
      if (!p.audioStorageId && !p.audioUrl) continue
      let audioBytes: number | undefined
      let audioType = 'audio/wav' // the TTS step stores WAV
      if (p.audioStorageId) {
        try {
          const meta = await ctx.db.system.get('_storage', p.audioStorageId)
          audioBytes = meta?.size
          audioType = meta?.contentType ?? audioType
        } catch {
          // Metadata is best-effort; the feed is still valid with length=0.
        }
      }
      const imageUrl = p.thumbnailStorageId
        ? await ctx.storage.getUrl(p.thumbnailStorageId)
        : p.thumbnailUrl
      episodes.push({
        id: p._id,
        title: p.title,
        description: p.description,
        category: p.category,
        transcript: p.transcript,
        publishedAt: p._creationTime,
        audioBytes,
        audioType,
        imageUrl: imageUrl ?? undefined,
      })
    }

    return {
      userId: id as string,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      episodes,
    }
  },
})

// Internal: record an RSS download of an episode and return where to send the
// listener (the stored file's URL), or null if there's nothing to serve.
export const recordDownload = internalMutation({
  args: { podcastId: v.string() },
  handler: async (ctx, { podcastId }) => {
    const id = ctx.db.normalizeId('podcasts', podcastId)
    if (!id) return null
    const podcast = await ctx.db.get(id)
    if (!podcast || podcast.status !== 'ready') return null

    const url = podcast.audioStorageId
      ? await ctx.storage.getUrl(podcast.audioStorageId)
      : (podcast.audioUrl ?? null)
    if (!url) return null

    await ctx.db.insert('rssDownloads', { podcastId: id, authorId: podcast.authorId })
    return url
  },
})
