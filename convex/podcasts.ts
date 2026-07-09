import { GoogleGenerativeAI } from '@google/generative-ai'
import { ConvexError, v } from 'convex/values'
import type { Doc, Id } from './_generated/dataModel'
import { api, internal } from './_generated/api'
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import type { ActionCtx, QueryCtx } from './_generated/server'

// Free users may keep up to this many lifetime *successful* generations. The
// gate (generatePodcast) and the wall UI both key off this number.
export const FREE_GENERATION_LIMIT = 3

// Pro users may keep up to this many lifetime *successful* generations. The
// gate (generatePodcast) keys off this number.
export const PRO_GENERATION_LIMIT = 7

// ─── Queries ────────────────────────────────────────────────────────────────

// A podcast with media URLs resolved and its author joined — the shape returned
// by `withAuthorAndMedia`. Declared explicitly so the vector-search actions can
// annotate their return type and avoid circular `api` type inference.
type HydratedPodcast = Omit<Doc<'podcasts'>, 'audioUrl' | 'thumbnailUrl'> & {
  audioUrl?: string
  thumbnailUrl?: string
  author: Doc<'users'> | null
}

async function resolveMediaUrls(
  ctx: Pick<QueryCtx, 'storage'>,
  podcast: Doc<'podcasts'>,
) {
  const audioUrl = podcast.audioStorageId
    ? await ctx.storage.getUrl(podcast.audioStorageId)
    : podcast.audioUrl
  const thumbnailUrl = podcast.thumbnailStorageId
    ? await ctx.storage.getUrl(podcast.thumbnailStorageId)
    : podcast.thumbnailUrl
  return {
    ...podcast,
    audioUrl: audioUrl ?? undefined,
    thumbnailUrl: thumbnailUrl ?? undefined,
  }
}

async function withAuthorAndMedia(ctx: QueryCtx, podcast: Doc<'podcasts'>) {
  const author = await ctx.db.get(podcast.authorId)
  const withMedia = await resolveMediaUrls(ctx, podcast)
  return { ...withMedia, author }
}

export const getById = query({
  args: { id: v.id('podcasts') },
  handler: async (ctx, { id }) => {
    const podcast = await ctx.db.get(id)
    if (!podcast) return null
    return withAuthorAndMedia(ctx, podcast)
  },
})

export const getLatest = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const podcasts = await ctx.db
      .query('podcasts')
      .filter((q) => q.eq(q.field('status'), 'ready'))
      .order('desc')
      .take(limit)
    return Promise.all(podcasts.map((p) => withAuthorAndMedia(ctx, p)))
  },
})

export const getPopular = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 20 }) => {
    const podcasts = await ctx.db
      .query('podcasts')
      .withIndex('by_listener_count')
      .filter((q) => q.eq(q.field('status'), 'ready'))
      .order('desc')
      .take(limit)
    return Promise.all(podcasts.map((p) => withAuthorAndMedia(ctx, p)))
  },
})

export const getTrending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const podcasts = await ctx.db
      .query('podcasts')
      .filter((q) =>
        q.and(q.eq(q.field('status'), 'ready'), q.gte(q.field('_creationTime'), sevenDaysAgo))
      )
      .order('desc')
      .take(limit)
    const sorted = podcasts.sort((a, b) => b.listenerCount - a.listenerCount)
    return Promise.all(sorted.map((p) => withAuthorAndMedia(ctx, p)))
  },
})

export const getByAuthor = query({
  args: { authorId: v.id('users') },
  handler: async (ctx, { authorId }) => {
    const podcasts = await ctx.db
      .query('podcasts')
      .withIndex('by_author', (q) => q.eq('authorId', authorId))
      .filter((q) => q.eq(q.field('status'), 'ready'))
      .order('desc')
      .collect()
    return Promise.all(podcasts.map((p) => resolveMediaUrls(ctx, p)))
  },
})

// Internal: load podcasts by id, preserving the given order (vector-search rank),
// keeping only `ready` ones, with author + media resolved. Used by the
// vector-search actions, which can only return ids + scores themselves.
export const getReadyByIds = internalQuery({
  args: { ids: v.array(v.id('podcasts')) },
  handler: async (ctx, { ids }) => {
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)))
    const ready = docs.filter(
      (d): d is Doc<'podcasts'> => d !== null && d.status === 'ready',
    )
    return Promise.all(ready.map((p) => withAuthorAndMedia(ctx, p)))
  },
})

// Internal: all `ready` podcasts whose category matches (case-insensitive),
// author + media resolved. Powers the category-browse half of hybridSearch: a
// query that IS a category name ("business") is a browse intent, and these are
// its exact answers regardless of similarity scores. No `by_category` index —
// the ready set is small (per-user lifetime caps), so an in-code filter over
// `by_status` is fine.
export const getReadyByCategory = internalQuery({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const lower = category.toLowerCase()
    const ready = await ctx.db
      .query('podcasts')
      .withIndex('by_status', (q) => q.eq('status', 'ready'))
      .collect()
    const inCategory = ready.filter((p) => p.category.toLowerCase() === lower)
    return Promise.all(inCategory.map((p) => withAuthorAndMedia(ctx, p)))
  },
})

// Trivial words carry no search signal and only dilute a full-text query
// ("the startup" should match on "startup"). We strip them before the keyword
// search so short, intent-y queries still land on the meaningful tokens.
//
// The second row is DOMAIN filler — words users naturally include ("a podcast
// about …") that appear in unrelated titles too ("A podcast about air india
// crash"). Left in, they made the keyword half match across topics, so a query
// like "podcast about starting a business" surfaced plane-crash/health episodes.
// Stripping them leaves only the meaningful tokens ("starting business").
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'for', 'how', 'if',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was',
  'what', 'when', 'why', 'will', 'with',
  'about', 'podcast', 'podcasts', 'episode', 'episodes', 'show', 'shows',
  'talk', 'talks', 'listen', 'listening',
])

