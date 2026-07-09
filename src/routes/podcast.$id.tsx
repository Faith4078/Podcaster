import { useUser } from '@clerk/tanstack-react-start'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAction, useMutation, useQuery } from 'convex/react'
import { AlertCircle, BarChart3, Crown, Edit2, Loader2, Play, RefreshCw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import BookmarkButton from '../components/BookmarkButton'
import { usePlayerStore } from '../store/playerStore'

export const Route = createFileRoute('/podcast/$id')({ component: PodcastDetailPage })

const STEP_LABELS: Record<string, string> = {
  generating_script: 'Writing script',
  generating_audio: 'Generating audio',
  generating_thumbnail: 'Creating thumbnail',
  embedding: 'Building search index',
  generate: 'Processing',
}

function GradientBox({ from, to, className }: { from: string; to: string; className?: string }) {
  return (
    <div className={className} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
  )
}

function SmallPodcastCard({
  name,
  author,
  from,
  to,
  plays,
  onClick,
}: {
  name: string
  author: string
  from: string
  to: string
  plays: string
  onClick: () => void
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${name}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="flex items-center gap-3 rounded-xl bg-[#15171C] border border-[#252525] hover:border-[#f97535]/30 transition-colors cursor-pointer px-3 py-2.5"
    >
      <GradientBox from={from} to={to} className="w-10 h-10 rounded-[3px] shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-bold truncate">{name}</p>
        <p className="text-[#71788B] text-xs mt-0.5 truncate">{author}</p>
        <span className="flex items-center gap-1 mt-0.5 text-[#71788B] text-[10px]">
          <BarChart3 size={10} />
          {plays}
        </span>
      </div>
    </div>
  )
}

const PLACEHOLDER_GRADIENT = { from: '#1e3a5f', to: '#2563eb' }

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
function catGradient(category: string): [string, string] {
  return CAT_GRADIENTS[category] ?? ['#1e3a5f', '#2563eb']
}

function PodcastDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const play = usePlayerStore((s) => s.play)
  const { user } = useUser()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isRegeneratingThumbnail, setIsRegeneratingThumbnail] = useState(false)

  const podcast = useQuery(api.podcasts.getById, { id: id as Id<'podcasts'> })
  const convexUser = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : 'skip')

  // Vector-based recommendations come from an action (vector search is
  // action-only), so they aren't reactive — fetch on mount/id change.
  const getSimilar = useAction(api.podcasts.getSimilar)
  const [similar, setSimilar] = useState<Array<Record<string, any>> | undefined>(undefined)
  useEffect(() => {
    let cancelled = false
    getSimilar({ podcastId: id as Id<'podcasts'>, limit: 4 })
      .then((r) => {
        if (!cancelled) setSimilar(r as Array<Record<string, any>>)
      })
      .catch(() => {
        if (!cancelled) setSimilar([])
      })
    return () => {
      cancelled = true
    }
  }, [id, getSimilar])

  const deletePodcast = useMutation(api.podcasts.deletePodcast)
  const retry = useAction(api.podcasts.retryGeneration)
  const regenerateThumbnail = useAction(api.podcasts.regenerateThumbnail)

  const isOwner = !!(convexUser && podcast && convexUser._id === podcast.authorId)

  async function handleRegenerateThumbnail(e: React.MouseEvent) {
    e.stopPropagation()
    setIsRegeneratingThumbnail(true)
    try {
      await regenerateThumbnail({ podcastId: id as Id<'podcasts'> })
    } finally {
      setIsRegeneratingThumbnail(false)
    }
  }

  async function handleRetry() {
    try {
      await retry({ podcastId: id as Id<'podcasts'> })
    } catch (err) {
      if ((err as { data?: { code?: string } })?.data?.code === 'RATE_LIMITED') {
        toast.error(
          (err as { data?: { message?: string } }).data?.message ??
            'Generation is busy right now. Please try again in a minute.',
        )
      } else {
        console.error('Failed to retry generation', err)
        toast.error('Failed to retry generation. Please try again.')
      }
    }
  }

  async function handleDelete() {
    if (!convexUser || !podcast) return
    setIsDeleting(true)
    try {
      await deletePodcast({ id: id as Id<'podcasts'>, authorId: convexUser._id })
      navigate({ to: '/' })
    } catch {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (podcast === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f97535] border-t-transparent" />
      </div>
    )
  }

  if (podcast === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-[#71788B]">
        <AlertCircle size={32} />
        <p className="text-base font-bold text-white">Podcast not found</p>
      </div>
    )
  }

  const author = (podcast as any).author
  const authorName = author?.name ?? 'Unknown'
  const authorImage = author?.imageUrl ?? null

  // ── Generating / Pending ─────────────────────────────────────────────────
  if (podcast.status === 'pending' || podcast.status === 'generating') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-8 px-8">
        <div className="w-full max-w-sm rounded-xl bg-[#15171C] border border-[#252525] p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f97535]/10">
            <Loader2 size={28} className="animate-spin text-[#f97535]" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Generating your podcast</h2>
          <p className="text-[#71788B] text-sm mb-8">Sit tight — this usually takes a minute.</p>

          <div className="flex flex-col gap-4 text-left">
            {(['generating_script', 'generating_audio', 'generating_thumbnail'] as const).map(
              (step, i) => {
                const isDone = podcast.status === 'ready'
                const isCurrent = podcast.status === 'generating' && i === 0
                return (
                  <div key={step} className="flex items-center gap-3">
                    {isDone ? (
                      <div className="h-5 w-5 rounded-full bg-[#f97535] flex items-center justify-center shrink-0">
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path
                            d="M1 4l3 3 5-6"
                            stroke="#fff"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : isCurrent ? (
                      <Loader2 size={20} className="animate-spin text-[#f97535] shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-[#252525] shrink-0" />
                    )}
                    <span
                      className={`text-sm font-medium ${isCurrent ? 'text-white' : 'text-[#71788B]'}`}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  </div>
                )
              }
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Failed ───────────────────────────────────────────────────────────────
  if (podcast.status === 'failed') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-8">
        <div className="w-full max-w-sm rounded-xl bg-[#15171C] border border-[#252525] p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle size={24} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Generation failed</h2>
          {podcast.failedStep && (
            <p className="text-[#71788B] text-sm mb-1">
              Failed at:{' '}
              <span className="text-white">
                {STEP_LABELS[podcast.failedStep] ?? podcast.failedStep}
              </span>
            </p>
          )}
          {podcast.errorMsg && (
            <p className="text-red-400/70 text-xs mt-2 mb-6 font-mono break-all">
              {podcast.errorMsg}
            </p>
          )}
          <button
            type="button"
            onClick={() => handleRetry()}
            className="flex items-center gap-2 mx-auto rounded-md bg-[#f97535] px-6 py-3 text-base font-bold text-white hover:opacity-90 transition-opacity"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const canPlay = !!(podcast.audioStorageId || podcast.audioUrl)

  // ── Ready ─────────────────────────────────────────────────────────────────
  function handlePlay() {
    if (!podcast || podcast.status !== 'ready' || !canPlay || !podcast.audioUrl) return
    // Listens are recorded by the MiniPlayer after 30s of real playback —
    // clicking play deliberately does NOT count as a listen.
    play({
      id,
      title: podcast.title,
      author: authorName,
      audioUrl: podcast.audioUrl,
      imageGradient: PLACEHOLDER_GRADIENT,
      thumbnailUrl: podcast.thumbnailUrl ?? undefined,
    })
  }

  const transcriptParas = podcast.transcript
    ? podcast.transcript.split('\n\n').filter(Boolean)
    : []

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Main content */}
      <div className="flex-1 min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="flex flex-col items-start gap-6 mb-10 sm:flex-row sm:gap-8">
          <div
            role="button"
            tabIndex={0}
            aria-label={`Play ${podcast.title}`}
            className="relative shrink-0 group cursor-pointer mx-auto sm:mx-0"
            onClick={handlePlay}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handlePlay()
              }
            }}
          >
            {podcast.thumbnailUrl ? (
              <img
                src={podcast.thumbnailUrl}
                alt={podcast.title}
                className="w-44 h-44 rounded-2xl object-cover sm:w-56 sm:h-56"
              />
            ) : (
              <div className="relative">
                <GradientBox
                  from={PLACEHOLDER_GRADIENT.from}
                  to={PLACEHOLDER_GRADIENT.to}
                  className="w-44 h-44 rounded-2xl sm:w-56 sm:h-56"
                />
                {isOwner && (
                  <button
                    type="button"
                    disabled={isRegeneratingThumbnail}
                    onClick={handleRegenerateThumbnail}
                    className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-center gap-2 rounded-md bg-black/60 px-3 py-2 text-xs font-bold text-white hover:bg-black/75 transition-colors disabled:opacity-50"
                  >
                    {isRegeneratingThumbnail ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    Generate cover art
                  </button>
                )}
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f97535]">
                <Play size={22} fill="white" className="text-white ml-1" />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-2">
            <span className="inline-block rounded-full bg-[#f97535]/15 px-3 py-0.5 text-xs font-semibold text-[#f97535] mb-3">
              {podcast.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">{podcast.title}</h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-4">
              {authorImage ? (
                <img
                  src={authorImage}
                  alt={authorName}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
              ) : (
                <GradientBox
                  from="#f59e0b"
                  to="#f97535"
                  className="w-7 h-7 rounded-full shrink-0"
                />
              )}
              <span className="text-white text-sm font-semibold">{authorName}</span>
              {author?.plan === 'pro' && (
                <span className="flex items-center gap-1 rounded-full bg-[#f97535] px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Crown size={10} />
                  Pro
                </span>
              )}
            </div>

            <div className="flex items-center gap-5 text-[#71788B] text-xs mb-5">
              <span className="flex items-center gap-1.5">
                <BarChart3 size={13} />
                {podcast.listenerCount.toLocaleString()} listeners
              </span>
              <span>Voice: {podcast.speaker1Voice}</span>
            </div>

            <p className="text-[#71788B] text-sm leading-relaxed max-w-xl">{podcast.description}</p>

            <div className="mt-6 flex items-center gap-3 flex-wrap">
              {canPlay ? (
                <button
                  type="button"
                  onClick={handlePlay}
                  className="flex items-center gap-2 rounded-md bg-[#f97535] px-[22px] py-[14px] text-base font-bold text-white hover:opacity-90 transition-opacity"
                >
                  <Play size={16} fill="white" />
                  Play Episode
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-[#71788B] text-sm">No audio file for this episode yet.</p>
                  <button
                    type="button"
                    onClick={() => handleRetry()}
                    className="flex items-center gap-2 rounded-md border border-[#252525] bg-[#15171C] px-4 py-2 text-sm font-bold text-[#f97535] hover:border-[#f97535]/40 transition-colors"
                  >
                    <RefreshCw size={14} />
                    Regenerate audio
                  </button>
                </div>
              )}

              {/* Bookmark toggle — available to everyone (signed-out users are
                  nudged to sign in; Free users at the limit to /billing). */}
              <BookmarkButton podcastId={id as Id<'podcasts'>} variant="button" />

              {isOwner && (
                <>
                  <Link
                    to="/edit/$id"
                    params={{ id }}
                    className="flex items-center gap-2 rounded-md border border-[#252525] bg-[#15171C] px-5 py-[14px] text-base font-bold text-white hover:border-[#f97535]/40 transition-colors"
                  >
                    <Edit2 size={15} />
                    Edit
                  </Link>

                  {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#71788B]">Delete this podcast?</span>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={handleDelete}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
                      >
                        {isDeleting ? 'Deleting…' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="rounded-md border border-[#252525] px-4 py-2 text-sm font-bold text-[#71788B] hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 rounded-md border border-[#252525] bg-[#15171C] px-5 py-[14px] text-base font-bold text-[#71788B] hover:border-red-500/40 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Transcript */}
        {transcriptParas.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-white mb-5">Transcript</h2>
            <div className="rounded-xl bg-[#15171C] border border-[#252525] px-6 py-5 flex flex-col gap-4">
              {transcriptParas.map((para, i) => (
                <p key={i} className="text-white/80 text-sm leading-relaxed">{para}</p>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Right sidebar — stacks below content on < lg, beside it on lg+ */}
      <aside className="w-full shrink-0 border-t border-[#252525] bg-[#15171C] px-4 py-6 sm:px-6 lg:w-[349px] lg:border-l lg:border-t-0 lg:py-8 lg:overflow-y-auto">
        <section>
          <h3 className="text-base font-bold text-white mb-4">You Might Also Like</h3>
          <div className="flex flex-col gap-2">
            {similar === undefined
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                    <div className="w-10 h-10 rounded-[3px] bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-white/10" />
                      <div className="h-2.5 w-1/2 rounded bg-white/10" />
                    </div>
                  </div>
                ))
              : similar
                  .filter((p) => p._id !== id)
                  .slice(0, 3)
                  .map((p) => {
                    const [from, to] = catGradient(p.category)
                    const author = (p as any).author
                    return (
                      <SmallPodcastCard
                        key={p._id}
                        name={p.title}
                        author={author?.name ?? 'Unknown'}
                        from={from}
                        to={to}
                        plays={p.listenerCount.toLocaleString()}
                        onClick={() =>
                          navigate({
                            to: '/podcast/$id',
                            params: { id: p._id as Id<'podcasts'> },
                          })
                        }
                      />
                    )
                  })
            }
          </div>
        </section>
      </aside>
    </div>
  )
}
