import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, f as useUser } from "../_libs/@clerk/react+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQuery, i as useMutation } from "../_libs/convex.mjs";
import { t as api } from "./api-DSJLF2wo.mjs";
import { I as Ellipsis, T as ChevronRight, m as Play, y as Headphones } from "../_libs/lucide-react.mjs";
import { t as BookmarkButton } from "./BookmarkButton-9JQXL76i.mjs";
import { t as usePlayerStore } from "./playerStore-N3DxDJ64.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CSbQVTF5.js
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
var CATEGORY_GRADIENTS = {
	Technology: ["#1e3a5f", "#2563eb"],
	Business: ["#064e3b", "#059669"],
	Education: ["#78350f", "#d97706"],
	Entertainment: ["#7c2d12", "#f97535"],
	Health: ["#134e4a", "#0d9488"],
	Science: ["#1e3a5f", "#4f46e5"],
	Sports: ["#7f1d1d", "#dc2626"],
	"True Crime": ["#831843", "#db2777"],
	Comedy: ["#365314", "#65a30d"],
	News: ["#1c1917", "#57534e"]
};
var FALLBACK_PAIRS = [
	["#1e3a5f", "#2563eb"],
	["#3b0764", "#7c3aed"],
	["#064e3b", "#059669"],
	["#78350f", "#d97706"]
];
function gradient(category, fallbackIdx = 0) {
	return CATEGORY_GRADIENTS[category] ?? FALLBACK_PAIRS[fallbackIdx % FALLBACK_PAIRS.length];
}
function GradientBox({ from, to, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className,
		style: { background: `linear-gradient(135deg, ${from}, ${to})` }
	});
}
function CardSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "animate-pulse",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-full aspect-square rounded-[3px] bg-white/10 mb-3" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-3/4 rounded bg-white/10 mb-1.5" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-1/2 rounded bg-white/10" })
		]
	});
}
function RowSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-4 py-3.5 border-b border-[#252525] animate-pulse",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-5 h-4 rounded bg-white/10 shrink-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-12 h-12 rounded-lg bg-white/10 shrink-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-4 rounded bg-white/10" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-24 h-3 rounded bg-white/10 shrink-0" })
		]
	});
}
function PodcastCard({ podcast, index, onPlay }) {
	const [from, to] = gradient(podcast.category, index);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "button",
		tabIndex: 0,
		"aria-label": `Play ${podcast.title}`,
		className: "cursor-pointer group",
		onClick: () => onPlay(podcast),
		onKeyDown: (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				onPlay(podcast);
			}
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mb-3",
				children: [podcast.thumbnailUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: podcast.thumbnailUrl,
					alt: podcast.title,
					className: "w-full aspect-square rounded-[3px] object-cover transition-transform duration-200 group-hover:scale-[1.03]"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
					from,
					to,
					className: "w-full aspect-square rounded-[3px] transition-transform duration-200 group-hover:scale-[1.03]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute right-2 top-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookmarkButton, { podcastId: podcast._id })
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-white text-base font-bold truncate",
				children: podcast.title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[#71788B] text-sm mt-0.5 truncate",
				children: podcast.author?.name ?? "Unknown"
			})
		]
	});
}
function HomePage() {
	const { user } = useUser();
	const play = usePlayerStore((s) => s.play);
	const incrementListeners = useMutation(api.podcasts.incrementListeners);
	const trending = useQuery(api.podcasts.getTrending, { limit: 4 });
	const latest = useQuery(api.podcasts.getLatest, { limit: 6 });
	const popular = useQuery(api.podcasts.getPopular, { limit: 4 });
	const topPodcasters = useQuery(api.users.getTopPodcasters, { limit: 4 });
	function handlePlay(podcast) {
		if (!podcast.audioUrl) return;
		const [from, to] = gradient(podcast.category);
		incrementListeners({ id: podcast._id });
		play({
			id: podcast._id,
			title: podcast.title,
			author: podcast.author?.name ?? "Unknown",
			audioUrl: podcast.audioUrl,
			imageGradient: {
				from,
				to
			}
		});
	}
	const featuredPodcast = popular?.[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-full flex-col lg:flex-row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mb-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mb-5 text-xl font-bold text-white",
						children: "Trending Podcasts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4",
						children: trending === void 0 ? Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardSkeleton, {}, i)) : trending.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "col-span-full text-[#71788B] text-sm",
							children: "No trending podcasts yet."
						}) : trending.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PodcastCard, {
							podcast: p,
							index: i,
							onPlay: handlePlay
						}, p._id))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mb-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-xl font-bold text-white",
							children: "Latest Podcasts"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/discover",
							className: "text-base font-semibold text-[#f97535] hover:text-[#f97535]/80 transition-colors",
							children: "See All"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-col",
						children: latest === void 0 ? Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowSkeleton, {}, i)) : latest.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[#71788B] text-sm",
							children: "No podcasts yet — be the first to create one!"
						}) : latest.map((p, i) => {
							const [from, to] = gradient(p.category, i);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								role: "button",
								tabIndex: 0,
								"aria-label": `Play ${p.title}`,
								className: `flex items-center gap-4 py-3.5 cursor-pointer group hover:bg-white/[0.02] rounded-lg px-2 -mx-2 transition-colors ${i < latest.length - 1 ? "border-b border-[#252525]" : ""}`,
								onClick: () => handlePlay(p),
								onKeyDown: (e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handlePlay(p);
									}
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-5 text-center text-base font-bold shrink-0 text-[#71788B]",
										children: i + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative shrink-0",
										children: [p.thumbnailUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: p.thumbnailUrl,
											alt: p.title,
											className: "w-12 h-12 rounded-lg object-cover"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
											from,
											to,
											className: "w-12 h-12 rounded-lg"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-7 h-7 rounded-full bg-white/90 flex items-center justify-center",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
													size: 10,
													fill: "#101114",
													className: "text-[#101114] ml-px"
												})
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "flex-1 min-w-0 text-base font-bold truncate text-white",
										children: p.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-5 text-xs text-[#71788B] shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Headphones, { size: 13 }), p.listenerCount.toLocaleString()]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[#71788B] text-xs",
											children: p.author?.name ?? "—"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: (e) => e.stopPropagation(),
										"aria-label": "More options",
										title: "More options",
										className: "flex items-center gap-1 text-[#71788B] hover:text-white transition-colors shrink-0 ml-1 px-2 py-1 rounded-lg hover:bg-white/[0.06] text-xs font-semibold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, { size: 16 }), "More"]
									})
								]
							}, p._id);
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mb-5 text-xl font-bold text-white",
					children: "Popular Podcasts"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4",
					children: popular === void 0 ? Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardSkeleton, {}, i)) : popular.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "col-span-full text-[#71788B] text-sm",
						children: "No podcasts yet."
					}) : popular.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PodcastCard, {
						podcast: p,
						index: i,
						onPlay: handlePlay
					}, p._id))
				})] })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "w-full shrink-0 border-t border-[#252525] px-4 py-6 sm:px-6 bg-[#15171C] lg:w-[349px] lg:border-l lg:border-t-0 lg:py-8 lg:overflow-y-auto",
			children: [
				user && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/my-profile",
					className: "flex items-center gap-3 mb-8 cursor-pointer group p-3 rounded-xl hover:bg-white/4 transition-colors -mx-3 block",
					children: [
						user.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: user.imageUrl,
							alt: user.fullName ?? "User",
							className: "w-10 h-10 rounded-full object-cover shrink-0"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
							from: "#f59e0b",
							to: "#f97535",
							className: "w-10 h-10 rounded-full shrink-0"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "flex-1 min-w-0 text-white text-base font-bold truncate",
							children: user.fullName ?? user.username ?? "User"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, {
							size: 16,
							className: "text-[#71788B] group-hover:text-white transition-colors shrink-0"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "mb-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-bold text-white",
							children: "Fans Also Like"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/discover",
							className: "text-base font-semibold text-[#f97535] hover:text-[#f97535]/80 transition-colors",
							children: "See All"
						})]
					}), featuredPodcast ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						"aria-label": `Play ${featuredPodcast.title}`,
						className: "cursor-pointer group",
						onClick: () => handlePlay(featuredPodcast),
						onKeyDown: (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								handlePlay(featuredPodcast);
							}
						},
						children: [
							featuredPodcast.thumbnailUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: featuredPodcast.thumbnailUrl,
								alt: featuredPodcast.title,
								className: "h-44 w-full rounded-xl mb-3 object-cover group-hover:opacity-90 transition-opacity"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
								from: gradient(featuredPodcast.category)[0],
								to: gradient(featuredPodcast.category)[1],
								className: "h-44 w-full rounded-xl mb-3 group-hover:opacity-90 transition-opacity"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-white text-base font-bold",
								children: featuredPodcast.title
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[#71788B] text-sm mt-0.5",
								children: featuredPodcast.author?.name ?? "Unknown"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex gap-1.5 mt-3",
								children: [
									0,
									1,
									2,
									3
								].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `h-1.5 rounded-full ${i === 0 ? "w-4 bg-[#f97535]" : "w-1.5 bg-white/20"}` }, i))
							})
						]
					}) : popular === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-44 w-full rounded-xl bg-white/10 animate-pulse mb-3" }) : null]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-between mb-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-base font-bold text-white",
						children: "Top Podcasters"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-6",
					children: topPodcasters === void 0 ? Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 animate-pulse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-10 rounded-full bg-white/10 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3.5 w-2/3 rounded bg-white/10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-1/3 rounded bg-white/10" })]
						})]
					}, i)) : topPodcasters.map(({ user: u, count }, i) => {
						const [from, to] = FALLBACK_PAIRS[i % FALLBACK_PAIRS.length];
						const author = u;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 cursor-pointer group",
							children: [
								author?.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: author.imageUrl,
									alt: author.name,
									className: "w-10 h-10 rounded-full object-cover shrink-0"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
									from,
									to,
									className: "w-10 h-10 rounded-full shrink-0"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-white text-base font-bold truncate group-hover:text-[#f97535] transition-colors",
										children: author?.name ?? "Unknown"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[#71788B] text-sm mt-0.5",
										children: ["@", author?.email?.split("@")[0] ?? "—"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[#71788B] text-sm shrink-0",
									children: [count, " Podcasts"]
								})
							]
						}, author?._id ?? i);
					})
				})] })
			]
		})]
	});
}
//#endregion
export { HomePage as component };