// Drop stop words from a query, returning the cleaned string. If the query is
// nothing BUT stop words (e.g. "is it the"), there is no meaningful token
// left to search on — return '' so the caller treats it as a no-match rather
// than falling back to the raw stop words, which would match almost any
// title on trivial substring overlap ("is" inside "Is it for weight loss").
function stripStopWords(query: string): string {
  const trimmed = query.trim()
  const kept = trimmed
    .split(/\s+/)
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w.toLowerCase()))
  return kept.join(' ')
}

// Convex's search index is fuzzy/typo-tolerant and returns its best 8 matches
// even when none of them are genuinely relevant — so a "saas development"
// query can still surface a plane-crash episode purely on loose token overlap.
// This enforces literal keyword semantics on top of the fuzzy index: a result
// only counts as a "keyword match" if its title actually contains one of the
// cleaned query tokens (substring, case-insensitive — so "develop" still
// matches "developer").
function titleContainsAnyToken(title: string, tokens: string[]): boolean {
  const lower = title.toLowerCase()
  return tokens.some((t) => t.length > 0 && lower.includes(t.toLowerCase()))
}

// A single fixed cosine-similarity cutoff is fragile: what counts as "clearly
// relevant" shifts with how the query is phrased, so a flat 0.6 either lets
// off-topic near-misses through (e.g. a SaaS episode sneaking into a "health
// related podcasts" search) or clips real matches on a differently-worded
// query. Instead we anchor to the TOP score for this query and only keep
// matches within a margin of it — same topic as the best hit — with an
// absolute floor so a query with no good matches doesn't return the "least
// bad" ones. Both knobs stay env-configurable for tuning against real data.
function filterRelevantMatches<T extends { _score: number }>(matches: T[]): T[] {
  if (matches.length === 0) return matches
  const floor = Number(process.env.GEMINI_SEARCH_MIN_SCORE ?? 0.6)
  const margin = Number(process.env.GEMINI_SEARCH_SCORE_MARGIN ?? 0.15)
  const topScore = Math.max(...matches.map((m) => m._score))
  const cutoff = Math.max(floor, topScore - margin)
  return matches.filter((m) => m._score >= cutoff)
}

// Public: literal KEYWORD search over podcast titles via the full-text
// `search_title` index. This is a plain query (no Gemini), so it's cheap and
// reactive-friendly; the hybrid action runs it alongside the vector search.
// Returns only `ready` podcasts, author + media resolved (same shape as
// getLatest / getReadyByIds).
export const searchPodcasts = query({
  args: { query: v.string(), category: v.optional(v.string()) },
  handler: async (ctx, { query, category }) => {
    const cleaned = stripStopWords(query)
    if (!cleaned) return []
    const tokens = cleaned.split(/\s+/).filter(Boolean)

    const matches = await ctx.db
      .query('podcasts')
      .withSearchIndex('search_title', (q) => {
        const search = q.search('title', cleaned)
        // `filterFields` on a search index combine as equality refinements; only
        // add the category constraint when a filter is actually requested.
        return category ? search.eq('category', category) : search
      })
      // Keep the keyword half tight: only the most relevant title matches. The
      // semantic half (vector search) supplies the broader meaning-based results,
      // so a small cap here avoids low-relevance literal matches diluting the list.
      .take(8)

    // Fuzzy index match isn't the same as a real keyword match — require the
    // title to actually contain one of the query's tokens (see
    // titleContainsAnyToken above) so off-topic fuzzy hits don't ride along.
    const ready = matches.filter(
      (p) => p.status === 'ready' && titleContainsAnyToken(p.title, tokens),
    )
    return Promise.all(ready.map((p) => withAuthorAndMedia(ctx, p)))
  },
})

// ─── Mutations ───────────────────────────────────────────────────────────────

export const create = mutation({
  args: {
    title:           v.string(),
    description:     v.string(),
    category:        v.string(),
    topicPrompt:     v.string(),
    speaker1Voice:   v.string(),
    thumbnailPrompt: v.optional(v.string()),
    authorId:        v.id('users'),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('podcasts', {
      ...args,
      status: 'pending',
      listenerCount: 0,
    })
    return id
  },
})

// Record a QUALIFYING listen. The client (MiniPlayer) calls this once per
// podcast/session, only after 30 seconds of ACTUAL accumulated playback —
// never on click/play-start (see LISTEN_THRESHOLD_SECONDS in playerStore).
export const incrementListeners = mutation({
  args: { id: v.id('podcasts') },
  handler: async (ctx, { id }) => {
    // Count UNIQUE listeners, not plays. Resolve the signed-in user and record a
    // one-time listen per (podcast, user); only the first listen bumps the count,
    // so replaying or reopening the same podcast no longer inflates it.
    // Anonymous plays (no identity) silently no-op — a signed-out user must
    // never see playback break because a listen couldn't be recorded.
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return

    const alreadyListened = await ctx.db
      .query('listens')
      .withIndex('by_podcast_user', (q) => q.eq('podcastId', id).eq('userId', user._id))
      .unique()
    if (alreadyListened) return

    const podcast = await ctx.db.get(id)
    if (!podcast) return
    await ctx.db.insert('listens', { podcastId: id, userId: user._id })
    await ctx.db.patch(id, { listenerCount: podcast.listenerCount + 1 })
  },
})

export const deletePodcast = mutation({
  args: { id: v.id('podcasts'), authorId: v.id('users') },
  handler: async (ctx, { id, authorId }) => {
    const podcast = await ctx.db.get(id)
    if (!podcast || podcast.authorId !== authorId) throw new Error('Unauthorized')
    await ctx.db.delete(id)
  },
})

