import { useUser } from '@clerk/tanstack-react-start'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAction, useQuery } from 'convex/react'
import { AlertCircle, ArrowLeft, Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

export const Route = createFileRoute('/edit/$id')({ component: EditPodcastPage })

const CATEGORIES = [
  'Technology',
  'Business',
  'Education',
  'Entertainment',
  'Health',
  'Science',
  'Sports',
  'True Crime',
  'Comedy',
  'News',
]

const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']

// Fields that require a full pipeline re-run when changed
function needsRegen(
  original: { topicPrompt: string; speaker1Voice: string; thumbnailPrompt?: string },
  draft:    { topicPrompt: string; speaker1Voice: string; thumbnailPrompt: string },
) {
  return (
    draft.topicPrompt     !== original.topicPrompt    ||
    draft.speaker1Voice   !== original.speaker1Voice  ||
    draft.thumbnailPrompt !== (original.thumbnailPrompt ?? '')
  )
}

function EditPodcastPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { user, isLoaded: userLoaded } = useUser()

  const podcast = useQuery(api.podcasts.getById, { id: id as Id<'podcasts'> })
  const convexUser = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : 'skip')
  const editAndRegenerate = useAction(api.podcasts.editAndRegenerate)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [topicPrompt, setTopicPrompt] = useState('')
  const [speaker1Voice, setSpeaker1Voice] = useState('')
  const [thumbnailPrompt, setThumbnailPrompt] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefill once podcast loads
  useEffect(() => {
    if (!podcast) return
    setTitle(podcast.title)
    setDescription(podcast.description)
    setCategory(podcast.category)
    setTopicPrompt(podcast.topicPrompt)
    setSpeaker1Voice(podcast.speaker1Voice)
    setThumbnailPrompt(podcast.thumbnailPrompt ?? '')
  }, [podcast?._id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading state ─────────────────────────────────────────────────────────
  // convexUser stays undefined when query is skipped (user not signed in), so
  // only block on it when we know a user is present and the query is in-flight.
  const convexUserLoading = !!user && convexUser === undefined
  if (!userLoaded || podcast === undefined || convexUserLoading) {
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

  // ── Auth + ownership ──────────────────────────────────────────────────────
  if (!user || !convexUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-[#71788B]">
        <AlertCircle size={32} />
        <p className="text-base font-bold text-white">Sign in to edit podcasts</p>
        <Link to="/sign-in" className="text-[#f97535] text-sm font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    )
  }

  if (convexUser._id !== podcast.authorId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-[#71788B]">
        <AlertCircle size={32} />
        <p className="text-base font-bold text-white">You don't own this podcast</p>
        <Link
          to="/podcast/$id"
          params={{ id }}
          className="text-[#f97535] text-sm font-semibold hover:underline"
        >
          Back to episode
        </Link>
      </div>
    )
  }

  const draft = { topicPrompt, speaker1Voice, thumbnailPrompt }
  const original = {
    topicPrompt:     podcast.topicPrompt,
    speaker1Voice:   podcast.speaker1Voice,
    thumbnailPrompt: podcast.thumbnailPrompt,
  }
  const willRegenerate = needsRegen(original, draft)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!convexUser) return
    setSaving(true)
    setError(null)
    try {
      await editAndRegenerate({
        id: id as Id<'podcasts'>,
        authorId: convexUser._id,
        title:           title.trim()           || undefined,
        description:     description.trim()     || undefined,
        category:        category               || undefined,
        topicPrompt:     topicPrompt.trim()     || undefined,
        speaker1Voice:   speaker1Voice          || undefined,
        thumbnailPrompt: thumbnailPrompt.trim() || undefined,
        needsRegeneration: willRegenerate,
      })
      navigate({ to: '/podcast/$id', params: { id } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      setSaving(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-[#252525] bg-[#15171C] px-4 py-3 text-white text-sm placeholder:text-[#71788B] focus:border-[#f97535]/50 focus:outline-none transition-colors'
  const labelClass = 'block text-sm font-semibold text-white mb-2'

  return (
    <div className="min-h-full px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        to="/podcast/$id"
        params={{ id }}
        className="inline-flex items-center gap-2 text-[#71788B] text-sm font-semibold hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Back to episode
      </Link>

      <h1 className="text-2xl font-bold text-white mb-1">Edit Podcast</h1>
      <p className="text-[#71788B] text-sm mb-8">
        Changes to the topic, voices, or thumbnail prompt will trigger a full re-generation.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Title */}
        <div>
          <label className={labelClass}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={inputClass}
            placeholder="Episode title"
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelClass}>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className={`${inputClass} cursor-pointer`}
          >
            <option value="" disabled>
              Select a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={`${inputClass} resize-none`}
            placeholder="Brief episode description"
          />
        </div>

        {/* Topic prompt */}
        <div>
          <label className={labelClass}>
            Topic / Script Prompt
            <span className="ml-2 text-[10px] font-normal text-[#f97535] uppercase tracking-wide">
              re-generates audio
            </span>
          </label>
          <textarea
            value={topicPrompt}
            onChange={(e) => setTopicPrompt(e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="Describe what the podcast episode should cover…"
          />
        </div>

        {/* Voice */}
        <div>
          <label className={labelClass}>
            Voice
            <span className="ml-2 text-[10px] font-normal text-[#f97535] uppercase tracking-wide">
              re-generates audio
            </span>
          </label>
          <select
            value={speaker1Voice}
            onChange={(e) => setSpeaker1Voice(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {VOICES.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Thumbnail prompt */}
        <div>
          <label className={labelClass}>
            Thumbnail Prompt
            <span className="ml-2 text-[10px] font-normal text-[#f97535] uppercase tracking-wide">
              re-generates thumbnail
            </span>
          </label>
          <input
            type="text"
            value={thumbnailPrompt}
            onChange={(e) => setThumbnailPrompt(e.target.value)}
            className={inputClass}
            placeholder="Describe the thumbnail image (optional)"
          />
        </div>

        {/* Re-generation notice */}
        {willRegenerate && (
          <div className="rounded-xl border border-[#f97535]/25 bg-[#f97535]/8 px-4 py-3 flex items-start gap-3">
            <Loader2 size={16} className="text-[#f97535] shrink-0 mt-0.5" />
            <p className="text-sm text-[#f97535]">
              These changes will trigger a full re-generation. The episode will enter the pending
              state while the new audio and thumbnail are created.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-[#f97535] px-6 py-3 text-base font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save size={16} />
                {willRegenerate ? 'Save & Regenerate' : 'Save Changes'}
              </>
            )}
          </button>

          <Link
            to="/podcast/$id"
            params={{ id }}
            className="rounded-md border border-[#252525] px-6 py-3 text-base font-bold text-[#71788B] hover:text-white transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
