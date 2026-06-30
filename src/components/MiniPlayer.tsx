import { Pause, Play, Repeat, Shuffle, SkipForward, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { usePlayerStore } from '../store/playerStore'

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
  const audioRef = useRef<HTMLAudioElement>(null)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isShuffled, setShuffled] = useState(false)
  const [isRepeat, setRepeat] = useState(false)

  useEffect(() => {
    const el = audioRef.current
    if (!el || !currentTrack?.audioUrl) return

    const syncPlayback = async () => {
      if (el.src !== currentTrack.audioUrl) {
        el.src = currentTrack.audioUrl
        el.load()
        setCurrent(0)
        setDuration(0)
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

  if (!currentTrack) return null

  const progress = duration > 0 ? (current / duration) * 100 : 0
  const { title, author, imageGradient } = currentTrack

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
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
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

      {/* Track info */}
      <div className="flex min-w-0 flex-1 items-center gap-3 md:w-52 md:flex-none md:shrink-0">
        <div
          className="h-11 w-11 rounded-lg shrink-0 md:h-12 md:w-12"
          style={{
            background: `linear-gradient(135deg, ${imageGradient.from}, ${imageGradient.to})`,
          }}
        />
        <div className="min-w-0">
          <p className="text-white text-xs font-semibold truncate">{title}</p>
          <p className="text-[#7f8596] text-[11px] truncate mt-0.5">{author}</p>
        </div>
      </div>

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
    </div>
  )
}
