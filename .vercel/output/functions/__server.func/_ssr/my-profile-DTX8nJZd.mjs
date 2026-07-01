import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, d as useAuth, f as useUser } from "../_libs/@clerk/react+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQuery } from "../_libs/convex.mjs";
import { t as api } from "./api-DSJLF2wo.mjs";
import { I as Ellipsis, R as ChartColumn, S as Crown, a as TrendingUp, g as Mic, p as Plus } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/my-profile-DTX8nJZd.js
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function GradientBox({ from, to, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className,
		style: { background: `linear-gradient(135deg, ${from}, ${to})` }
	});
}
var PLACEHOLDER_GRADIENT_PAIRS = [
	["#1e3a5f", "#2563eb"],
	["#3b0764", "#7c3aed"],
	["#064e3b", "#059669"],
	["#78350f", "#d97706"],
	["#7c2d12", "#f97535"],
	["#831843", "#db2777"]
];
function MyProfilePage() {
	const { user } = useUser();
	const { has } = useAuth();
	const convexUser = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");
	const isPro = has?.({ plan: "pro" }) === true || convexUser?.plan === "pro";
	const myPodcasts = useQuery(api.podcasts.getByAuthor, convexUser ? { authorId: convexUser._id } : "skip");
	const topPodcasters = useQuery(api.users.getTopPodcasters, { limit: 5 });
	const displayName = user?.fullName ?? user?.username ?? "Anonymous";
	const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", {
		month: "short",
		year: "numeric"
	}) : "Recently joined";
	const totalListeners = myPodcasts?.reduce((sum, p) => sum + p.listenerCount, 0) ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-full flex-col lg:flex-row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-6 mb-10",
				children: [user?.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: user.imageUrl,
					alt: displayName,
					className: "w-20 h-20 rounded-full shrink-0 object-cover"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
					from: "#f59e0b",
					to: "#f97535",
					className: "w-20 h-20 rounded-full shrink-0"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0 pt-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-xl font-bold text-white",
								children: displayName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-full bg-[#f97535]/15 px-3 py-0.5 text-xs font-semibold text-[#f97535]",
									children: "Podcaster"
								}), isPro && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "flex items-center gap-1 rounded-full bg-[#f97535] px-3 py-0.5 text-xs font-semibold text-white",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { size: 12 }), "Pro"]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[#71788B] text-sm mb-3",
							children: ["Member since ", memberSince]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-sm text-[#71788B]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, {
								size: 15,
								className: "text-[#f97535]"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-white font-bold",
									children: totalListeners.toLocaleString()
								}),
								" ",
								"total listeners"
							] })]
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold text-white",
						children: "My Podcasts"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "rounded-full bg-[#f97535]/15 px-2.5 py-0.5 text-xs font-semibold text-[#f97535]",
						children: myPodcasts?.length ?? 0
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/create-podcast",
					className: "flex items-center gap-1.5 text-base font-semibold text-[#fff] hover:text-[#f97535]/80 transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 14 }), "New Podcast"]
				})]
			}), myPodcasts === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
				children: [
					0,
					1,
					2,
					3
				].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-xl bg-[#15171C] border border-[#252525] p-4 animate-pulse",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-14 h-14 rounded-[3px] bg-white/10 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 space-y-2 pt-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 w-3/4 rounded bg-white/10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-1/2 rounded bg-white/10" })]
						})]
					})
				}, i))
			}) : myPodcasts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center justify-center rounded-xl border border-[#252525] bg-[#15171C] py-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mic, {
							size: 28,
							className: "text-[#71788B]"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-white text-base font-bold mb-1",
						children: "No podcasts yet"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[#71788B] text-sm mb-5",
						children: "Create your first one and start sharing"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/create-podcast",
						className: "flex items-center gap-2 rounded-md bg-[#f97535] px-[22px] py-[14px] text-base font-bold text-white hover:opacity-90 transition-opacity",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { size: 15 }), "Create your first podcast"]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
				children: myPodcasts.map((p, idx) => {
					const [from, to] = PLACEHOLDER_GRADIENT_PAIRS[idx % PLACEHOLDER_GRADIENT_PAIRS.length];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/podcast/$id",
						params: { id: p._id },
						className: "rounded-xl bg-[#15171C] border border-[#252525] hover:border-[#f97535]/30 transition-colors cursor-pointer group p-4 block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [
								p.thumbnailUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: p.thumbnailUrl,
									alt: p.title,
									className: "w-14 h-14 rounded-[3px] shrink-0 object-cover"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
									from,
									to,
									className: "w-14 h-14 rounded-[3px] shrink-0 transition-transform group-hover:scale-[1.03]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0 pt-0.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-white text-base font-bold truncate leading-snug mb-1.5",
											children: p.title
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5 text-xs text-[#71788B] mb-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { size: 11 }), p.listenerCount.toLocaleString()]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline-block rounded-full bg-[#f97535]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f97535]",
											children: p.status
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ellipsis, {
									size: 16,
									className: "shrink-0 text-[#71788B] opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
								})
							]
						})
					}, p._id);
				})
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "w-full shrink-0 border-t border-[#252525] px-4 py-6 sm:px-6 bg-[#15171C] lg:w-[349px] lg:border-l lg:border-t-0 lg:py-8 lg:overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-between mb-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-base font-bold text-white",
						children: "Top Podcasters"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-6",
					children: topPodcasters === void 0 ? [
						0,
						1,
						2
					].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 animate-pulse",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-10 rounded-full bg-white/10 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1 space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3.5 w-2/3 rounded bg-white/10" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-1/3 rounded bg-white/10" })]
						})]
					}, i)) : topPodcasters.map(({ user: u, count }, idx) => {
						const [from, to] = PLACEHOLDER_GRADIENT_PAIRS[idx % PLACEHOLDER_GRADIENT_PAIRS.length];
						const isMe = u && convexUser && u._id === convexUser._id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 cursor-pointer group",
							children: [u?.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: u.imageUrl,
								alt: u.name,
								className: "w-10 h-10 rounded-full shrink-0 object-cover"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GradientBox, {
								from,
								to,
								className: "w-10 h-10 rounded-full shrink-0"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: `text-base font-bold truncate transition-colors ${isMe ? "text-[#f97535]" : "text-white group-hover:text-[#f97535]"}`,
									children: [u?.name ?? "Unknown", isMe && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ml-1.5 text-xs font-normal text-[#f97535]/70",
										children: "(you)"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[#71788B] text-sm mt-0.5",
									children: [count, " Podcasts"]
								})]
							})]
						}, u?._id ?? idx);
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "text-base font-bold text-white mb-4",
				children: "Total Listeners"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl bg-[#101114] border border-[#252525] p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 mb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
						style: { background: "linear-gradient(135deg, #064e3b, #059669)" },
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, {
							size: 16,
							className: "text-white"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-white text-base font-bold",
						children: totalListeners.toLocaleString()
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[#71788B] text-sm",
						children: "all time"
					})] })]
				})
			})] })]
		})]
	});
}
//#endregion
export { MyProfilePage as component };
