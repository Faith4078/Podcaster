import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, f as useUser, x as require_react } from "../_libs/@clerk/react+[...].mjs";
import { s as useNavigate } from "../_libs/@clerk/tanstack-react-start+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQuery, i as useMutation, r as useAction } from "../_libs/convex.mjs";
import { t as api } from "./api-DSJLF2wo.mjs";
import { L as CircleAlert, N as Pen, P as LoaderCircle, R as ChartColumn, S as Crown, f as RefreshCw, m as Play, o as Trash2 } from "../_libs/lucide-react.mjs";
import { t as BookmarkButton } from "./BookmarkButton-9JQXL76i.mjs";
import { t as usePlayerStore } from "./playerStore-N3DxDJ64.mjs";
import { t as Route } from "./podcast._id-VrU2iuhY.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/podcast._id-CAyDAZ0w.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
var STEP_LABELS = {
	generating_script: "Writing script",
	generating_audio: "Generating audio",
	generating_thumbnail: "Creating thumbnail",
	embedding: "Building search index",
	generate: "Processing"
};
function GradientBox({ from, to, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className,
		style: { background: `linear-gradient(135deg, ${from}, ${to})` }
	});
}
function SmallPodcastCard({ name, author, from, to, plays }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 rounded-xl bg-[#15171C] border border-[#252525] hover:border-[#f97535]/30 transition-colors cursor-pointer px-3 py-2.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
			from,
			to,
			className: "w-10 h-10 rounded-[3px] shrink-0"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-white text-sm font-bold truncate",
					children: name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[#71788B] text-xs mt-0.5 truncate",
					children: author
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1 mt-0.5 text-[#71788B] text-[10px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { size: 10 }), plays]
				})
			]
		})]
	});
}
var PLACEHOLDER_GRADIENT = {
	from: "#1e3a5f",
	to: "#2563eb"
};
var CAT_GRADIENTS = {
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
function catGradient(category) {
	return CAT_GRADIENTS[category] ?? ["#1e3a5f", "#2563eb"];
}
function PodcastDetailPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const play = usePlayerStore((s) => s.play);
	const { user } = useUser();
	const [showDeleteConfirm, setShowDeleteConfirm] = (0, import_react.useState)(false);
	const [isDeleting, setIsDeleting] = (0, import_react.useState)(false);
	const [isRegeneratingThumbnail, setIsRegeneratingThumbnail] = (0, import_react.useState)(false);
	const podcast = useQuery(api.podcasts.getById, { id });
	const convexUser = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");
	const getSimilar = useAction(api.podcasts.getSimilar);
	const [similar, setSimilar] = (0, import_react.useState)(void 0);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		getSimilar({
			podcastId: id,
			limit: 4
		}).then((r) => {
			if (!cancelled) setSimilar(r);
		}).catch(() => {
			if (!cancelled) setSimilar([]);
		});
		return () => {
			cancelled = true;
		};
	}, [id, getSimilar]);
	const incrementListeners = useMutation(api.podcasts.incrementListeners);
	const deletePodcast = useMutation(api.podcasts.deletePodcast);
	const retry = useAction(api.podcasts.retryGeneration);
	const regenerateThumbnail = useAction(api.podcasts.regenerateThumbnail);
	const isOwner = !!(convexUser && podcast && convexUser._id === podcast.authorId);
	async function handleRegenerateThumbnail(e) {
		e.stopPropagation();
		setIsRegeneratingThumbnail(true);
		try {
			await regenerateThumbnail({ podcastId: id });
		} finally {
			setIsRegeneratingThumbnail(false);
		}
	}
	async function handleDelete() {
		if (!convexUser || !podcast) return;
		setIsDeleting(true);
		try {
			await deletePodcast({
				id,
				authorId: convexUser._id
			});
			navigate({ to: "/" });
		} catch {
			setIsDeleting(false);
			setShowDeleteConfirm(false);
		}
	}
	if (podcast === void 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-6 w-6 animate-spin rounded-full border-2 border-[#f97535] border-t-transparent" })
	});
	if (podcast === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col items-center justify-center gap-3 text-[#71788B]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 32 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-base font-bold text-white",
			children: "Podcast not found"
		})]
	});
	const author = podcast.author;
	const authorName = author?.name ?? "Unknown";
	const authorImage = author?.imageUrl ?? null;
	if (podcast.status === "pending" || podcast.status === "generating") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full flex-col items-center justify-center gap-8 px-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl bg-[#15171C] border border-[#252525] p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f97535]/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						size: 28,
						className: "animate-spin text-[#f97535]"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-bold text-white mb-2",
					children: "Generating your podcast"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[#71788B] text-sm mb-8",
					children: "Sit tight — this usually takes a minute."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-4 text-left",
					children: [
						"generating_script",
						"generating_audio",
						"generating_thumbnail"
					].map((step, i) => {
						const isDone = podcast.status === "ready";
						const isCurrent = podcast.status === "generating" && i === 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [isDone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-5 w-5 rounded-full bg-[#f97535] flex items-center justify-center shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
									width: "10",
									height: "8",
									viewBox: "0 0 10 8",
									fill: "none",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										d: "M1 4l3 3 5-6",
										stroke: "#fff",
										strokeWidth: "1.5",
										strokeLinecap: "round",
										strokeLinejoin: "round"
									})
								})
							}) : isCurrent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								size: 20,
								className: "animate-spin text-[#f97535] shrink-0"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-5 w-5 rounded-full border-2 border-[#252525] shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `text-sm font-medium ${isCurrent ? "text-white" : "text-[#71788B]"}`,
								children: STEP_LABELS[step]
							})]
						}, step);
					})
				})
			]
		})
	});
	if (podcast.status === "failed") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full flex-col items-center justify-center gap-4 px-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-sm rounded-xl bg-[#15171C] border border-[#252525] p-8 text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, {
						size: 24,
						className: "text-red-400"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xl font-bold text-white mb-2",
					children: "Generation failed"
				}),
				podcast.failedStep && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-[#71788B] text-sm mb-1",
					children: [
						"Failed at:",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-white",
							children: STEP_LABELS[podcast.failedStep] ?? podcast.failedStep
						})
					]
				}),
				podcast.errorMsg && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-red-400/70 text-xs mt-2 mb-6 font-mono break-all",
					children: podcast.errorMsg
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => retry({ podcastId: id }),
					className: "flex items-center gap-2 mx-auto rounded-md bg-[#f97535] px-6 py-3 text-base font-bold text-white hover:opacity-90 transition-opacity",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 16 }), "Retry"]
				})
			]
		})
	});
	const canPlay = !!(podcast.audioStorageId || podcast.audioUrl);
	function handlePlay() {
		if (!podcast || podcast.status !== "ready" || !canPlay || !podcast.audioUrl) return;
		incrementListeners({ id });
		play({
			id,
			title: podcast.title,
			author: authorName,
			audioUrl: podcast.audioUrl,
			imageGradient: PLACEHOLDER_GRADIENT
		});
	}
	const transcriptParas = podcast.transcript ? podcast.transcript.split("\n\n").filter(Boolean) : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-full flex-col lg:flex-row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-start gap-6 mb-10 sm:flex-row sm:gap-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "button",
					tabIndex: 0,
					"aria-label": `Play ${podcast.title}`,
					className: "relative shrink-0 group cursor-pointer mx-auto sm:mx-0",
					onClick: handlePlay,
					onKeyDown: (e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							handlePlay();
						}
					},
					children: [podcast.thumbnailUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: podcast.thumbnailUrl,
						alt: podcast.title,
						className: "w-44 h-44 rounded-2xl object-cover sm:w-56 sm:h-56"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
							from: PLACEHOLDER_GRADIENT.from,
							to: PLACEHOLDER_GRADIENT.to,
							className: "w-44 h-44 rounded-2xl sm:w-56 sm:h-56"
						}), isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: isRegeneratingThumbnail,
							onClick: handleRegenerateThumbnail,
							className: "absolute bottom-3 left-3 right-3 z-10 flex items-center justify-center gap-2 rounded-md bg-black/60 px-3 py-2 text-xs font-bold text-white hover:bg-black/75 transition-colors disabled:opacity-50",
							children: [isRegeneratingThumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								size: 14,
								className: "animate-spin"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 14 }), "Generate cover art"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f97535]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								size: 22,
								fill: "white",
								className: "text-white ml-1"
							})
						})
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0 pt-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "inline-block rounded-full bg-[#f97535]/15 px-3 py-0.5 text-xs font-semibold text-[#f97535] mb-3",
							children: podcast.category
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight",
							children: podcast.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-x-3 gap-y-2 mb-4",
							children: [
								authorImage ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: authorImage,
									alt: authorName,
									className: "w-7 h-7 rounded-full object-cover shrink-0"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
									from: "#f59e0b",
									to: "#f97535",
									className: "w-7 h-7 rounded-full shrink-0"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-white text-sm font-semibold",
									children: authorName
								}),
								author?.plan === "pro" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1 rounded-full bg-[#f97535] px-2 py-0.5 text-[10px] font-semibold text-white",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { size: 10 }), "Pro"]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-5 text-[#71788B] text-xs mb-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex items-center gap-1.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { size: 13 }),
									podcast.listenerCount.toLocaleString(),
									" listeners"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Voice: ", podcast.speaker1Voice] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[#71788B] text-sm leading-relaxed max-w-xl",
							children: podcast.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 flex items-center gap-3 flex-wrap",
							children: [
								canPlay ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: handlePlay,
									className: "flex items-center gap-2 rounded-md bg-[#f97535] px-[22px] py-[14px] text-base font-bold text-white hover:opacity-90 transition-opacity",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
										size: 16,
										fill: "white"
									}), "Play Episode"]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[#71788B] text-sm",
										children: "No audio file for this episode yet."
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => retry({ podcastId: id }),
										className: "flex items-center gap-2 rounded-md border border-[#252525] bg-[#15171C] px-4 py-2 text-sm font-bold text-[#f97535] hover:border-[#f97535]/40 transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { size: 14 }), "Regenerate audio"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookmarkButton, {
									podcastId: id,
									variant: "button"
								}),
								isOwner && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/edit/$id",
									params: { id },
									className: "flex items-center gap-2 rounded-md border border-[#252525] bg-[#15171C] px-5 py-[14px] text-base font-bold text-white hover:border-[#f97535]/40 transition-colors",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { size: 15 }), "Edit"]
								}), showDeleteConfirm ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm text-[#71788B]",
											children: "Delete this podcast?"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: isDeleting,
											onClick: handleDelete,
											className: "rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 transition-colors disabled:opacity-50",
											children: isDeleting ? "Deleting…" : "Confirm"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setShowDeleteConfirm(false),
											className: "rounded-md border border-[#252525] px-4 py-2 text-sm font-bold text-[#71788B] hover:text-white transition-colors",
											children: "Cancel"
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setShowDeleteConfirm(true),
									className: "flex items-center gap-2 rounded-md border border-[#252525] bg-[#15171C] px-5 py-[14px] text-base font-bold text-[#71788B] hover:border-red-500/40 hover:text-red-400 transition-colors",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 15 }), "Delete"]
								})] })
							]
						})
					]
				})]
			}), transcriptParas.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-xl font-bold text-white mb-5",
				children: "Transcript"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl bg-[#15171C] border border-[#252525] px-6 py-5 flex flex-col gap-4",
				children: transcriptParas.map((para, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-white/80 text-sm leading-relaxed",
					children: para
				}, i))
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
			className: "w-full shrink-0 border-t border-[#252525] bg-[#15171C] px-4 py-6 sm:px-6 lg:w-[349px] lg:border-l lg:border-t-0 lg:py-8 lg:overflow-y-auto",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-base font-bold text-white mb-4",
				children: "You Might Also Like"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-col gap-2",
				children: similar === void 0 ? Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 px-3 py-2.5 animate-pulse",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-10 rounded-[3px] bg-white/10 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-3/4 rounded bg-white/10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-2.5 w-1/2 rounded bg-white/10" })]
					})]
				}, i)) : similar.filter((p) => p._id !== id).slice(0, 3).map((p) => {
					const [from, to] = catGradient(p.category);
					const author = p.author;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SmallPodcastCard, {
						name: p.title,
						author: author?.name ?? "Unknown",
						from,
						to,
						plays: p.listenerCount.toLocaleString()
					}, p._id);
				})
			})] })
		})]
	});
}
//#endregion
export { PodcastDetailPage as component };
