import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, d as useAuth, f as useUser, x as require_react } from "../_libs/@clerk/react+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQuery, i as useMutation } from "../_libs/convex.mjs";
import { t as api } from "./api-DSJLF2wo.mjs";
import { E as ChevronLeft, R as ChartColumn, S as Crown, b as Folder, k as Bookmark, o as Trash2 } from "../_libs/lucide-react.mjs";
import { t as BookmarkButton } from "./BookmarkButton-9JQXL76i.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bookmarks-BFn-kKDO.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
var FREE_BOOKMARK_LIMIT = 3;
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
var FALLBACK = ["#1e3a5f", "#2563eb"];
function catGradient(cat) {
	return CAT_GRADIENTS[cat] ?? FALLBACK;
}
function GradientBox({ from, to, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className,
		style: { background: `linear-gradient(135deg, ${from}, ${to})` }
	});
}
function BookmarkRow({ podcast }) {
	const [from, to] = catGradient(podcast.category);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/podcast/$id",
			params: { id: podcast._id },
			className: "flex items-center gap-4 rounded-xl bg-[#15171C] px-4 py-3 border border-[#252525] hover:border-[#f97535]/30 transition-colors",
			children: [podcast.thumbnailUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: podcast.thumbnailUrl,
				alt: podcast.title,
				className: "w-14 h-14 rounded-[3px] object-cover shrink-0"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
				from,
				to,
				className: "w-14 h-14 rounded-[3px] shrink-0"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-white text-base font-bold truncate pr-9",
						children: podcast.title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[#71788B] text-sm mt-0.5 truncate",
						children: podcast.author?.name ?? "Unknown"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1 mt-1.5 text-[#71788B] text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { size: 11 }), podcast.listenerCount.toLocaleString()]
					})
				]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute right-3 top-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookmarkButton, { podcastId: podcast._id })
		})]
	});
}
function RowSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-4 rounded-xl bg-[#15171C] px-4 py-3 border border-[#252525] animate-pulse",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-14 h-14 rounded-[3px] bg-white/10 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 space-y-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-2/3 rounded bg-white/10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-1/3 rounded bg-white/10" })]
		})]
	});
}
function FolderContents({ folderId }) {
	const bookmarks = useQuery(api.bookmarks.listMyBookmarks, { folderId });
	if (bookmarks === void 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5",
		children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowSkeleton, {}, i))
	});
	if (bookmarks.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-[#71788B] text-sm",
		children: "This folder is empty — its podcasts may still be generating, or were removed."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5",
		children: bookmarks.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookmarkRow, { podcast: p }, p._id))
	});
}
function BookmarksPage() {
	const { user } = useUser();
	const { has } = useAuth();
	const isPro = has?.({ plan: "pro" }) === true;
	const folders = useQuery(api.bookmarks.listMyFolders, user ? {} : "skip");
	const bookmarkedIds = useQuery(api.bookmarks.myBookmarkedIds, user ? {} : "skip");
	const deleteFolder = useMutation(api.bookmarks.deleteFolder);
	const [selected, setSelected] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (selected && folders && !folders.some((f) => f._id === selected)) setSelected(null);
	}, [folders, selected]);
	const [pendingDelete, setPendingDelete] = (0, import_react.useState)(null);
	async function handleDelete(folderId) {
		await deleteFolder({ folderId });
		setPendingDelete(null);
	}
	const count = bookmarkedIds?.length ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 py-6 sm:px-6 md:px-8 md:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 mb-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, {
					size: 20,
					className: "text-[#f97535]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold text-white",
					children: "Bookmarks"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[#71788B] text-sm mb-7",
				children: ["Your saved podcasts, organized into folders.", !isPro && bookmarkedIds !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-white",
						children: count
					}),
					"/",
					FREE_BOOKMARK_LIMIT,
					" used."
				] })]
			}),
			!isPro && count >= FREE_BOOKMARK_LIMIT && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-7 rounded-xl border border-[#f97535]/30 bg-[#f97535]/8 p-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, {
						size: 20,
						className: "mt-0.5 shrink-0 text-[#f97535]"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-base font-bold text-white mb-1",
								children: [
									"You've saved all ",
									FREE_BOOKMARK_LIMIT,
									" free bookmarks."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-[#71788B] mb-4",
								children: "Remove one to save another, or upgrade to Pro for unlimited bookmarks."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/billing",
								className: "inline-flex items-center gap-2 rounded-md bg-[#f97535] px-[22px] py-[14px] text-base font-bold text-white transition-opacity hover:opacity-90",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { size: 16 }), "Upgrade to Pro"]
							})
						]
					})]
				})
			}),
			folders === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5",
				children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowSkeleton, {}, i))
			}) : folders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center justify-center gap-3 py-20 text-center text-[#71788B]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { size: 32 }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-base font-bold text-white",
						children: "No bookmarks yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm max-w-sm",
						children: [
							"Tap the bookmark icon on any podcast to save it into a folder.",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/discover",
								className: "font-semibold text-[#f97535] hover:underline",
								children: "Discover podcasts"
							}),
							"."
						]
					})
				]
			}) : selected === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4",
				children: folders.map((folder) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "group relative flex flex-col gap-3 rounded-xl border border-[#252525] bg-[#15171C] p-5 text-left transition-colors hover:border-[#f97535]/40",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						role: "button",
						tabIndex: 0,
						onClick: () => setSelected(folder._id),
						onKeyDown: (e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								setSelected(folder._id);
							}
						},
						className: "flex flex-col gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-12 w-12 items-center justify-center rounded-lg bg-[#f97535]/10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, {
								size: 22,
								className: "text-[#f97535]"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-base font-bold text-white",
								children: folder.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-[#71788B]",
								children: [
									folder.count,
									" ",
									folder.count === 1 ? "podcast" : "podcasts"
								]
							})]
						})]
					}), pendingDelete === folder._id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute right-2 top-2 flex items-center gap-1.5 rounded-md bg-[#101114] px-2 py-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-[#71788B]",
								children: "Delete folder?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => handleDelete(folder._id),
								className: "rounded px-1.5 py-0.5 text-xs font-bold text-red-400 hover:bg-red-400/10 transition-colors",
								children: "Yes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setPendingDelete(null),
								className: "rounded px-1.5 py-0.5 text-xs font-semibold text-[#71788B] hover:text-white transition-colors",
								children: "Cancel"
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-label": `Delete folder ${folder.name}`,
						onClick: (e) => {
							e.stopPropagation();
							setPendingDelete(folder._id);
						},
						className: "absolute right-2 top-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#71788B] hover:text-red-400 transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 }), "Delete"]
					})]
				}, folder._id))
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setSelected(null),
					className: "mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#71788B] transition-colors hover:text-white",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { size: 16 }), "All folders"]
				}),
				(() => {
					const folder = folders.find((f) => f._id === selected);
					return folder ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-5 flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Folder, {
								size: 18,
								className: "text-[#f97535]"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-bold text-white",
								children: folder.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-[#71788B]",
								children: folder.count
							}),
							pendingDelete === folder._id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "ml-1 flex items-center gap-1.5 rounded-md bg-[#101114] px-2 py-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-[#71788B]",
										children: "Delete folder?"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => handleDelete(folder._id),
										className: "rounded px-1.5 py-0.5 text-xs font-bold text-red-400 hover:bg-red-400/10 transition-colors",
										children: "Yes"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setPendingDelete(null),
										className: "rounded px-1.5 py-0.5 text-xs font-semibold text-[#71788B] hover:text-white transition-colors",
										children: "Cancel"
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								"aria-label": `Delete folder ${folder.name}`,
								onClick: () => setPendingDelete(folder._id),
								className: "ml-1 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-[#71788B] hover:text-red-400 transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { size: 14 }), "Delete"]
							})
						]
					}) : null;
				})(),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderContents, { folderId: selected })
			] })
		]
	});
}
//#endregion
export { BookmarksPage as component };