export const updatePodcast = mutation({
  args: {
    id:           v.id('podcasts'),
    authorId:     v.id('users'),
    title:        v.optional(v.string()),
    description:  v.optional(v.string()),
    category:     v.optional(v.string()),
    topicPrompt:  v.optional(v.string()),
    speaker1Voice: v.optional(v.string()),
  },
  handler: async (ctx, { id, authorId, ...patch }) => {
    const podcast = await ctx.db.get(id)
    if (!podcast || podcast.authorId !== authorId) throw new Error('Unauthorized')
    await ctx.db.patch(id, { ...patch, status: 'pending' })
  },
})

// Internal: apply an edit, optionally clearing generated fields for re-run
export const applyEdit = internalMutation({
  args: {
    id:              v.id('podcasts'),
    authorId:        v.id('users'),
    title:           v.optional(v.string()),
    description:     v.optional(v.string()),
    category:        v.optional(v.string()),
    topicPrompt:     v.optional(v.string()),
    speaker1Voice:   v.optional(v.string()),
    thumbnailPrompt: v.optional(v.string()),
    needsRegeneration: v.boolean(),
  },
  handler: async (ctx, { id, authorId, needsRegeneration, ...fields }) => {
    const podcast = await ctx.db.get(id)
    if (!podcast || podcast.authorId !== authorId) throw new Error('Unauthorized')

    const patch: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val
    }

    if (needsRegeneration) {
      patch.status = 'pending'
      patch.transcript = undefined // clear so pipeline re-generates
      patch.audioUrl = undefined
      patch.audioStorageId = undefined
      patch.thumbnailUrl = undefined
      patch.thumbnailStorageId = undefined
      patch.embedding = undefined
    }

    await ctx.db.patch(id, patch)
  },
})

// Public: edit metadata + selectively re-run the generation pipeline
export const editAndRegenerate = action({
  args: {
    id:              v.id('podcasts'),
    authorId:        v.id('users'),
    title:           v.optional(v.string()),
    description:     v.optional(v.string()),
    category:        v.optional(v.string()),
    topicPrompt:     v.optional(v.string()),
    speaker1Voice:   v.optional(v.string()),
    thumbnailPrompt: v.optional(v.string()),
    needsRegeneration: v.boolean(),
  },
  handler: async (ctx, { needsRegeneration, ...rest }) => {
    await ctx.runMutation(internal.podcasts.applyEdit, { needsRegeneration, ...rest })
    if (needsRegeneration) {
      // Background (scheduled) — see generatePodcast for rationale.
      await ctx.scheduler.runAfter(0, internal.podcasts.runPipeline, { podcastId: rest.id })
    }
  },
})

// Internal: set pipeline status
export const setPipelineStatus = internalMutation({
  args: {
    id: v.id('podcasts'),
    status: v.union(v.literal('generating'), v.literal('ready'), v.literal('failed')),
    failedStep: v.optional(v.string()),
    errorMsg: v.optional(v.string()),
  },
  handler: async (ctx, { id, ...patch }) => ctx.db.patch(id, patch),
})

// Internal: flip a podcast to `ready` and idempotently charge its author one
// generation slot. This is the SINGLE point where status becomes 'ready', shared
// by generatePodcast (fresh) / retryGeneration (after failure) / editAndRegenerate.
// The `countedTowardQuota` marker makes it count exactly once across all paths:
//   fresh success → counts once; failure → never reaches here, costs nothing;
//   retry-after-failure → counts once; edit/regenerate of an already-counted
//   podcast → marker already set, no re-count.
export const markReadyAndCount = internalMutation({
  args: { id: v.id('podcasts') },
  handler: async (ctx, { id }) => {
    const podcast = await ctx.db.get(id)
    if (!podcast) return

    if (!podcast.countedTowardQuota) {
      const author = await ctx.db.get(podcast.authorId)
      if (author) {
        await ctx.db.patch(author._id, {
          generationCount: (author.generationCount ?? 0) + 1,
        })
      }
      await ctx.db.patch(id, { status: 'ready', countedTowardQuota: true })
    } else {
      await ctx.db.patch(id, { status: 'ready' })
    }
  },
})

export const saveGeneratedFields = internalMutation({
  args: {
    id: v.id('podcasts'),
    transcript: v.optional(v.string()),
    audioUrl: v.optional(v.string()),
    audioStorageId: v.optional(v.id('_storage')),
    thumbnailUrl: v.optional(v.string()),
    thumbnailStorageId: v.optional(v.id('_storage')),
    embedding: v.optional(v.array(v.float64())),
  },
  handler: async (ctx, { id, ...fields }) => ctx.db.patch(id, fields),
})

// ─── Voice map + WAV helper (used by TTS pipeline step) ─────────────────────

const GEMINI_VOICE_MAP: Record<string, string> = {
  alloy:   'Kore',
  echo:    'Puck',
  fable:   'Charon',
  onyx:    'Fenrir',
  nova:    'Leda',
  shimmer: 'Aoede',
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

function writeAscii(bytes: Uint8Array, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    bytes[offset + i] = str.charCodeAt(i)
  }
}

