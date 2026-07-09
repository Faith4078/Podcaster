import { useMutation } from 'convex/react'
import { ChevronDown, Pause, Play, Repeat, Shuffle, SkipForward, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { LISTEN_THRESHOLD_SECONDS, usePlayerStore } from '../store/playerStore'

function formatTime(secs: number) {
  if (!secs || Number.isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function SkipButton({ seconds, onClick }: { seconds: number; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center text-[#7f8596] hover:text-white transition-colors"
      aria-label={`${seconds > 0 ? 'Forward' : 'Rewind'} ${Math.abs(seconds)} seconds`}
      title={`${seconds > 0 ? 'Forward' : 'Rewind'} ${Math.abs(seconds)} seconds`}
    >
      {seconds < 0 ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 1 0 .49-3.51" />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 4v6h-6" />
          <path d="M20.49 15a9 9 0 1 1-.49-3.51" />
        </svg>
      )}
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold leading-none mt-px">
        {Math.abs(seconds)}
      </span>
    </button>
  )
}

export default function MiniPlayer() {
  const { currentTrack, isPlaying, pause, resume, stop } = usePlayerStore()
  const recordListen = useMutation(api.podcasts.incrementListeners)
  const audioRef = useRef<HTMLAudioElement>(null)
  // Last observed audio position — used to derive how much was ACTUALLY played
  // between timeupdate events (a seek produces a jump we don't credit).
  const lastPlaybackTimeRef = useRef<number | null>(null)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isShuffled, setShuffled] = useState(false)
  const [isRepeat, setRepeat] = useState(false)
  // Full-screen "now playing" view. Toggled by tapping the mini bar; the same
  // <audio> element keeps playing underneath, so expanding never interrupts.
  const [isExpanded, setExpanded] = useState(false)

  // Accumulate real playback time and, once the 30s threshold is reached,
  // record the listen exactly once for this podcast/session. The backend
  // additionally requires auth + dedups per (podcast, user), so this call is
  // best-effort and safe to fire-and-forget.
  function trackPlayback() {
    const el = audioRef.current
    if (!el) return
    const now = el.currentTime
    const last = lastPlaybackTimeRef.current
    lastPlaybackTimeRef.current = now
    if (el.paused || el.seeking || last === null) return

    // timeupdate fires ~4x/sec while playing; a larger (or negative) delta is
    // a seek/skip/repeat-restart, which must not count as listened time.
    const delta = now - last
    if (delta <= 0 || delta > 1.5) return

    usePlayerStore.getState().addListenedTime(delta)
    const { listenedSeconds, hasRecordedListen, currentTrack: track } = usePlayerStore.getState()
    if (hasRecordedListen || !track || listenedSeconds < LISTEN_THRESHOLD_SECONDS) return

    // Flip the guard BEFORE the network call so subsequent timeupdate events
    // can't double-fire; never let a failure here break playback.
    usePlayerStore.getState().markListenRecorded()
    recordListen({ id: track.id as Id<'podcasts'> }).catch(() => {})
  }

  useEffect(() => {
    const el = audioRef.current
    if (!el || !currentTrack?.audioUrl) return

    const syncPlayback = async () => {
      if (el.src !== currentTrack.audioUrl) {
        el.src = currentTrack.audioUrl
        el.load()
        setCurrent(0)
        setDuration(0)
        lastPlaybackTimeRef.current = null
      }
      if (isPlaying) {
        try {
          await el.play()
        } catch (err) {
          console.error('Playback failed:', err)
        }
      } else {
        el.pause()
      }
    }

    void syncPlayback()
  }, [currentTrack?.id, currentTrack?.audioUrl, isPlaying])

  useEffect(() => {
    const el = audioRef.current
    if (el) el.volume = volume
  }, [volume])

  // When playback stops entirely, drop out of full-screen so the next track
  // starts in the compact bar rather than reopening the expanded view.
  useEffect(() => {
    if (!currentTrack) setExpanded(false)
  }, [currentTrack])

  // Prevent the page behind the full-screen view from scrolling.
  useEffect(() => {
    if (!isExpanded) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isExpanded])

  if (!currentTrack) return null

  const progress = duration > 0 ? (current / duration) * 100 : 0
  const { title, author, imageGradient, thumbnailUrl } = currentTrack

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const el = audioRef.current
    if (!el || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    el.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  function skip(seconds: number) {
    const el = audioRef.current
    if (!el) return
    el.currentTime = Math.max(0, Math.min(duration, el.currentTime + seconds))
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] md:gap-6 md:px-6 md:py-3 md:pb-3"
      style={{
        background: 'linear-gradient(to top, #0a0c14 80%, #0d0f1180)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={() => {
          setCurrent(audioRef.current?.currentTime ?? 0)
          trackPlayback()
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onError={() => console.error('Audio element error — check audioUrl:', currentTrack?.audioUrl)}
        onEnded={
          isRepeat
            ? () => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0
                  audioRef.current.play().catch(() => {})
                }
              }
            : stop
        }
      />

      {/* Track info — tap to open the full-screen "now playing" view. */}
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Expand player"
        title="Expand player"
        className="flex min-w-0 flex-1 items-center gap-3 text-left cursor-pointer md:w-52 md:flex-none md:shrink-0"
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="h-11 w-11 rounded-lg object-cover shrink-0 md:h-12 md:w-12"
          />
        ) : (
          <div
            className="h-11 w-11 rounded-lg shrink-0 md:h-12 md:w-12"
            style={{
              background: `linear-gradient(135deg, ${imageGradient.from}, ${imageGradient.to})`,
            }}
          />
        )}
        <div className="min-w-0">
          <p className="text-white text-xs font-semibold truncate">{title}</p>
          <p className="text-[#7f8596] text-[11px] truncate mt-0.5">{author}</p>
        </div>
      </button>

      {/* Controls */}
      <div className="flex shrink-0 flex-col items-center gap-2 md:flex-1">
        <div className="flex items-center gap-4 md:gap-5">
          <button
            type="button"
            onClick={() => setShuffled((v) => !v)}
            className={`hidden md:inline-flex transition-colors ${isShuffled ? 'text-[#f97535]' : 'text-[#7f8596] hover:text-white'}`}
            aria-label="Shuffle"
            title="Shuffle"
          >
            <Shuffle size={17} />
          </button>

          <SkipButton seconds={-15} onClick={() => skip(-15)} />

          <button
            type="button"
            onClick={isPlaying ? pause : resume}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0d0f11] hover:bg-white/90 transition-colors shadow-lg md:h-10 md:w-10"
          >
            {isPlaying ? (
              <Pause size={17} fill="#0d0f11" />
            ) : (
              <Play size={17} fill="#0d0f11" className="translate-x-px" />
            )}
          </button>

          <SkipButton seconds={15} onClick={() => skip(15)} />

          <button
            type="button"
            className="hidden md:inline-flex text-[#7f8596] hover:text-white transition-colors"
            aria-label="Skip to next"
            title="Skip to next"
          >
            <SkipForward size={17} />
          </button>

          <button
            type="button"
            onClick={() => setRepeat((v) => !v)}
            className={`hidden md:inline-flex transition-colors ${isRepeat ? 'text-[#f97535]' : 'text-[#7f8596] hover:text-white'}`}
            aria-label="Repeat"
            title="Repeat"
          >
            <Repeat size={17} />
          </button>
        </div>

        {/* Seek bar — hidden on mobile to keep the bar compact above the nav */}
        <div className="hidden w-full max-w-sm items-center gap-3 md:flex">
          <span className="text-[#7f8596] text-[10px] w-7 text-right shrink-0">
            {formatTime(current)}
          </span>
          <div
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            title="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
            aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
            className="flex-1 h-1 rounded-full bg-white/10 cursor-pointer relative"
            onClick={seek}
            onKeyDown={(e) => {
              const el = audioRef.current
              if (!el) return
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                el.currentTime = Math.min(duration, el.currentTime + 5)
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                el.currentTime = Math.max(0, el.currentTime - 5)
              }
            }}
          >
            <div
              className="h-full rounded-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[#7f8596] text-[10px] w-7 shrink-0">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume — hidden on mobile (no room next to the compact controls) */}
      <div className="hidden md:flex items-center gap-2.5 w-36 shrink-0 justify-end">
        <Volume2 size={15} className="text-[#7f8596] shrink-0" />
        <div
          role="slider"
          tabIndex={0}
          aria-label="Volume"
          title="Volume"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(volume * 100)}
          className="flex-1 h-1 rounded-full bg-white/10 cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault()
              setVolume((v) => Math.min(1, v + 0.05))
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault()
              setVolume((v) => Math.max(0, v - 0.05))
            }
          }}
        >
          <div
            className="h-full rounded-full bg-white/60 transition-all"
            style={{ width: `${volume * 100}%` }}
          />
        </div>
      </div>

      {/* ── Full-screen "now playing" view ─────────────────────────────────── */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-[60] flex flex-col px-6 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]"
          style={{
            // Fully OPAQUE so nothing behind the full-screen view shows through.
            backgroundColor: '#0a0c14',
            backgroundImage: `linear-gradient(180deg, ${imageGradient.from}, #101114 45%, #0a0c14)`,
          }}
        >
          {/* Header — collapse back to the mini bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Minimize player"
              title="Minimize player"
              className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronDown size={26} />
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              Now Playing
            </span>
            <span className="h-9 w-9" aria-hidden />
          </div>

          {/* Centered thumbnail — mobile-thumbnail sized (small/medium) */}
          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt=""
                className="h-56 w-56 rounded-2xl object-cover shadow-2xl sm:h-64 sm:w-64"
              />
            ) : (
              <div
                className="h-56 w-56 rounded-2xl shadow-2xl sm:h-64 sm:w-64"
                style={{
                  background: `linear-gradient(135deg, ${imageGradient.from}, ${imageGradient.to})`,
                }}
              />
            )}
            <div className="w-full max-w-md text-center">
              <p className="text-white text-xl font-bold truncate">{title}</p>
              <p className="text-[#9aa0b0] text-sm mt-1 truncate">{author}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="mx-auto w-full max-w-md">
            {/* Seek bar */}
            <div className="flex items-center gap-3">
              <span className="text-[#7f8596] text-[11px] w-9 text-right shrink-0">
                {formatTime(current)}
              </span>
              <div
                role="slider"
                tabIndex={0}
                aria-label="Seek"
                title="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.round(duration)}
                aria-valuenow={Math.round(current)}
                aria-valuetext={`${formatTime(current)} of ${formatTime(duration)}`}
                className="flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer relative"
                onClick={seek}
                onKeyDown={(e) => {
                  const el = audioRef.current
                  if (!el) return
                  if (e.key === 'ArrowRight') {
                    e.preventDefault()
                    el.currentTime = Math.min(duration, el.currentTime + 5)
                  } else if (e.key === 'ArrowLeft') {
                    e.preventDefault()
                    el.currentTime = Math.max(0, el.currentTime - 5)
                  }
                }}
              >
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[#7f8596] text-[11px] w-9 shrink-0">
                {formatTime(duration)}
              </span>
            </div>

            {/* Transport */}
            <div className="mt-6 flex items-center justify-center gap-7">
              <button
                type="button"
                onClick={() => setShuffled((v) => !v)}
                className={`transition-colors ${isShuffled ? 'text-[#f97535]' : 'text-[#7f8596] hover:text-white'}`}
                aria-label="Shuffle"
                title="Shuffle"
              >
                <Shuffle size={20} />
              </button>

              <SkipButton seconds={-15} onClick={() => skip(-15)} />

              <button
                type="button"
                onClick={isPlaying ? pause : resume}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                title={isPlaying ? 'Pause' : 'Play'}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#0d0f11] hover:bg-white/90 transition-colors shadow-lg"
              >
                {isPlaying ? (
                  <Pause size={26} fill="#0d0f11" />
                ) : (
                  <Play size={26} fill="#0d0f11" className="translate-x-0.5" />
                )}
              </button>

              <SkipButton seconds={15} onClick={() => skip(15)} />

              <button
                type="button"
                onClick={() => setRepeat((v) => !v)}
                className={`transition-colors ${isRepeat ? 'text-[#f97535]' : 'text-[#7f8596] hover:text-white'}`}
                aria-label="Repeat"
                title="Repeat"
              >
                <Repeat size={20} />
              </button>
            </div>

            {/* Volume */}
            <div className="mt-8 flex items-center gap-3">
              <Volume2 size={18} className="text-[#7f8596] shrink-0" />
              <div
                role="slider"
                tabIndex={0}
                aria-label="Volume"
                title="Volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(volume * 100)}
                className="flex-1 h-1.5 rounded-full bg-white/10 cursor-pointer relative"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                    e.preventDefault()
                    setVolume((v) => Math.min(1, v + 0.05))
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    setVolume((v) => Math.max(0, v - 0.05))
                  }
                }}
              >
                <div
                  className="h-full rounded-full bg-white/60 transition-all"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
