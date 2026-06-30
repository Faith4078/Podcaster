import { useAuth, useUser } from '@clerk/tanstack-react-start'
import { useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { Bookmark, BookmarkCheck, Check, FolderPlus, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

// Mirrors FREE_BOOKMARK_LIMIT (convex/bookmarks.ts). The backend gate is
// authoritative; this is only for the inline usage copy + upgrade nudge.
const FREE_BOOKMARK_LIMIT = 3

// A reactive bookmark control. The button reflects whether this podcast is saved
// in ANY folder (myBookmarkedIds, reactive); clicking opens a small popover that
// lists the user's folders to save into, plus an inline "New folder" flow (type a
// name → it's created → the podcast is saved into it). Saving never navigates or
// plays (the popover is rendered above the card's Link/onClick).
//
// For a Free user at the limit (or if addBookmark races to BOOKMARK_LIMIT), it
// deep-links to /billing instead of surfacing a raw error — matching the Billing
// #2 nudge.
export default function BookmarkButton({
  podcastId,
  variant = 'icon',
  className,
}: {
  podcastId: Id<'podcasts'>
  /** `icon` for cards (compact); `button` for the detail page (labelled pill). */
  variant?: 'icon' | 'button'
  className?: string
}) {
  const { user } = useUser()
  const { has } = useAuth()
  const navigate = useNavigate()

  const bookmarkedIds = useQuery(api.bookmarks.myBookmarkedIds, user ? {} : 'skip')
  const folders = useQuery(api.bookmarks.listMyFolders, user ? {} : 'skip')
  const addBookmark = useMutation(api.bookmarks.addBookmark)
  const removeBookmark = useMutation(api.bookmarks.removeBookmark)

  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isBookmarked = !!bookmarkedIds?.some((id) => id === podcastId)
  const isPro = has?.({ plan: 'pro' }) === true
  const count = bookmarkedIds?.length ?? 0
  const atLimit = !isPro && !isBookmarked && count >= FREE_BOOKMARK_LIMIT

  // Close on outside click + Escape while open.
  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Focus the new-folder input as soon as that mode opens.
  useEffect(() => {
    if (creating) inputRef.current?.focus()
  }, [creating])

  // Reset the inline create state whenever the popover closes.
  useEffect(() => {
    if (!open) {
      setCreating(false)
      setNewName('')
    }
  }, [open])

  // Opening the control. Signed-out → sign in; at-limit Free → /billing; else
  // toggle the folder popover.
  function handleTrigger(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate({ to: '/sign-in' })
      return
    }
    if (atLimit) {
      navigate({ to: '/billing' })
      return
    }
    setOpen((v) => !v)
  }

  // Map a BOOKMARK_LIMIT race to the upgrade page; otherwise toast the failure.
  function onActionError(err: unknown) {
    if ((err as { data?: { code?: string } })?.data?.code === 'BOOKMARK_LIMIT') {
      setOpen(false)
      toast.error("You've used all 3 free bookmarks — upgrade to Pro for unlimited.")
      navigate({ to: '/billing' })
    } else {
      console.error('Bookmark action failed', err)
      toast.error('Something went wrong. Please try again.')
    }
  }

  async function saveToFolder(folderId: Id<'bookmarkFolders'>, folderName: string) {
    if (busy) return
    setBusy(true)
    try {
      await addBookmark({ podcastId, folderId })
      setOpen(false)
      toast.success(`Saved to “${folderName}”`)
    } catch (err) {
      onActionError(err)
    } finally {
      setBusy(false)
    }
  }

  async function createAndSave(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    const name = newName.trim()
    if (busy || !name) return
    setBusy(true)
    try {
      await addBookmark({ podcastId, newFolderName: name })
      setOpen(false)
      toast.success(`Saved to “${name}”`)
    } catch (err) {
      onActionError(err)
    } finally {
      setBusy(false)
    }
  }

  async function unsaveEverywhere() {
    if (busy) return
    setBusy(true)
    try {
      await removeBookmark({ podcastId })
      setOpen(false)
      toast('Removed from bookmarks')
    } catch (err) {
      onActionError(err)
    } finally {
      setBusy(false)
    }
  }

  const Icon = isBookmarked ? BookmarkCheck : Bookmark
  const label = isBookmarked ? 'Saved' : 'Save'

  const trigger =
    variant === 'button' ? (
      <button
        type="button"
        onClick={handleTrigger}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={isBookmarked ? 'Manage bookmark' : 'Save podcast'}
        className={`flex items-center gap-2 rounded-md border px-5 py-[14px] text-base font-bold transition-colors disabled:opacity-50 ${
          isBookmarked
            ? 'border-[#f97535]/40 bg-[#f97535]/10 text-[#f97535]'
            : 'border-[#252525] bg-[#15171C] text-white hover:border-[#f97535]/40'
        } ${className ?? ''}`}
      >
        <Icon size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
        {label}
      </button>
    ) : (
      <button
        type="button"
        onClick={handleTrigger}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={isBookmarked ? 'Manage bookmark' : 'Save podcast'}
        className={`flex h-8 items-center gap-1.5 rounded-full bg-black/50 px-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50 ${
          isBookmarked ? 'text-[#f97535]' : ''
        } ${className ?? ''}`}
      >
        <Icon size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
        {label}
      </button>
    )

  return (
    <div ref={rootRef} className="relative inline-flex">
      {trigger}

      {open && (
        // Folder picker. Stop propagation so clicks inside never reach the card's
        // Link/onClick (which would navigate or play).
        <div
          role="menu"
          aria-label="Save to folder"
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full z-50 mt-2 w-60 max-w-[78vw] rounded-xl border border-[#252525] bg-[#15171C] p-2 shadow-xl shadow-black/40"
        >
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <span className="text-xs font-semibold text-[#71788B]">
              Save to folder
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="text-[#71788B] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Existing folders */}
          <div className="max-h-56 overflow-y-auto">
            {folders === undefined ? (
              <p className="px-2 py-2 text-sm text-[#71788B]">Loading…</p>
            ) : folders.length === 0 ? (
              <p className="px-2 py-2 text-sm text-[#71788B]">
                No folders yet — create one below.
              </p>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder._id}
                  type="button"
                  role="menuitem"
                  disabled={busy}
                  onClick={() => saveToFolder(folder._id, folder.name)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-white transition-colors hover:bg-white/[0.06] disabled:opacity-50"
                >
                  <span className="truncate">{folder.name}</span>
                  <span className="shrink-0 text-xs text-[#71788B]">
                    {folder.count}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Inline new-folder flow */}
          <div className="mt-1 border-t border-[#252525] pt-1">
            {creating ? (
              <form onSubmit={createAndSave} className="flex items-center gap-1.5 p-1">
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Folder name"
                  maxLength={60}
                  className="min-w-0 flex-1 rounded-md border border-[#252525] bg-[#101114] px-2 py-1.5 text-sm text-white placeholder:text-[#71788B] outline-none focus:border-[#f97535] transition-colors"
                />
                <button
                  type="submit"
                  disabled={busy || !newName.trim()}
                  aria-label="Create folder and save"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f97535] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Check size={14} />
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-[#f97535] transition-colors hover:bg-[#f97535]/10"
              >
                <FolderPlus size={15} />
                New folder
              </button>
            )}
          </div>

          {/* Remove from everywhere, when already saved. */}
          {isBookmarked && (
            <div className="mt-1 border-t border-[#252525] pt-1">
              <button
                type="button"
                disabled={busy}
                onClick={unsaveEverywhere}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[#71788B] transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
              >
                <Plus size={15} className="rotate-45" />
                Remove from all folders
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
