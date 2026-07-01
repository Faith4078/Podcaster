import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/playerStore-N3DxDJ64.js
var usePlayerStore = create((set) => ({
	currentTrack: null,
	isPlaying: false,
	play: (track) => set({
		currentTrack: track,
		isPlaying: true
	}),
	pause: () => set({ isPlaying: false }),
	resume: () => set({ isPlaying: true }),
	stop: () => set({
		currentTrack: null,
		isPlaying: false
	})
}));
//#endregion
export { usePlayerStore as t };
