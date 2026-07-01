import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, x as require_react } from "../_libs/@clerk/react+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQuery, r as useAction } from "../_libs/convex.mjs";
import { t as api } from "./api-DSJLF2wo.mjs";
import { D as ChevronDown, O as Check, R as ChartColumn, l as Search } from "../_libs/lucide-react.mjs";
import { t as BookmarkButton } from "./BookmarkButton-9JQXL76i.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/discover-DARREXBU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function CategoryDropdown({ options, value, onChange, allLabel = "All categories", className }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const rootRef = (0, import_react.useRef)(null);
	const listRef = (0, import_react.useRef)(null);
	const [activeIndex, setActiveIndex] = (0, import_react.useState)(-1);
	const rows = [{
		value: null,
		label: allLabel
	}, ...options.map((o) => ({
		value: o,
		label: o
	}))];
	(0, import_react.useEffect)(() => {
		if (!open) return;
		function onPointer(e) {
			if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
		}
		document.addEventListener("mousedown", onPointer);
		return () => document.removeEventListener("mousedown", onPointer);
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (open) setActiveIndex(rows.findIndex((r) => r.value === value));
	}, [open]);
	function select(next) {
		onChange(next);
		setOpen(false);
	}
	function onTriggerKey(e) {
		if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			setOpen(true);
		}
	}
	function onListKey(e) {
		if (e.key === "Escape") {
			e.preventDefault();
			setOpen(false);
			return;
		}
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setActiveIndex((i) => Math.min(i + 1, rows.length - 1));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setActiveIndex((i) => Math.max(i - 1, 0));
		} else if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (activeIndex >= 0 && activeIndex < rows.length) select(rows[activeIndex].value);
		}
	}
	(0, import_react.useEffect)(() => {
		if (open) listRef.current?.focus();
	}, [open]);
	const selectedLabel = value ?? allLabel;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: `relative inline-block ${className ?? ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setOpen((v) => !v),
			onKeyDown: onTriggerKey,
			"aria-haspopup": "listbox",
			"aria-expanded": open,
			"aria-label": "Filter by category",
			className: `flex items-center justify-between gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors min-w-[180px] ${value ? "border-[#f97535]/50 bg-[#15171C] text-white" : "border-[#252525] bg-[#15171C] text-[#71788B] hover:text-white hover:border-[#f97535]/40"}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "truncate",
				children: selectedLabel
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
				size: 16,
				className: `shrink-0 transition-transform ${open ? "rotate-180" : ""} ${value ? "text-[#f97535]" : ""}`
			})]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: listRef,
			role: "listbox",
			tabIndex: -1,
			"aria-label": "Categories",
			onKeyDown: onListKey,
			className: "absolute left-0 top-full z-50 mt-2 max-h-72 w-full min-w-[200px] overflow-y-auto rounded-xl border border-[#252525] bg-[#15171C] p-1.5 shadow-xl shadow-black/40 outline-none",
			children: rows.map((row, i) => {
				const isSelected = row.value === value;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					role: "option",
					"aria-selected": isSelected,
					onClick: () => select(row.value),
					onMouseEnter: () => setActiveIndex(i),
					className: `flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${i === activeIndex ? "bg-white/[0.06]" : ""} ${isSelected ? "text-[#f97535] font-semibold" : "text-white"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate",
						children: row.label
					}), isSelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
						size: 15,
						className: "shrink-0 text-[#f97535]"
					})]
				}, row.value ?? "__all__");
			})
		})]
	});
}
var CATEGORIES = [
	"Technology",
	"Business",
	"Education",
	"Entertainment",
	"Health",
	"Science",
	"Sports",
	"True Crime",
	"Comedy",
	"News"
];
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
function PodcastRow({ podcast }) {
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
function DiscoverPage() {
	const [query, setQuery] = (0, import_react.useState)("");
	const [activeCategory, setActiveCategory] = (0, import_react.useState)(null);
	const trimmed = query.trim();
	const hybridSearch = useAction(api.podcasts.hybridSearch);
	const [semanticResults, setSemanticResults] = (0, import_react.useState)(void 0);
	const [searchError, setSearchError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!trimmed) {
			setSemanticResults(void 0);
			setSearchError(null);
			return;
		}
		let cancelled = false;
		setSemanticResults(void 0);
		setSearchError(null);
		const timer = setTimeout(async () => {
			try {
				const results = await hybridSearch({
					query: trimmed,
					category: activeCategory ?? void 0
				});
				if (!cancelled) setSemanticResults(results);
			} catch (err) {
				if (cancelled) return;
				const msg = String(err?.message ?? err);
				setSearchError(msg.includes("RATE_LIMITED") || msg.toLowerCase().includes("busy") ? "Search is busy right now — showing the latest instead." : "Search is unavailable right now — showing the latest instead.");
				setSemanticResults(void 0);
			}
		}, 400);
		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [
		trimmed,
		activeCategory,
		hybridSearch
	]);
	const latest = useQuery(api.podcasts.getLatest, { limit: 24 });
	const latestFiltered = latest === void 0 ? void 0 : activeCategory ? latest.filter((p) => p.category === activeCategory) : latest;
	const podcasts = !trimmed ? latestFiltered : searchError ? latestFiltered : semanticResults;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 py-6 sm:px-6 md:px-8 md:py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative mb-7",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
					className: "absolute left-4 top-1/2 -translate-y-1/2 text-[#71788B]",
					size: 15
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					value: query,
					onChange: (e) => setQuery(e.target.value),
					placeholder: "Search by idea — e.g. “why saas is dying”",
					className: "w-full rounded-md bg-[#15171C] pl-10 pr-4 py-3 text-sm text-white placeholder:text-[#71788B] border border-[#252525] outline-none focus:border-[#f97535] transition-colors"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap items-center justify-between gap-3 mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold text-white",
					children: "Discover"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryDropdown, {
					options: CATEGORIES,
					value: activeCategory,
					onChange: setActiveCategory
				})]
			}),
			trimmed && searchError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-4 text-[#f97535] text-xs",
				children: searchError
			}) : null,
			podcasts === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5",
				children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowSkeleton, {}, i))
			}) : podcasts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[#71788B] text-sm",
				children: trimmed && !searchError ? "Nothing matches that idea yet — try describing it differently." : "No podcasts yet — create the first one!"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5",
				children: podcasts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PodcastRow, { podcast: p }, p._id))
			})
		]
	});
}
//#endregion
export { DiscoverPage as component };
