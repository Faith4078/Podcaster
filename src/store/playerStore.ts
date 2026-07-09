import { create } from 'zustand'

// A listen only counts once the user has actually heard this many seconds of
// audio (accumulated real playback — pausing stops the clock, seeking doesn't
// fast-forward it). The MiniPlayer records the listen when this is reached.
export const LISTEN_THRESHOLD_SECONDS = 30

interface Track {
  id: string
  title: string
  author: string
  audioUrl: string
  imageGradient: { from: string; to: string }
  // Real cover art when available; the player falls back to imageGradient.
  thumbnailUrl?: string
}

interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  // Seconds of ACTUAL audio playback accumulated for the current track.
  // Resets whenever a DIFFERENT track starts; re-clicking the same track keeps
  // the accumulated time (10 clicks still yield at most 1 listen).
  listenedSeconds: number
  // Set once this track's qualifying listen has been sent to the backend —
  // client-side guard against double-firing the mutation.
  hasRecordedListen: boolean
  play: (track: Track) => void
  pause: () => void
  resume: () => void
  stop: () => void
  addListenedTime: (seconds: number) => void
  markListenRecorded: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  listenedSeconds: 0,
  hasRecordedListen: false,
  play: (track) =>
    set((state) => ({
      currentTrack: track,
      isPlaying: true,
      // Switching to a different podcast starts a fresh listen session;
      // re-playing the current one keeps its accumulated time and dedup flag.
      ...(state.currentTrack?.id !== track.id
        ? { listenedSeconds: 0, hasRecordedListen: false }
        : {}),
    })),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  stop: () =>
    set({ currentTrack: null, isPlaying: false, listenedSeconds: 0, hasRecordedListen: false }),
  addListenedTime: (seconds) =>
    set((state) => ({ listenedSeconds: state.listenedSeconds + seconds })),
  markListenRecorded: () => set({ hasRecordedListen: true }),
}))