function pcmToWav(
  pcmData: Uint8Array,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16,
): Uint8Array {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8
  const blockAlign = (channels * bitsPerSample) / 8
  const dataSize = pcmData.length
  const wav = new Uint8Array(44 + dataSize)
  const view = new DataView(wav.buffer)

  writeAscii(wav, 0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeAscii(wav, 8, 'WAVE')
  writeAscii(wav, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitsPerSample, true)
  writeAscii(wav, 36, 'data')
  view.setUint32(40, dataSize, true)
  wav.set(pcmData, 44)
  return wav
}

function parseSampleRateFromMime(mimeType: string): number {
  const match = mimeType.match(/rate=(\d+)/i)
  return match ? Number(match[1]) : 24000
}

function audioInlineDataToBlob(mimeType: string, base64Data: string): Blob {
  const bytes = base64ToBytes(base64Data)
  const normalized = mimeType.toLowerCase()
  if (normalized.includes('wav')) {
    return new Blob([new Uint8Array(bytes)], { type: 'audio/wav' })
  }
  if (normalized.includes('mpeg') || normalized.includes('mp3')) {
    return new Blob([new Uint8Array(bytes)], { type: 'audio/mpeg' })
  }
  if (normalized.includes('ogg')) {
    return new Blob([new Uint8Array(bytes)], { type: mimeType })
  }
  const wav = pcmToWav(bytes, parseSampleRateFromMime(mimeType))
  return new Blob([new Uint8Array(wav)], { type: 'audio/wav' })
}

// A 429 whose retry-after is longer than this isn't a transient blip — it's a hard
// tier/quota limit (free-tier image/TTS models report ~60s with limit:0). Waiting it
// out is pointless and burns the 600s action budget, so we treat it as non-retryable
// and fail fast — letting the caller fall back (thumbnail → Pollinations) or mark the
// step failed promptly instead of hanging for minutes.
const MAX_GEMINI_RETRY_DELAY_MS = 8000

function geminiRetryDelayMs(err: unknown, attempt: number): number | null {
  const msg = String(err)
  if (!msg.includes('429')) return null
  const match = msg.match(/retry in ([\d.]+)s/i)
  // Random jitter so concurrent pipelines that hit the same 429 don't retry in
  // lockstep and re-collide: parsed delays get +0–500ms, the fallback +0–2s.
  const delay = match
    ? Math.ceil(Number(match[1]) * 1000) + Math.random() * 500
    : (attempt + 1) * 5000 + Math.random() * 2000
  return delay > MAX_GEMINI_RETRY_DELAY_MS ? null : delay
}

async function withGeminiRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      const delayMs = geminiRetryDelayMs(err, attempt)
      if (delayMs === null || attempt === maxAttempts - 1) throw err
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
  throw lastErr
}

// Same detection userFacingErrorMessage uses for its "high demand" branch —
// shared so the pipeline can decide to requeue on a rate limit rather than fail.
function isRateLimitError(err: unknown): boolean {
  return /429|RESOURCE_EXHAUSTED|rate limit|quota/i.test(String(err))
}

// errorMsg is shown verbatim in the UI, so never surface raw provider errors
// (e.g. Google's 429 rate-limit text). Map them to friendly messages here; the
// raw error stays in console.error logs for debugging.
function userFacingErrorMessage(err: unknown, step: string): string {
  const msg = String(err)
  if (/429|RESOURCE_EXHAUSTED|rate limit|quota/i.test(msg)) {
    return "We're experiencing high demand right now. Please retry in a few minutes."
  }
  if (/401|403|API key/i.test(msg)) {
    return 'Generation service is misconfigured. Please contact support.'
  }
  return `${step} failed. Please retry.`
}

async function embedTextForSearch(
  apiKey: string,
  text: string,
  model: string,
  // Documents are embedded with RETRIEVAL_DOCUMENT; a SEARCH QUERY must be
  // embedded with RETRIEVAL_QUERY so it lands in the right region of the vector
  // space relative to the stored document embeddings.
  taskType: 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY' = 'RETRIEVAL_DOCUMENT',
): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: 768,
      }),
    },
  )
  if (!res.ok) {
    throw new Error(`Embedding failed (${res.status}): ${await res.text()}`)
  }
  const data = (await res.json()) as { embedding: { values: number[] } }
  return data.embedding.values
}

// The document text we embed for semantic search. The category is included
// explicitly: it's the one piece of topical metadata the author states outright,
// and without it a stocks episode filed under "Business" carries no "business"
// signal at all — a "business" query then has to bridge stocks→business purely
// from transcript similarity, which routinely lands under the relevance cutoff.
// Shared by the pipeline (step 2) and the embedding backfill so both always
// embed the same shape of text.
function buildEmbeddingText(
  podcast: { title: string; category: string; description: string },
  transcript: string,
): string {
  return `${podcast.title}\nCategory: ${podcast.category}\n\n${podcast.description}\n\n${transcript}`.slice(
    0,
    2000,
  )
}

const DEFAULT_IMAGE_MODELS = [
  'gemini-3.1-flash-image',
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image-preview',
]

function imageModelCandidates(): string[] {
  const configured = process.env.GEMINI_IMAGE_MODEL
  const models = configured ? [configured, ...DEFAULT_IMAGE_MODELS] : DEFAULT_IMAGE_MODELS
  return [...new Set(models)]
}

async function generateThumbnailImage(
  apiKey: string,
  model: string,
  prompt: string,
): Promise<{ mimeType: string; base64Data: string }> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '1:1' },
        },
      }),
    },
  )
  if (!res.ok) {
    throw new Error(`Thumbnail generation failed (${res.status}): ${await res.text()}`)
  }
  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> }
    }>
  }
  const imagePart = json.candidates?.[0]?.content?.parts?.find((part) =>
    part.inlineData?.mimeType?.startsWith('image/'),
  )
  if (!imagePart?.inlineData?.data) {
    throw new Error('Thumbnail generation returned no image data.')
  }
  return {
    mimeType: imagePart.inlineData.mimeType ?? 'image/png',
    base64Data: imagePart.inlineData.data,
  }
}

async function generateThumbnailWithGemini(
  apiKey: string,
  prompt: string,
): Promise<{ mimeType: string; base64Data: string }> {
  let lastErr: unknown
  for (const model of imageModelCandidates()) {
    try {
      return await withGeminiRetry(() => generateThumbnailImage(apiKey, model, prompt), 5)
    } catch (err) {
      lastErr = err
      const msg = String(err)
      console.error(`Gemini thumbnail (${model}) failed:`, msg)
      if (!msg.includes('429') && !msg.includes('404') && !msg.toLowerCase().includes('not found')) {
        throw err
      }
    }
  }
  throw lastErr
}

