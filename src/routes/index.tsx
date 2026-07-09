import { useUser } from '@clerk/tanstack-react-start'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Headphones,
  Loader2,
  MoreHorizontal,
  Play,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import BookmarkButton from '../components/BookmarkButton'

export const Route = createFileRoute('/')({ component: HomePage })

// Deterministic gradient per category
const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  Technology: ['#1e3a5f', '#2563eb'],
  Business: ['#064e3b', '#059669'],
  Education: ['#78350f', '#d97706'],
  Entertainment: ['#7c2d12', '#f97535'],
  Health: ['#134e4a', '#0d9488'],
  Science: ['#1e3a5f', '#4f46e5'],
  Sports: ['#7f1d1d', '#dc2626'],
  'True Crime': ['#831843', '#db2777'],
  Comedy: ['#365314', '#65a30d'],
  News: ['#1c1917', '#57534e'],
}
const FALLBACK_PAIRS: [string, string][] = [
  ['#1e3a5f', '#2563eb'],
  ['#3b0764', '#7c3aed'],
  ['#064e3b', '#059669'],
  ['#78350f', '#d97706'],
]
function gradient(category: string, fallbackIdx = 0): [string, string] {
  return CATEGORY_GRADIENTS[category] ?? FALLBACK_PAIRS[fallbackIdx % FALLBACK_PAIRS.length]
}

function GradientBox({ from, to, className }: { from: string; to: string; className?: string }) {
  return (
    <div className={className} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
  )
}

// ── Skeleton helpers ──────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="w-40 shrink-0 animate-pulse sm:w-44 md:w-48">
      <div className="w-full aspect-square rounded-[3px] bg-white/10 mb-3" />
      <div className="h-4 w-3/4 rounded bg-white/10 mb-1.5" />
      <div className="h-3 w-1/2 rounded bg-white/10" />
    </div>
  )
}
function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3.5 border-b border-[#252525] animate-pulse">
      <div className="w-5 h-4 rounded bg-white/10 shrink-0" />
      <div className="w-12 h-12 rounded-lg bg-white/10 shrink-0" />
      <div className="flex-1 h-4 rounded bg-white/10" />
      <div className="w-24 h-3 rounded bg-white/10 shrink-0" />
    </div>
  )
}

// ── Podcast grid card ─────────────────────────────────────────────────────────
type PodcastWithAuthor = {
  _id: Id<'podcasts'>
  title: string
  category: string
  thumbnailUrl?: string
  listenerCount: number
  audioUrl?: string
  speaker1Voice: string
  author: { name: string; imageUrl?: string } | null
}

// Trigger a browser "Save file" for the given audio URL. Tries fetch→blob first
// (gives a proper filename); falls back to a direct download anchor when the media
// host blocks cross-origin fetch (CORS).
async function triggerDownload(url: string, title: string) {
  const name = `${title.replace(/[^\w\s-]/g, '').trim() || 'podcast'}.mp3`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('fetch failed')
    const blob = await res.blob()
    const objUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objUrl)
  } catch {
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.target = '_blank'
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }
}

