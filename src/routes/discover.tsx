import { createFileRoute, Link } from '@tanstack/react-router'
import { useAction, useQuery } from 'convex/react'
import { BarChart3, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import BookmarkButton from '../components/BookmarkButton'
import CategoryDropdown from '../components/CategoryDropdown'

export const Route = createFileRoute('/discover')({ component: DiscoverPage })

const CATEGORIES = [
  'Technology', 'Business', 'Education', 'Entertainment',
  'Health', 'Science', 'Sports', 'True Crime', 'Comedy', 'News',
]

const CAT_GRADIENTS: Record<string, [string, string]> = {
  Technology:    ['#1e3a5f', '#2563eb'],
  Business:      ['#064e3b', '#059669'],
  Education:     ['#78350f', '#d97706'],
  Entertainment: ['#7c2d12', '#f97535'],
  Health:        ['#134e4a', '#0d9488'],
  Science:       ['#1e3a5f', '#4f46e5'],
  Sports:        ['#7f1d1d', '#dc2626'],
  'True Crime':  ['#831843', '#db2777'],
  Comedy:        ['#365314', '#65a30d'],
  News:          ['#1c1917', '#57534e'],
}
const FALLBACK: [string, string] = ['#1e3a5f', '#2563eb']
function catGradient(cat: string): [string, string] {
  return CAT_GRADIENTS[cat] ?? FALLBACK
}

function GradientBox({ from, to, className }: { from: string; to: string; className?: string }) {
  return <div className={className} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
}

type Podcast = {
  _id: Id<'podcasts'>
  title: string
  category: string
  listenerCount: number
  thumbnailUrl?: string
  author?: { name: string } | null
}

function PodcastRow({ podcast }: { podcast: Podcast }) {
  const [from, to] = catGradient(podcast.category)
  return (
    <div className="relative">
      <Link
        to="/podcast/$id"
        params={{ id: podcast._id }}
        className="flex items-center gap-4 rounded-xl bg-[#15171C] px-4 py-3 border border-[#252525] hover:border-[#f97535]/30 transition-colors"
      >
        {podcast.thumbnailUrl ? (
          <img src={podcast.thumbnailUrl} alt={podcast.title} className="w-14 h-14 rounded-[3px] object-cover shrink-0" />
        ) : (
          <GradientBox from={from} to={to} className="w-14 h-14 rounded-[3px] shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-white text-base font-bold truncate pr-9">{podcast.title}</p>
          <p className="text-[#71788B] text-sm mt-0.5 truncate">{podcast.author?.name ?? 'Unknown'}</p>
          <span className="flex items-center gap-1 mt-1.5 text-[#71788B] text-xs">
            <BarChart3 size={11} />
            {podcast.listenerCount.toLocaleString()}
          </span>
        </div>
      </Link>
      {/* Toggle sits above the Link so saving doesn't navigate to the detail page. */}
      <div className="absolute right-3 top-3">
        <BookmarkButton podcastId={podcast._id} />
      </div>
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-[#15171C] px-4 py-3 border border-[#252525] animate-pulse">
      <div className="w-14 h-14 rounded-[3px] bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-white/10" />
        <div className="h-3 w-1/3 rounded bg-white/10" />
      </div>
    </div>
  )
}

function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const trimmed = query.trim()

  // ── Hybrid search ───────────────────────────────────────────────────────────
  // The search box matches BOTH literal title words AND meaning: a cheap
  // full-text keyword search is merged with a Gemini-embedded vector search
  // (hybridSearch action, debounced — vector search is action-only and
  // non-reactive). Exact keyword hits rank first, then semantic ones. So
  // "the startup playbook" matches a "Startup" title literally, while "why will
  // saas die" still resolves by intent even without the words in the title.
  const hybridSearch = useAction(api.podcasts.hybridSearch)
  const [semanticResults, setSemanticResults] = useState<Podcast[] | undefined>(undefined)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    if (!trimmed) {
      setSemanticResults(undefined)
      setSearchError(null)
      return
    }
    let cancelled = false
    setSemanticResults(undefined)
    setSearchError(null)
    const timer = setTimeout(async () => {
      try {
        const results = await hybridSearch({
          query: trimmed,
          category: activeCategory ?? undefined,
        })
        if (!cancelled) setSemanticResults(results as Podcast[])
      } catch (err) {
        if (cancelled) return
        const msg = String((err as { message?: string })?.message ?? err)
        setSearchError(
          msg.includes('RATE_LIMITED') || msg.toLowerCase().includes('busy')
            ? 'Search is busy right now — showing the latest instead.'
            : 'Search is unavailable right now — showing the latest instead.',
        )
        setSemanticResults(undefined)
      }
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [trimmed, activeCategory, hybridSearch])

  // Latest is always loaded: it's the idle browse AND the graceful fallback when
  // the Gemini-backed search errors, so the box is never left blank.
  const latest = useQuery(api.podcasts.getLatest, { limit: 24 })
  const latestFiltered =
    latest === undefined
      ? undefined
      : activeCategory
        ? (latest as Podcast[]).filter((p) => p.category === activeCategory)
        : (latest as Podcast[])

  // Browse Latest when idle; fall back to Latest on a search error; otherwise
  // show the semantic (intent) results (undefined while the embedding is in
  // flight → skeletons).
  const podcasts = !trimmed ? latestFiltered : searchError ? latestFiltered : semanticResults

  // ── Top matches vs Related ──────────────────────────────────────────────────
  // The reranker orders results well (best first) but CANNOT reliably *drop* the
  // loosely-related tail: relevance scores aren't comparable across queries, so
  // no fixed cutoff separates "stocks" from "expectant mothers" noise. Rather
  // than fake a threshold, we present the ranking honestly — the first few hits
  // as "Top matches", the ordered tail as a dimmed "Related" section — so a
  // low-ranked result stops masquerading as a claimed answer. Search-only; idle
  // browse and the error-fallback keep the single grid.
  const TOP_N = 4
  const isSearch = Boolean(trimmed) && !searchError
  const showSplit = isSearch && podcasts !== undefined && podcasts.length > TOP_N
  const topMatches = showSplit ? podcasts!.slice(0, TOP_N) : (podcasts ?? [])
  const related = showSplit ? podcasts!.slice(TOP_N) : []

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8">
      {/* Search */}
      <div className="relative mb-7">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71788B]" size={15} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by idea — e.g. “why saas is dying”"
          className="w-full rounded-md bg-[#15171C] pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#71788B] border border-[#252525] outline-none focus:border-[#f97535] transition-colors"
        />
      </div>

      {/* Header + category filter. The dropdown drives `activeCategory`, which
          feeds both semanticSearch and the Latest browse below — same wiring as
          the old chips, just a single select instead of a chip row. */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <h1 className="text-xl font-bold text-white">Discover</h1>
        <CategoryDropdown
          options={CATEGORIES}
          value={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {/* Search-error notice (results fall back to Latest below) */}
      {trimmed && searchError ? (
        <p className="mb-4 text-[#f97535] text-xs">{searchError}</p>
      ) : null}

      {/* Podcast grid */}
      {podcasts === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      ) : podcasts.length === 0 ? (
        <p className="text-[#71788B] text-sm">
          {trimmed && !searchError
            ? 'No strong matches for that idea — try describing it differently.'
            : 'No podcasts yet — create the first one!'}
        </p>
      ) : showSplit ? (
        <div className="space-y-9">
          <section>
            <h2 className="text-sm font-semibold text-white mb-3">Top matches</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              {topMatches.map((p) => <PodcastRow key={p._id} podcast={p as Podcast} />)}
            </div>
          </section>
          <section>
            <h2 className="text-sm font-semibold text-[#71788B]">Related</h2>
            <p className="text-[#71788B] text-xs mt-0.5 mb-3">Loosely related to your search.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 opacity-70">
              {related.map((p) => <PodcastRow key={p._id} podcast={p as Podcast} />)}
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {podcasts.map((p) => <PodcastRow key={p._id} podcast={p as Podcast} />)}
        </div>
      )}
    </div>
  )
}
