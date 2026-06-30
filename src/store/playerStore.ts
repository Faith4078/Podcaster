import { create } from 'zustand'

interface Track {
  id: string
  title: string
  author: string
  audioUrl: string
  imageGradient: { from: string; to: string }
}

interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  play: (track: Track) => void
  pause: () => void
  resume: () => void
  stop: () => void
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  play: (track) => set({ currentTrack: track, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  stop: () => set({ currentTrack: null, isPlaying: false }),
}))
