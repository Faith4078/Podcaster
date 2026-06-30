import { useAuth, useUser } from '@clerk/tanstack-react-start'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import { BarChart3, Bookmark, ChevronLeft, Crown, Folder, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import BookmarkButton from '../components/BookmarkButton'

export const Route = createFileRoute('/bookmarks')({ component: BookmarksPage })

// Mirrors FREE_BOOKMARK_LIMIT (convex/bookmarks.ts). The backend gate is
// authoritative; this is for the "N/3 saved" usage copy + upgrade nudge.
const FREE_BOOKMARK_LIMIT = 3

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

type FolderSummary = { _id: Id<'bookmarkFolders'>; name: string; count: number }

function BookmarkRow({ podcast }: { podcast: Podcast }) {
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
      {/* Toggle lives above the Link so it can remove without navigating. */}
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

// One folder's saved podcasts. Querying per selected folder keeps the page light
// (only the open folder hydrates its podcasts).
function FolderContents({ folderId }: { folderId: Id<'bookmarkFolders'> }) {
  const bookmarks = useQuery(api.bookmarks.listMyBookmarks, { folderId })

  if (bookmarks === undefined) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
      </div>
    )
  }
  if (bookmarks.length === 0) {
    return (
      <p className="text-[#71788B] text-sm">
        This folder is empty — its podcasts may still be generating, or were removed.
      </p>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
      {(bookmarks as Podcast[]).map((p) => <BookmarkRow key={p._id} podcast={p} />)}
    </div>
  )
}

function BookmarksPage() {
  const { user } = useUser()
  const { has } = useAuth()
  const isPro = has?.({ plan: 'pro' }) === true

  const folders = useQuery(api.bookmarks.listMyFolders, user ? {} : 'skip')
  const bookmarkedIds = useQuery(api.bookmarks.myBookmarkedIds, user ? {} : 'skip')
  const deleteFolder = useMutation(api.bookmarks.deleteFolder)

  // Selected folder. `null` = the landing view (a grid of clickable folders);
  // a folder id = that folder's saved podcasts. Reset to the landing view if the
  // open folder vanishes (e.g. deleted).
  const [selected, setSelected] = useState<Id<'bookmarkFolders'> | null>(null)
  useEffect(() => {
    if (selected && folders && !folders.some((f) => f._id === selected)) {
      setSelected(null)
    }
  }, [folders, selected])

  // Inline delete confirm. Holds the folder awaiting a "Yes" before the cascade
  // delete fires; `null` = nothing pending. The reactive `folders` query drops
  // the folder on success (and the effect above returns to the landing view if
  // the open folder was the one removed), so we just clear the pending state.
  const [pendingDelete, setPendingDelete] = useState<Id<'bookmarkFolders'> | null>(null)
  async function handleDelete(folderId: Id<'bookmarkFolders'>) {
    await deleteFolder({ folderId })
    setPendingDelete(null)
  }

  // Count off the ids query (every bookmark, including not-yet-ready), so the
  // "N/3" usage matches what the server gate actually counts.
  const count = bookmarkedIds?.length ?? 0
  const atLimit = !isPro && count >= FREE_BOOKMARK_LIMIT

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8">
      <div className="flex items-center gap-3 mb-2">
        <Bookmark size={20} className="text-[#f97535]" />
        <h1 className="text-xl font-bold text-white">Bookmarks</h1>
      </div>
      <p className="text-[#71788B] text-sm mb-7">
        Your saved podcasts, organized into folders.
        {!isPro && bookmarkedIds !== undefined && (
          <>
            {' '}
            <span className="font-semibold text-white">{count}</span>/{FREE_BOOKMARK_LIMIT} used.
          </>
        )}
      </p>

      {/* Free, at-limit upgrade nudge (Pro users never see this). */}
      {atLimit && (
        <div className="mb-7 rounded-xl border border-[#f97535]/30 bg-[#f97535]/8 p-5">
          <div className="flex items-start gap-3">
            <Crown size={20} className="mt-0.5 shrink-0 text-[#f97535]" />
            <div className="flex-1">
              <p className="text-base font-bold text-white mb-1">
                You've saved all {FREE_BOOKMARK_LIMIT} free bookmarks.
              </p>
              <p className="text-sm text-[#71788B] mb-4">
                Remove one to save another, or upgrade to Pro for unlimited bookmarks.
              </p>
              <Link
                to="/billing"
                className="inline-flex items-center gap-2 rounded-md bg-[#f97535] px-[22px] py-[14px] text-base font-bold text-white transition-opacity hover:opacity-90"
              >
                <Crown size={16} />
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      )}

      {folders === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      ) : folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-[#71788B]">
          <Bookmark size={32} />
          <p className="text-base font-bold text-white">No bookmarks yet</p>
          <p className="text-sm max-w-sm">
            Tap the bookmark icon on any podcast to save it into a folder.{' '}
            <Link to="/discover" className="font-semibold text-[#f97535] hover:underline">
              Discover podcasts
            </Link>
            .
          </p>
        </div>
      ) : selected === null ? (
        // Landing view — a grid of clickable folders.
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {(folders as FolderSummary[]).map((folder) => (
            <div
              key={folder._id}
              className="group relative flex flex-col gap-3 rounded-xl border border-[#252525] bg-[#15171C] p-5 text-left transition-colors hover:border-[#f97535]/40"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelected(folder._id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected(folder._id)
                  }
                }}
                className="flex flex-col gap-3"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#f97535]/10">
                  <Folder size={22} className="text-[#f97535]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-white">{folder.name}</p>
                  <p className="text-sm text-[#71788B]">
                    {folder.count} {folder.count === 1 ? 'podcast' : 'podcasts'}
                  </p>
                </div>
              </div>
              {/* Delete affordance — sits above the open-folder region so it never
                  triggers selection. First click arms an inline confirm. */}
              {pendingDelete === folder._id ? (
                <div className="absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-[#101114] px-2 py-1">
                  <span className="text-xs text-[#71788B]">Delete folder?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(folder._id)}
                    className="rounded px-1.5 py-0.5 text-xs font-bold text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    className="rounded px-1.5 py-0.5 text-xs font-semibold text-[#71788B] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`Delete folder ${folder.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPendingDelete(folder._id)
                  }}
                  className="absolute right-2 top-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#71788B] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Folder view — its saved podcasts, with a back link to the folder grid.
        <>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#71788B] transition-colors hover:text-white"
          >
            <ChevronLeft size={16} />
            All folders
          </button>
          {(() => {
            const folder = (folders as FolderSummary[]).find((f) => f._id === selected)
            return folder ? (
              <div className="mb-5 flex items-center gap-2">
                <Folder size={18} className="text-[#f97535]" />
                <h2 className="text-lg font-bold text-white">{folder.name}</h2>
                <span className="text-sm text-[#71788B]">{folder.count}</span>
                {pendingDelete === folder._id ? (
                  <div className="ml-1 flex items-center gap-1.5 rounded-md bg-[#101114] px-2 py-1">
                    <span className="text-xs text-[#71788B]">Delete folder?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(folder._id)}
                      className="rounded px-1.5 py-0.5 text-xs font-bold text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDelete(null)}
                      className="rounded px-1.5 py-0.5 text-xs font-semibold text-[#71788B] hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label={`Delete folder ${folder.name}`}
                    onClick={() => setPendingDelete(folder._id)}
                    className="ml-1 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#71788B] hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>
            ) : null
          })()}
          <FolderContents folderId={selected} />
        </>
      )}
    </div>
  )
}
