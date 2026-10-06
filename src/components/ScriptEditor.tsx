import { useAction, useMutation } from 'convex/react'
import { FileText, Loader2, RefreshCw, Save, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

// Mirrors MAX_SCRIPT_CHARS in convex/podcasts.ts (the TTS step voices at most
// this many characters). The server is authoritative; this drives the counter.
const MAX_SCRIPT_CHARS = 8000
const WORDS_PER_MINUTE = 150

function errorCode(err: unknown): string | undefined {
  return (err as { data?: { code?: string } })?.data?.code
}

// Shown on the podcast page while status === 'script_review': the AI has written
// the script but NO audio exists yet. The author can edit freely, regenerate the
// script, or approve it to start audio generation.
export default function ScriptEditor({
  podcastId,
  title,
  initialScript,
  mode = 'review',
  onClose,
}: {
  podcastId: Id<'podcasts'>
  title: string
  initialScript: string
  // 'review': a freshly written script awaiting approval (full page).
  // 'edit': editing an already published episode, shown inline on its page.
  mode?: 'review' | 'edit'
  onClose?: () => void
}) {
  const isEdit = mode === 'edit'
  const saveScript = useMutation(api.podcasts.saveScript)
  const approveScript = useAction(api.podcasts.approveScript)
  const regenerateScript = useAction(api.podcasts.regenerateScript)

  const [script, setScript] = useState(initialScript)
  const [savedScript, setSavedScript] = useState(initialScript)
  const [busy, setBusy] = useState<'save' | 'approve' | 'regenerate' | null>(null)

  const words = script.trim() ? script.trim().split(/\s+/).length : 0
  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
  const tooLong = script.length > MAX_SCRIPT_CHARS
  const dirty = script !== savedScript
  const canSubmit = !busy && script.trim().length > 0 && !tooLong

  function handleError(err: unknown, fallback: string) {
    switch (errorCode(err)) {
      case 'QUOTA_EXCEEDED':
        toast.error("You've used all your podcast generations. Upgrade to Pro for more.")
        break
      case 'RATE_LIMITED':
        toast.error(
          (err as { data?: { message?: string } }).data?.message ??
            'Generation is busy right now. Please try again in a minute.',
        )
        break
      case 'SCRIPT_TOO_LONG':
        toast.error(`Script is too long — keep it under ${MAX_SCRIPT_CHARS.toLocaleString()} characters.`)
        break
      default:
        console.error(fallback, err)
        toast.error(fallback)
    }
  }

  async function handleSave() {
    setBusy('save')
    try {
      await saveScript({ podcastId, transcript: script })
      setSavedScript(script.trim())
      setScript(script.trim())
      toast.success(isEdit ? 'Script updated. The audio was not changed.' : 'Draft saved.')
      if (isEdit) onClose?.()
    } catch (err) {
      handleError(err, 'Could not save the script. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  async function handleApprove() {
    setBusy('approve')
    try {
      // approveScript saves the text itself, so edits are never lost.
      await approveScript({ podcastId, transcript: script })
      toast.success(isEdit ? 'Script saved. Regenerating the audio.' : 'Script approved. Generating audio.')
      // The page is reactive: status flips to 'generating' and this unmounts.
      onClose?.()
    } catch (err) {
      handleError(err, 'Could not start audio generation. Please try again.')
      setBusy(null)
    }
  }

  async function handleRegenerate() {
    if (dirty && !window.confirm('Replace your edits with a brand-new AI script?')) return
    setBusy('regenerate')
    try {
      await regenerateScript({ podcastId })
    } catch (err) {
      handleError(err, 'Could not regenerate the script. Please try again.')
      setBusy(null)
    }
  }

  return (
    <div className={isEdit ? '' : 'px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-3xl'}>
      {isEdit ? null : (
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f97535]/15 px-3 py-0.5 text-xs font-semibold text-[#f97535] mb-3">
            <FileText size={12} />
            Review script
          </span>
          <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
          <p className="text-[#71788B] text-sm leading-relaxed">
            Your script is ready. Edit anything you like: fix facts, adjust the tone, trim it down.
            Then approve it to generate the audio. Nothing is voiced until you approve.
          </p>
        </div>
      )}

      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        disabled={busy !== null}
        rows={isEdit ? 14 : 18}
        aria-label="Podcast script"
        className="w-full rounded-xl bg-[#15171C] px-5 py-4 text-sm leading-relaxed text-white/90 placeholder:text-[#71788B] border border-[#252525] outline-none focus:border-[#f97535] transition-colors resize-y disabled:opacity-60"
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#71788B]">
        <span>
          {words.toLocaleString()} words, about {minutes} min of audio
        </span>
        <span className={tooLong ? 'text-red-400 font-semibold' : ''}>
          {script.length.toLocaleString()} / {MAX_SCRIPT_CHARS.toLocaleString()} characters
        </span>
      </div>

      {isEdit ? (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-white">How do you want to apply your changes?</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-xl border border-[#f97535]/40 bg-[#f97535]/5 p-4">
              <button
                type="button"
                disabled={!canSubmit || !dirty}
                onClick={handleApprove}
                className="flex items-center justify-center gap-2 rounded-md bg-[#f97535] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy === 'approve' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Wand2 size={16} />
                )}
                Save and re-record audio
              </button>
              <p className="text-xs leading-relaxed text-white/70">
                Best when you changed what is said. The episode is recorded again from your new
                script and is unavailable for a few minutes. Your cover art and listeners are kept.
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-[#252525] bg-[#15171C] p-4">
              <button
                type="button"
                disabled={!canSubmit || !dirty}
                onClick={handleSave}
                className="flex items-center justify-center gap-2 rounded-md border border-[#3a3d45] px-4 py-3 text-sm font-bold text-white transition-colors hover:border-[#f97535]/50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {busy === 'save' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                Save text only
              </button>
              <p className="text-xs leading-relaxed text-white/70">
                Best for fixing typos in the written transcript. The audio is not changed, so it
                will not match any wording you edit.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy !== null}
            onClick={onClose}
            className="mt-4 text-sm font-bold text-[#71788B] transition-colors hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      ) : (
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canSubmit || (isEdit && !dirty)}
          onClick={handleApprove}
          className="flex items-center gap-2 rounded-md bg-[#f97535] px-[22px] py-[14px] text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy === 'approve' ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
          {isEdit ? 'Save and regenerate audio' : 'Approve & generate audio'}
        </button>
        <button
          type="button"
          disabled={!canSubmit || !dirty}
          onClick={handleSave}
          className="flex items-center gap-2 rounded-md border border-[#252525] bg-[#15171C] px-5 py-[14px] text-base font-bold text-white hover:border-[#f97535]/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy === 'save' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {isEdit ? 'Update text only' : 'Save draft'}
        </button>
        {isEdit ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={onClose}
            className="rounded-md border border-[#252525] bg-[#15171C] px-5 py-[14px] text-base font-bold text-[#71788B] hover:text-white transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
        ) : (
          <button
            type="button"
            disabled={busy !== null}
            onClick={handleRegenerate}
            className="flex items-center gap-2 rounded-md border border-[#252525] bg-[#15171C] px-5 py-[14px] text-base font-bold text-[#71788B] hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy === 'regenerate' ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <RefreshCw size={15} />
            )}
            Write a new script
          </button>
        )}
      </div>
      )}
    </div>
  )
}
