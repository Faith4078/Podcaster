import { useUser } from '@clerk/tanstack-react-start'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { ChevronRight, Headphones, MoreHorizontal, Play } from 'lucide-react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import BookmarkButton from '../components/BookmarkButton'
import { usePlayerStore } from '../store/playerStore'

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
    <div className="animate-pulse">
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

function PodcastCard({
  podcast,
  index,
  onPlay,
}: {
  podcast: PodcastWithAuthor
  index: number
  onPlay: (p: PodcastWithAuthor) => void
}) {
  const [from, to] = gradient(podcast.category, index)
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Play ${podcast.title}`}
      className="cursor-pointer group"
      onClick={() => onPlay(podcast)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPlay(podcast)
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
        {/* Bookmark toggle overlays the cover; stops propagation so it doesn't play. */}
        <div className="absolute right-2 top-2">
          <BookmarkButton podcastId={podcast._id} />
        </div>
      </div>
      <p className="text-white text-base font-bold truncate">{podcast.title}</p>
      <p className="text-[#71788B] text-sm mt-0.5 truncate">{podcast.author?.name ?? 'Unknown'}</p>
    </div>
  )
}

// ── Home page ─────────────────────────────────────────────────────────────────
function HomePage() {
  const { user } = useUser()
  const play = usePlayerStore((s) => s.play)
  const incrementListeners = useMutation(api.podcasts.incrementListeners)

  const trending = useQuery(api.podcasts.getTrending, { limit: 4 })
  const latest = useQuery(api.podcasts.getLatest, { limit: 6 })
  const popular = useQuery(api.podcasts.getPopular, { limit: 4 })
  const topPodcasters = useQuery(api.users.getTopPodcasters, { limit: 4 })

  function handlePlay(podcast: PodcastWithAuthor) {
    if (!podcast.audioUrl) return
    const [from, to] = gradient(podcast.category)
    incrementListeners({ id: podcast._id })
    play({
      id: podcast._id,
      title: podcast.title,
      author: podcast.author?.name ?? 'Unknown',
      audioUrl: podcast.audioUrl,
      imageGradient: { from, to },
    })
  }

  const featuredPodcast = popular?.[0]

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {/* Trending Podcasts */}
        <section className="mb-10">
          <h2 className="mb-5 text-xl font-bold text-white">Trending Podcasts</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {trending === undefined ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : trending.length === 0 ? (
              <p className="col-span-full text-[#71788B] text-sm">No trending podcasts yet.</p>
            ) : (
              trending.map((p, i) => (
                <PodcastCard
                  key={p._id}
                  podcast={p as PodcastWithAuthor}
                  index={i}
                  onPlay={handlePlay}
                />
              ))
            )}
          </div>
        </section>

        {/* Latest Podcasts */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">Latest Podcasts</h2>
            <Link
              to="/discover"
              className="text-base font-semibold text-[#f97535] hover:text-[#f97535]/80 transition-colors"
            >
              See All
            </Link>
          </div>

          <div className="flex flex-col">
            {latest === undefined ? (
              Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
            ) : latest.length === 0 ? (
              <p className="text-[#71788B] text-sm">
                No podcasts yet — be the first to create one!
              </p>
            ) : (
              latest.map((p, i) => {
                const [from, to] = gradient(p.category, i)
                return (
                  <div
                    key={p._id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Play ${p.title}`}
                    className={`flex items-center gap-4 py-3.5 cursor-pointer group hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors ${
                      i < latest.length - 1 ? 'border-b border-[#252525]' : ''
                    }`}
                    onClick={() => handlePlay(p as PodcastWithAuthor)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handlePlay(p as PodcastWithAuthor)
                      }
                    }}
                  >
                    <span className="w-5 text-center text-base font-bold shrink-0 text-[#71788B]">
                      {i + 1}
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

                    <p className="flex-1 min-w-0 text-base font-bold truncate text-white">
                      {p.title}
                    </p>

                    <div className="flex items-center gap-5 text-xs text-[#71788B] shrink-0">
                      <span className="flex items-center gap-1.5">
                        <Headphones size={13} />
                        {p.listenerCount.toLocaleString()}
                      </span>
                      <span className="text-[#71788B] text-xs">{p.author?.name ?? '—'}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="More options"
                      title="More options"
                      className="flex items-center gap-1 text-[#71788B] hover:text-white transition-colors shrink-0 ml-1 px-2 py-1 rounded-lg hover:bg-white/[0.06] text-xs font-semibold"
                    >
                      <MoreHorizontal size={16} />
                      More
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Popular Podcasts */}
        <section>
          <h2 className="mb-5 text-xl font-bold text-white">Popular Podcasts</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {popular === undefined ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : popular.length === 0 ? (
              <p className="col-span-full text-[#71788B] text-sm">No podcasts yet.</p>
            ) : (
              popular.map((p, i) => (
                <PodcastCard
                  key={p._id}
                  podcast={p as PodcastWithAuthor}
                  index={i}
                  onPlay={handlePlay}
                />
              ))
            )}
          </div>
        </section>
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
              <GradientBox
                from="#f59e0b"
                to="#f97535"
                className="w-10 h-10 rounded-full shrink-0"
              />
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

        {/* Fans Also Like — first popular podcast */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Fans Also Like</h3>
            <Link
              to="/discover"
              className="text-base font-semibold text-[#f97535] hover:text-[#f97535]/80 transition-colors"
            >
              See All
            </Link>
          </div>

          {featuredPodcast ? (
            <div
              role="button"
              tabIndex={0}
              aria-label={`Play ${featuredPodcast.title}`}
              className="cursor-pointer group"
              onClick={() => handlePlay(featuredPodcast as PodcastWithAuthor)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handlePlay(featuredPodcast as PodcastWithAuthor)
                }
              }}
            >
              {featuredPodcast.thumbnailUrl ? (
                <img
                  src={featuredPodcast.thumbnailUrl}
                  alt={featuredPodcast.title}
                  className="h-44 w-full rounded-xl mb-3 object-cover group-hover:opacity-90 transition-opacity"
                />
              ) : (
                <GradientBox
                  from={gradient(featuredPodcast.category)[0]}
                  to={gradient(featuredPodcast.category)[1]}
                  className="h-44 w-full rounded-xl mb-3 group-hover:opacity-90 transition-opacity"
                />
              )}
              <p className="text-white text-base font-bold">{featuredPodcast.title}</p>
              <p className="text-[#71788B] text-sm mt-0.5">
                {featuredPodcast.author?.name ?? 'Unknown'}
              </p>
              <div className="flex gap-1.5 mt-3">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full ${i === 0 ? 'w-4 bg-[#f97535]' : 'w-1.5 bg-white/20'}`}
                  />
                ))}
              </div>
            </div>
          ) : popular === undefined ? (
            <div className="h-44 w-full rounded-xl bg-white/10 animate-pulse mb-3" />
          ) : null}
        </section>

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
                        <GradientBox
                          from={from}
                          to={to}
                          className="w-10 h-10 rounded-full shrink-0"
                        />
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