// "More" overflow menu — currently a gated Download action. Free users get
// FREE_DOWNLOAD_LIMIT downloads (enforced server-side); Pro is unlimited. Stops
// click propagation so opening the menu / downloading never triggers the card's
// navigate-to-details.
function MoreMenu({ podcast }: { podcast: PodcastWithAuthor }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'downloading' | 'limit' | 'error'>('idle')
  const recordDownload = useMutation(api.downloads.recordDownload)
  const info = useQuery(api.downloads.myDownloadInfo)

  const alreadyDownloaded = info?.downloadedIds.includes(podcast._id as string) ?? false

  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation()
    if (status === 'downloading') return
    setStatus('downloading')
    try {
      const { audioUrl, title } = await recordDownload({ podcastId: podcast._id })
      await triggerDownload(audioUrl, title)
      setStatus('idle')
      setOpen(false)
    } catch (err) {
      const code = (err as { data?: { code?: string } })?.data?.code
      setStatus(code === 'DOWNLOAD_LIMIT' ? 'limit' : 'error')
    }
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setStatus('idle')
          setOpen((v) => !v)
        }}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        title="More options"
        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#71788B] transition-colors hover:bg-white/[0.06] hover:text-white"
      >
        <MoreHorizontal size={16} />
        More
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
            }}
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-xl border border-[#252525] bg-[#15171C] p-1 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              onClick={handleDownload}
              disabled={status === 'downloading'}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-white transition-colors hover:bg-white/[0.06] disabled:opacity-60"
            >
              {status === 'downloading' ? (
                <Loader2 size={16} className="animate-spin text-[#f97535]" />
              ) : (
                <Download size={16} className="text-[#f97535]" />
              )}
              {alreadyDownloaded ? 'Download again' : 'Download'}
            </button>

            {/* Quota / upgrade footer for Free users */}
            {info && !info.isPro && status !== 'limit' && (
              <p className="px-3 pb-2 pt-1 text-[11px] text-[#71788B]">
                {info.count} of {info.limit} free downloads used
              </p>
            )}
            {status === 'limit' && (
              <div className="px-3 pb-2 pt-1">
                <p className="text-[11px] text-[#71788B]">
                  You've used all {info?.limit ?? 3} free downloads.
                </p>
                <Link
                  to="/billing"
                  className="mt-1 inline-block text-[11px] font-semibold text-[#f97535] hover:text-[#f97535]/80"
                  onClick={(e) => e.stopPropagation()}
                >
                  Upgrade to Pro for unlimited →
                </Link>
              </div>
            )}
            {status === 'error' && (
              <p className="px-3 pb-2 pt-1 text-[11px] text-red-400">
                Couldn't download — please try again.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function PodcastCard({
  podcast,
  index,
  onOpen,
}: {
  podcast: PodcastWithAuthor
  index: number
  onOpen: (id: Id<'podcasts'>) => void
}) {
  const [from, to] = gradient(podcast.category, index)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${podcast.title}`}
      className="w-40 shrink-0 cursor-pointer snap-start group sm:w-44 md:w-48"
      onClick={() => onOpen(podcast._id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(podcast._id)
        }
      }}
    >
      <div className="relative mb-3">
        {podcast.thumbnailUrl ? (
          <img
            src={podcast.thumbnailUrl}
            alt={podcast.title}
            className="w-full aspect-square rounded-[3px] object-cover transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <GradientBox
            from={from}
            to={to}
            className="w-full aspect-square rounded-[3px] transition-transform duration-200 group-hover:scale-[1.03]"
          />
        )}
        {/* Bookmark toggle overlays the cover; stops propagation so it doesn't navigate. */}
        <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
          <BookmarkButton podcastId={podcast._id} />
        </div>
      </div>
      <p className="text-white text-base font-bold truncate">{podcast.title}</p>
      <p className="text-[#71788B] text-sm mt-0.5 truncate">{podcast.author?.name ?? 'Unknown'}</p>
    </div>
  )
}

// ── Horizontal carousel ─────────────────────────────────────────────────────
// Swipe/drag-scrollable row with no visible scrollbar (mobile + desktop). Desktop
// gets prev/next chevrons at the far right of the section title.
function Carousel({
  title,
  seeAll,
  children,
}: {
  title: string
  seeAll?: boolean
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  function scrollByDir(dir: -1 | 1) {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
  }
  return (
    <section className="mb-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex items-center gap-3">
          {seeAll && (
            <Link
              to="/discover"
              className="text-base font-semibold text-[#f97535] transition-colors hover:text-[#f97535]/80"
            >
              See All
            </Link>
          )}
          {/* Chevrons — desktop only; mobile scrolls by swipe */}
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              onClick={() => scrollByDir(-1)}
              aria-label="Scroll left"
              title="Scroll left"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#252525] text-[#71788B] transition-colors hover:border-white/20 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollByDir(1)}
              aria-label="Scroll right"
              title="Scroll right"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#252525] text-[#71788B] transition-colors hover:border-white/20 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar flex snap-x gap-4 overflow-x-auto scroll-smooth sm:gap-5">
        {children}
      </div>
    </section>
  )
}

const LATEST_PAGE_SIZE = 5

// ── Latest podcasts — paginated list (5 per page) ───────────────────────────
function LatestList({ onOpen }: { onOpen: (id: Id<'podcasts'>) => void }) {
  const [page, setPage] = useState(0)
  // Fetch a deep-enough window to paginate through client-side.
  const latest = useQuery(api.podcasts.getLatest, { limit: 40 })

  const totalPages = latest ? Math.max(1, Math.ceil(latest.length / LATEST_PAGE_SIZE)) : 1
  const start = page * LATEST_PAGE_SIZE
  const pageItems = latest?.slice(start, start + LATEST_PAGE_SIZE) ?? []

  return (
    <section className="mb-10">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Latest Podcasts</h2>
        <Link
          to="/discover"
          className="text-base font-semibold text-[#f97535] transition-colors hover:text-[#f97535]/80"
        >
          See All
        </Link>
      </div>

      <div className="flex flex-col">
        {latest === undefined ? (
          Array.from({ length: LATEST_PAGE_SIZE }).map((_, i) => <RowSkeleton key={i} />)
        ) : latest.length === 0 ? (
          <p className="text-[#71788B] text-sm">No podcasts yet — be the first to create one!</p>
        ) : (
          pageItems.map((p, i) => {
            const rank = start + i
            const [from, to] = gradient(p.category, rank)
            return (
              <div
                key={p._id}
                role="button"
                tabIndex={0}
                aria-label={`Open ${p.title}`}
                className={`flex items-center gap-4 py-3.5 cursor-pointer group hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors ${
                  i < pageItems.length - 1 ? 'border-b border-[#252525]' : ''
                }`}
                onClick={() => onOpen(p._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onOpen(p._id)
                  }
                }}
              >
                <span className="w-5 text-center text-base font-bold shrink-0 text-[#71788B]">
                  {rank + 1}
                </span>

                <div className="relative shrink-0">
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={p.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <GradientBox from={from} to={to} className="w-12 h-12 rounded-lg" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                      <Play size={10} fill="#101114" className="text-[#101114] ml-px" />
                    </div>
                  </div>
                </div>

                <p className="flex-1 min-w-0 text-base font-bold truncate text-white">{p.title}</p>

                <div className="hidden items-center gap-5 text-xs text-[#71788B] shrink-0 sm:flex">
                  <span className="flex items-center gap-1.5">
                    <Headphones size={13} />
                    {p.listenerCount.toLocaleString()}
                  </span>
                  <span className="text-[#71788B] text-xs">{p.author?.name ?? '—'}</span>
                </div>

                <MoreMenu podcast={p as PodcastWithAuthor} />
              </div>
            )
          })
        )}
      </div>

      {/* Pagination controls */}
      {latest && latest.length > LATEST_PAGE_SIZE && (
        <div className="mt-5 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#252525] text-[#71788B] transition-colors hover:border-white/20 hover:text-white disabled:opacity-40 disabled:hover:border-[#252525] disabled:hover:text-[#71788B]"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm text-[#71788B]">
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#252525] text-[#71788B] transition-colors hover:border-white/20 hover:text-white disabled:opacity-40 disabled:hover:border-[#252525] disabled:hover:text-[#71788B]"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </section>
  )
}

// ── Fans Also Like — horizontal swipe carousel with active dot indicators ────
function FansAlsoLike({
  items,
  loading,
  onOpen,
}: {
  items: PodcastWithAuthor[]
  loading: boolean
  onOpen: (id: Id<'podcasts'>) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  function onScroll() {
    const el = ref.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }
  function goTo(i: number) {
    const el = ref.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Fans Also Like</h3>
        <Link
          to="/discover"
          className="text-base font-semibold text-[#f97535] transition-colors hover:text-[#f97535]/80"
        >
          See All
        </Link>
      </div>

      {loading ? (
        <div className="h-44 w-full rounded-xl bg-white/10 animate-pulse" />
      ) : items.length === 0 ? null : (
        <>
          <div
            ref={ref}
            onScroll={onScroll}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
          >
            {items.map((p) => {
              const [from, to] = gradient(p.category)
              return (
                <div
                  key={p._id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${p.title}`}
                  className="w-full shrink-0 snap-start cursor-pointer group pr-px"
                  onClick={() => onOpen(p._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onOpen(p._id)
                    }
                  }}
                >
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={p.title}
                      className="h-44 w-full rounded-xl object-cover transition-opacity group-hover:opacity-90"
                    />
                  ) : (
                    <GradientBox
                      from={from}
                      to={to}
                      className="h-44 w-full rounded-xl transition-opacity group-hover:opacity-90"
                    />
                  )}
                  <p className="mt-3 text-white text-base font-bold truncate">{p.title}</p>
                  <p className="text-[#71788B] text-sm mt-0.5 truncate">
                    {p.author?.name ?? 'Unknown'}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Scroll indicators — active dot is wide/orange, the rest muted. */}
          {items.length > 1 && (
            <div className="mt-3 flex gap-1.5">
              {items.map((p, i) => (
                <button
                  key={p._id}
                  type="button"
                  aria-label={`Go to item ${i + 1}`}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? 'w-4 bg-[#f97535]' : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ── Home page ─────────────────────────────────────────────────────────────────
function HomePage() {
  const { user } = useUser()
  const navigate = useNavigate()

  const trending = useQuery(api.podcasts.getTrending, { limit: 12 })
  const popular = useQuery(api.podcasts.getPopular, { limit: 12 })
  const topPodcasters = useQuery(api.users.getTopPodcasters, { limit: 4 })

  function openPodcast(id: Id<'podcasts'>) {
    navigate({ to: '/podcast/$id', params: { id } })
  }

  const fansItems = (popular?.slice(0, 6) ?? []) as PodcastWithAuthor[]

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {/* Trending Podcasts — horizontal carousel */}
        <Carousel title="Trending Podcasts">
          {trending === undefined ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : trending.length === 0 ? (
            <p className="text-[#71788B] text-sm">No trending podcasts yet.</p>
          ) : (
            trending.map((p, i) => (
              <PodcastCard
                key={p._id}
                podcast={p as PodcastWithAuthor}
                index={i}
                onOpen={openPodcast}
              />
            ))
          )}
        </Carousel>

        {/* Latest Podcasts — paginated */}
        <LatestList onOpen={openPodcast} />

        {/* Popular Podcasts — horizontal carousel */}
        <Carousel title="Popular Podcasts">
          {popular === undefined ? (
            Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
          ) : popular.length === 0 ? (
            <p className="text-[#71788B] text-sm">No podcasts yet.</p>
          ) : (
            popular.map((p, i) => (
              <PodcastCard
                key={p._id}
                podcast={p as PodcastWithAuthor}
                index={i}
                onOpen={openPodcast}
              />
            ))
          )}
        </Carousel>
      </div>

      {/* ── Right Sidebar ─── stacks below content on < lg, sits beside it on lg+ */}
      <aside className="w-full shrink-0 border-t border-[#252525] px-4 py-6 sm:px-6 bg-[#15171C] lg:w-[349px] lg:border-l lg:border-t-0 lg:py-8 lg:overflow-y-auto">
        {/* Current user card (public page — only show when signed in) */}
        {user && (
          <Link
            to="/my-profile"
            className="flex items-center gap-3 mb-8 cursor-pointer group p-3 rounded-xl hover:bg-white/4 transition-colors -mx-3 block"
          >
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName ?? 'User'}
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
            ) : (
              <GradientBox from="#f59e0b" to="#f97535" className="w-10 h-10 rounded-full shrink-0" />
            )}
            <p className="flex-1 min-w-0 text-white text-base font-bold truncate">
              {user.fullName ?? user.username ?? 'User'}
            </p>
            <ChevronRight
              size={16}
              className="text-[#71788B] group-hover:text-white transition-colors shrink-0"
            />
          </Link>
        )}

        {/* Fans Also Like — swipeable carousel with dot indicators */}
        <FansAlsoLike items={fansItems} loading={popular === undefined} onOpen={openPodcast} />

        {/* Top Podcasters */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Top Podcasters</h3>
          </div>
          <div className="flex flex-col gap-6">
            {topPodcasters === undefined
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-2/3 rounded bg-white/10" />
                      <div className="h-3 w-1/3 rounded bg-white/10" />
                    </div>
                  </div>
                ))
              : topPodcasters.map(({ user: u, count }, i) => {
                  const [from, to] = FALLBACK_PAIRS[i % FALLBACK_PAIRS.length]
                  const author = u as any
                  return (
                    <div
                      key={author?._id ?? i}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      {author?.imageUrl ? (
                        <img
                          src={author.imageUrl}
                          alt={author.name}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <GradientBox from={from} to={to} className="w-10 h-10 rounded-full shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-base font-bold truncate group-hover:text-[#f97535] transition-colors">
                          {author?.name ?? 'Unknown'}
                        </p>
                        <p className="text-[#71788B] text-sm mt-0.5">
                          @{author?.email?.split('@')[0] ?? '—'}
                        </p>
                      </div>
                      <p className="text-[#71788B] text-sm shrink-0">{count} Podcasts</p>
                    </div>
                  )
                })}
          </div>
        </section>
      </aside>
    </div>
  )
}