async function generateThumbnailFallback(prompt: string): Promise<Blob> {
  const truncated = prompt.slice(0, 400)
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(truncated)}?width=512&height=512&nologo=true`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Fallback thumbnail failed (${res.status})`)
  }
  const bytes = new Uint8Array(await res.arrayBuffer())
  const type = res.headers.get('content-type') ?? 'image/jpeg'
  return new Blob([bytes], { type })
}

async function storeThumbnailForPodcast(
  ctx: ActionCtx,
  podcastId: Id<'podcasts'>,
  podcast: {
    title: string
    category: string
    description: string
    thumbnailPrompt?: string
  },
): Promise<boolean> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return false

  const thumbnailText = buildThumbnailPrompt(podcast)
  let imageBlob: Blob
  try {
    const { mimeType, base64Data } = await generateThumbnailWithGemini(apiKey, thumbnailText)
    const imageBytes = base64ToBytes(base64Data)
    const imageBuffer = imageBytes.buffer.slice(
      imageBytes.byteOffset,
      imageBytes.byteOffset + imageBytes.byteLength,
    ) as ArrayBuffer
    imageBlob = new Blob([imageBuffer], { type: mimeType })
  } catch (geminiErr) {
    if (process.env.THUMBNAIL_FALLBACK === 'false') {
      throw geminiErr
    }
    console.error('Gemini thumbnail unavailable, using fallback provider:', String(geminiErr))
    imageBlob = await generateThumbnailFallback(thumbnailText)
  }

  const thumbnailStorageId = await ctx.storage.store(imageBlob)
  if (!thumbnailStorageId) return false

  await ctx.runMutation(internal.podcasts.saveGeneratedFields, {
    id: podcastId,
    thumbnailStorageId,
  })
  return true
}

function buildThumbnailPrompt(podcast: {
  title: string
  category: string
  description: string
  thumbnailPrompt?: string
}): string {
  if (podcast.thumbnailPrompt?.trim()) {
    return `Professional square podcast cover art: ${podcast.thumbnailPrompt.trim()}. Bold composition, vibrant colors, high contrast, no watermark.`
  }
  return [
    `Professional square podcast cover art for a show titled "${podcast.title}".`,
    `Category: ${podcast.category}.`,
    podcast.description.trim() ? `Theme: ${podcast.description.trim().slice(0, 300)}.` : '',
    'Cinematic lighting, vivid colors, editorial illustration style, no text watermark.',
  ]
    .filter(Boolean)
    .join(' ')
}

// ─── Actions ─────────────────────────────────────────────────────────────────

// A rate-limited step exhausts its in-action retries within seconds (see
// MAX_GEMINI_RETRY_DELAY_MS), but the quota usually recovers on the order of
// minutes. Rather than marking the podcast failed and making the user retry by
// hand, requeue the whole pipeline via the scheduler with a growing delay
// (60s → 120s → 240s, plus jitter), up to this many requeues. Requeues bypass
// the generation token bucket intentionally — they're internal continuation of
// already-admitted work, not new user demand.
const MAX_RATE_LIMIT_REQUEUES = 3

function requeueDelayMs(attempt: number): number {
  return 60_000 * 2 ** attempt + Math.random() * 10_000
}

// Internal: the actual generation pipeline. `attempt` counts scheduler-based
// requeues after rate-limit failures (0 = first run).
export const runPipeline = internalAction({
  args: { podcastId: v.id('podcasts'), attempt: v.optional(v.number()) },
  handler: async (ctx, { podcastId, attempt = 0 }) => {
    // On a rate-limit failure: requeue (status stays 'generating' — the detail
    // page keeps showing live progress) until the cap, then fail with the
    // existing friendly message.
    const failOrRequeue = async (err: unknown, failedStep: string, stepLabel: string) => {
      if (isRateLimitError(err) && attempt < MAX_RATE_LIMIT_REQUEUES) {
        const delayMs = requeueDelayMs(attempt)
        console.error(
          `${stepLabel} rate-limited; requeueing pipeline in ${Math.round(delayMs / 1000)}s (attempt ${attempt + 1}/${MAX_RATE_LIMIT_REQUEUES})`,
        )
        await ctx.scheduler.runAfter(delayMs, internal.podcasts.runPipeline, {
          podcastId,
          attempt: attempt + 1,
        })
        return
      }
      await ctx.runMutation(internal.podcasts.setPipelineStatus, {
        id: podcastId,
        status: 'failed',
        failedStep,
        errorMsg: userFacingErrorMessage(err, stepLabel),
      })
    }

    await ctx.runMutation(internal.podcasts.setPipelineStatus, {
      id: podcastId,
      status: 'generating',
    })

    const podcast = await ctx.runQuery(api.podcasts.getById, { id: podcastId })
    if (!podcast) throw new Error(`Podcast ${podcastId} not found`)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      await ctx.runMutation(internal.podcasts.setPipelineStatus, {
        id: podcastId,
        status: 'failed',
        failedStep: 'generating_script',
        errorMsg: 'GEMINI_API_KEY is not set in Convex environment variables.',
      })
      return
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const scriptModel = process.env.GEMINI_SCRIPT_MODEL ?? 'gemini-2.5-flash'
    const ttsModelName = process.env.GEMINI_TTS_MODEL ?? 'gemini-3.1-flash-tts-preview'
    const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001'

    // ── Step 1: Generate transcript ──────────────────────────────────────────
    // A stored transcript is always valid to reuse: applyEdit clears it whenever
    // an edit needs regeneration, so if it's still here it matches the current
    // prompt. Skipping the call means a requeue after an audio-step rate limit
    // doesn't burn another script generation.
    let transcript: string
    if (podcast.transcript) {
      transcript = podcast.transcript
    } else try {
      const model = genAI.getGenerativeModel({ model: scriptModel })
      const prompt = `You are writing a podcast episode script for a single-speaker show.

Show title: "${podcast.title}"
Category: ${podcast.category}
Voice persona: ${podcast.speaker1Voice}
Topic: ${podcast.topicPrompt}

Write an engaging, conversational podcast monologue. Requirements:
- 400 to 600 words
- Single speaker — no interview format, no co-host
- Speak naturally as if talking directly to the listener
- No markdown formatting, no music cues, no "subscribe" call-to-action
- Plain paragraphs only, separated by a blank line
- Start directly with content — no "Welcome to [show]" opener
- End naturally without an explicit sign-off

Write the script now:`

      const result = await withGeminiRetry(() => model.generateContent(prompt))
      transcript = result.response.text().trim()

      await ctx.runMutation(internal.podcasts.saveGeneratedFields, {
        id: podcastId,
        transcript,
      })
    } catch (err) {
      console.error('Script generation failed:', String(err))
      await failOrRequeue(err, 'generating_script', 'Script generation')
      return
    }

    // ── Step 2: Generate embedding for semantic search ───────────────────────
    try {
      const textToEmbed = buildEmbeddingText(podcast, transcript)
      const embedding = await embedTextForSearch(apiKey, textToEmbed, embeddingModel)
      await ctx.runMutation(internal.podcasts.saveGeneratedFields, {
        id: podcastId,
        embedding,
      })
    } catch (err) {
      // Non-fatal — embedding is for search, not playback
      console.error('Embedding generation failed (non-fatal):', String(err))
    }

    // ── Step 3: Audio generation ─────────────────────────────────────────────
    let audioSaved = false
    let audioError: string | undefined
    let audioErr: unknown // raw error, kept for rate-limit requeue detection
    try {
      const ttsModel = genAI.getGenerativeModel({ model: ttsModelName })
      const geminiVoice = GEMINI_VOICE_MAP[podcast.speaker1Voice] ?? 'Kore'
      const ttsText = transcript.slice(0, 8000)
      const ttsResult = (await withGeminiRetry(() =>
        (ttsModel as any).generateContent({
          contents: [{ role: 'user', parts: [{ text: ttsText }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoice } },
            },
          },
        }),
      )) as any
      const audioPart = ttsResult.response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith('audio/'),
      ) as any
      if (audioPart?.inlineData?.data) {
        const mimeType = audioPart.inlineData.mimeType ?? 'audio/L16;rate=24000'
        const audioBlob = audioInlineDataToBlob(mimeType, audioPart.inlineData.data)
        const audioStorageId = await ctx.storage.store(audioBlob)
        if (audioStorageId) {
          await ctx.runMutation(internal.podcasts.saveGeneratedFields, {
            id: podcastId,
            audioStorageId,
          })
          audioSaved = true
        } else {
          audioError = 'Convex storage did not persist the audio file.'
        }
      } else {
        audioError = 'Gemini TTS response did not include audio data.'
      }
    } catch (err) {
      console.error('Audio generation failed:', String(err))
      audioErr = err
      audioError = userFacingErrorMessage(err, 'Audio generation')
    }

    if (!audioSaved) {
      // Rate-limited TTS gets requeued (the saved transcript is reused on the
      // re-run, so no extra script call); anything else fails as before.
      if (audioErr !== undefined && isRateLimitError(audioErr)) {
        await failOrRequeue(audioErr, 'generating_audio', 'Audio generation')
        return
      }
      await ctx.runMutation(internal.podcasts.setPipelineStatus, {
        id: podcastId,
        status: 'failed',
        failedStep: 'generating_audio',
        errorMsg: audioError ?? 'Audio was not generated.',
      })
      return
    }

    // ── Step 4: Thumbnail generation ─────────────────────────────────────────
    try {
      await storeThumbnailForPodcast(ctx, podcastId, podcast)
    } catch (err) {
      console.error('Thumbnail generation failed (non-fatal):', String(err))
    }

    // Single point where status flips to 'ready' — also charges the quota slot
    // idempotently (see markReadyAndCount).
    await ctx.runMutation(internal.podcasts.markReadyAndCount, { id: podcastId })
  },
})

// Public: called from the client after podcast creation.
// Gates users at their plan's lifetime successful-generation limit:
// FREE_GENERATION_LIMIT for Free, PRO_GENERATION_LIMIT for Pro.
export const generatePodcast = action({
  args: { podcastId: v.id('podcasts') },
  handler: async (ctx, { podcastId }) => {
    // Resolve the user from the authenticated identity (NOT a client-supplied
    // authorId) so the gate can't be bypassed by spoofing an author.
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError({ code: 'UNAUTHENTICATED' })
    }
    const user = await ctx.runQuery(api.users.getByClerkId, {
      clerkId: identity.subject,
    })
    if (!user) {
      throw new ConvexError({ code: 'UNAUTHENTICATED' })
    }

    const isPro = user.plan === 'pro'
    const generationLimit = isPro ? PRO_GENERATION_LIMIT : FREE_GENERATION_LIMIT
    if ((user.generationCount ?? 0) >= generationLimit) {
      throw new ConvexError({ code: 'QUOTA_EXCEEDED' })
    }

    // Global throughput throttle (after the quota check so quota errors take
    // precedence). Throws RATE_LIMITED to the client when the bucket is empty.
    await ctx.runMutation(internal.rateLimit.consumeGenerationToken, {})

    // Run the pipeline in the BACKGROUND so this action returns immediately. The
    // pipeline (transcript → audio → thumbnail) can take minutes; awaiting it
    // here would block the client and blow the 600s action cap. The detail page
    // renders live status (pending → generating → ready/failed) via reactivity.
    await ctx.scheduler.runAfter(0, internal.podcasts.runPipeline, { podcastId })
  },
})

// Public: regenerate cover art only (no full pipeline re-run)
export const regenerateThumbnail = action({
  args: { podcastId: v.id('podcasts') },
  handler: async (ctx, { podcastId }) => {
    const podcast = await ctx.runQuery(api.podcasts.getById, { id: podcastId })
    if (!podcast) throw new Error('Podcast not found')
    const saved = await storeThumbnailForPodcast(ctx, podcastId, podcast)
    if (!saved) throw new Error('Thumbnail could not be saved.')
  },
})

// Public: called from the detail page Retry button
export const retryGeneration = action({
  args: { podcastId: v.id('podcasts') },
  handler: async (ctx, { podcastId }) => {
    // Global throughput throttle — throws RATE_LIMITED when the bucket is empty.
    await ctx.runMutation(internal.rateLimit.consumeGenerationToken, {})

    // Reset to pending so the pipeline re-runs cleanly
    await ctx.runMutation(internal.podcasts.setPipelineStatus, {
      id: podcastId,
      status: 'generating',
    })
    // Background (scheduled) — see generatePodcast for rationale.
    await ctx.scheduler.runAfter(0, internal.podcasts.runPipeline, { podcastId })
  },
})

// ─── Custom thumbnail upload (Pro-only) ─────────────────────────────────────

// Resolve the authenticated user's doc inside a mutation/query ctx and confirm
// they are Pro. UI gating (Billing #2) is UX only — this is the real boundary.
async function requireProUser(ctx: QueryCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) throw new ConvexError({ code: 'UNAUTHENTICATED' })
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .unique()
  if (!user) throw new ConvexError({ code: 'UNAUTHENTICATED' })
  if (user.plan !== 'pro') throw new ConvexError({ code: 'PRO_REQUIRED' })
  return user
}

// Public: issue a short-lived upload URL for a custom thumbnail. Pro-only —
// a Free user is rejected here, before any bytes are stored.
export const generateThumbnailUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireProUser(ctx)
    return ctx.storage.generateUploadUrl()
  },
})

// Public: attach an uploaded image as a podcast's custom thumbnail. Pro-only and
// owner-only. Clears any prior AI thumbnail prompt path in favor of the upload.
export const setCustomThumbnail = mutation({
  args: { podcastId: v.id('podcasts'), storageId: v.id('_storage') },
  handler: async (ctx, { podcastId, storageId }) => {
    const user = await requireProUser(ctx)
    const podcast = await ctx.db.get(podcastId)
    if (!podcast) throw new ConvexError({ code: 'NOT_FOUND' })
    if (podcast.authorId !== user._id) throw new ConvexError({ code: 'FORBIDDEN' })
    await ctx.db.patch(podcastId, {
      thumbnailStorageId: storageId,
      thumbnailUrl: undefined,
    })
  },
})

// ─── Semantic search + recommendations (vector search) ──────────────────────

// Public: meaning-based search. Embeds the query (RETRIEVAL_QUERY) and ranks
// podcasts by vector similarity, optionally narrowed by category. `vectorSearch`
// is action-only and returns ids+scores, so we hydrate via getReadyByIds.
//
// This is the one public, anonymous, Gemini-calling endpoint, so it is rate
// limited (global token bucket) to protect the shared Gemini key.
export const semanticSearch = action({
  args: { query: v.string(), category: v.optional(v.string()) },
  handler: async (ctx, { query, category }): Promise<HydratedPodcast[]> => {
    await ctx.runMutation(internal.rateLimit.consumeSearchToken, {})

    const trimmed = query.trim()
    if (!trimmed) return []

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in Convex environment variables.')
    const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001'

    // Filler like "podcasts"/"related"/"about" dilutes the embedding toward
    // generic "this is a podcast" phrasing shared by every episode, shrinking
    // the gap between a true topical match and an unrelated one (measured on
    // real data: "health related podcasts" scored the actual health episode
    // 0.633 and an unrelated SaaS episode 0.600 — too close for any cutoff to
    // separate). Stripping stop words sharpens the query onto the topic
    // word(s), the same cleanup the keyword half already does. If nothing but
    // filler remains ("is the"), there's no topic to embed — return no
    // matches rather than embedding the raw filler, which scores close to
    // every podcast and lets everything back in.
    const semanticQuery = stripStopWords(trimmed)
    if (!semanticQuery) return []
    const vector = await embedTextForSearch(apiKey, semanticQuery, embeddingModel, 'RETRIEVAL_QUERY')

    const matches = await ctx.vectorSearch('podcasts', 'by_embedding', {
      vector,
      limit: 20,
      filter: category ? (q) => q.eq('category', category) : undefined,
    })

    // vectorSearch returns the k-nearest neighbors RANKED, never filtered — so
    // an off-topic podcast still comes back, just with a lower `_score`. Apply
    // an adaptive relevance cutoff (see filterRelevantMatches) so "is saas
    // still worth in 2027" doesn't surface an Ozempic episode just because it
    // cleared a flat floor.
    const relevant = filterRelevantMatches(matches)

    return ctx.runQuery(internal.podcasts.getReadyByIds, {
      ids: relevant.map((m) => m._id),
    })
  },
})

// Public: HYBRID search — combine a literal KEYWORD search (full-text over
// titles) with the SEMANTIC vector search, so the box matches both literal
// title words AND meaning. The two ranked lists are fused with Reciprocal Rank
// Fusion (see below), so results BOTH methods agree on rank first and single-
// list matches sink; the list is deduped by `_id`. The optional `category`
// filter applies to BOTH halves.
//
// Like semanticSearch, this is the public, anonymous, Gemini-calling entry
// point, so it consumes a rate-limit token (global bucket) up front.
export const hybridSearch = action({
  args: { query: v.string(), category: v.optional(v.string()) },
  handler: async (ctx, { query, category }): Promise<HydratedPodcast[]> => {
    await ctx.runMutation(internal.rateLimit.consumeSearchToken, {})

    const trimmed = query.trim()
    if (!trimmed) return []

    // ── Keyword half: cheap full-text query, no Gemini ──────────────────────
    const keywordResults = await ctx.runQuery(api.podcasts.searchPodcasts, {
      query: trimmed,
      category,
    })

    // ── Category-browse half: a query that IS a category name ("business") is
    // a browse intent — every podcast the author filed under that category is
    // an exact answer, no similarity required. Without this, a stocks episode
    // categorized "Business" only surfaces if the embedding bridges
    // stocks→business hard enough to clear the relevance cutoff, and the
    // adaptive margin lets a transcript that merely SAYS "business" a lot
    // (e.g. a SaaS episode) crowd it out. Matched against the cleaned query so
    // "business podcasts" still counts as browsing Business.
    const cleanedForCategory = stripStopWords(trimmed).toLowerCase()
    const categoryResults =
      cleanedForCategory && !category
        ? await ctx.runQuery(internal.podcasts.getReadyByCategory, {
            category: cleanedForCategory,
          })
        : []

    // ── Semantic half: embed the query and vector-search by meaning ─────────
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in Convex environment variables.')
    const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001'

    // See semanticSearch: stripping filler sharpens the embedding onto the
    // actual topic word(s) instead of generic "this is a podcast" phrasing.
    // If nothing but filler remains, skip the Gemini call — there's no topic
    // to embed, and embedding the raw filler scores close to every podcast.
    const semanticQuery = stripStopWords(trimmed)
    const matches = semanticQuery
      ? await (async () => {
          const vector = await embedTextForSearch(
            apiKey,
            semanticQuery,
            embeddingModel,
            'RETRIEVAL_QUERY',
          )
          return ctx.vectorSearch('podcasts', 'by_embedding', {
            vector,
            limit: 20,
            filter: category ? (q) => q.eq('category', category) : undefined,
          })
        })()
      : []

    // vectorSearch returns ranked k-nearest neighbors, never filtered, so apply
    // the same adaptive relevance cutoff semanticSearch uses to drop off-topic
    // hits (see filterRelevantMatches).
    const relevant = filterRelevantMatches(matches)
    const semanticResults = await ctx.runQuery(internal.podcasts.getReadyByIds, {
      ids: relevant.map((m) => m._id),
    })

    // ── Fuse the two ranked lists with Reciprocal Rank Fusion (RRF) ─────────
    // We used to just concatenate (every keyword hit, then every semantic hit),
    // which let a purely lexical coincidence — a title that merely SHARES A WORD
    // with the query (e.g. a plane-crash episode matching "trajectory") — outrank
    // a result both methods actually AGREE on. RRF fixes the ORDER: each list
    // contributes 1/(k + rank) to every doc it contains, and a doc's score is the
    // SUM across lists. So a podcast ranked highly by BOTH keyword and semantic
    // search rises to the top, while a single-list match sinks below the
    // consensus hits. k=60 is the standard smoothing constant from the original
    // RRF paper (Cormack et al., 2009). Ties keep keyword-first insertion order
    // (Array.sort is stable), so behaviour is deterministic.
    const K = Number(process.env.RRF_K ?? 60)
    const scoreById = new Map<string, number>()
    const docById = new Map<string, HydratedPodcast>()
    const accrue = (list: HydratedPodcast[]) => {
      list.forEach((doc, i) => {
        docById.set(doc._id, doc)
        scoreById.set(doc._id, (scoreById.get(doc._id) ?? 0) + 1 / (K + i + 1))
      })
    }
    accrue(keywordResults)
    accrue(semanticResults)
    accrue(categoryResults)

    return [...docById.values()].sort(
      (a, b) => (scoreById.get(b._id) ?? 0) - (scoreById.get(a._id) ?? 0),
    )
  },
})

// Internal: re-embed every ready podcast with the current buildEmbeddingText
// shape (title + category + description + transcript). One-off maintenance —
// run after changing what gets embedded, e.g.
//   npx convex run podcasts:backfillEmbeddings
// Sequential with the standard 429 retry so it doesn't trip Gemini rate limits.
export const backfillEmbeddings = internalAction({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set in Convex environment variables.')
    const embeddingModel = process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-001'

    const ready = await ctx.runQuery(internal.podcasts.getAllReady, {})
    let updated = 0
    for (const podcast of ready) {
      const textToEmbed = buildEmbeddingText(podcast, podcast.transcript ?? '')
      const embedding = await withGeminiRetry(() =>
        embedTextForSearch(apiKey, textToEmbed, embeddingModel),
      )
      await ctx.runMutation(internal.podcasts.saveGeneratedFields, {
        id: podcast._id,
        embedding,
      })
      updated++
    }
    console.log(`Backfilled embeddings for ${updated} podcast(s).`)
    return updated
  },
})

// Internal: raw ready podcasts (no media/author hydration) for the embedding
// backfill, which only needs the text fields.
export const getAllReady = internalQuery({
  args: {},
  handler: (ctx) =>
    ctx.db
      .query('podcasts')
      .withIndex('by_status', (q) => q.eq('status', 'ready'))
      .collect(),
})

// Public: "You Might Also Like" — vector-nearest podcasts to the given one,
// reusing its STORED embedding (no new Gemini call). Falls back to popularity
// when the source has no embedding yet (e.g. still generating).
export const getSimilar = action({
  args: { podcastId: v.id('podcasts'), limit: v.optional(v.number()) },
  handler: async (ctx, { podcastId, limit = 4 }): Promise<HydratedPodcast[]> => {
    const podcast = await ctx.runQuery(api.podcasts.getById, { id: podcastId })

    if (!podcast?.embedding) {
      const popular = await ctx.runQuery(api.podcasts.getPopular, { limit: limit + 1 })
      return popular.filter((p) => p._id !== podcastId).slice(0, limit)
    }

    const matches = await ctx.vectorSearch('podcasts', 'by_embedding', {
      vector: podcast.embedding,
      limit: limit + 1, // +1 so we can drop the source podcast itself
    })

    const ids = matches.map((m) => m._id).filter((id) => id !== podcastId)
    const docs = await ctx.runQuery(internal.podcasts.getReadyByIds, { ids })
    return docs.slice(0, limit)
  },
})
