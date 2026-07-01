import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime } from "../_libs/@clerk/react+[...].mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/query-Dd-mGTYT.js
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
async function fetchEpisodes() {
	await new Promise((r) => setTimeout(r, 300));
	return [
		{
			id: 1,
			title: "Getting Started with TanStack",
			duration: "42:00"
		},
		{
			id: 2,
			title: "Deep Dive into React Query",
			duration: "58:15"
		},
		{
			id: 3,
			title: "Server Functions & SSR",
			duration: "37:45"
		}
	];
}
function QueryDemo() {
	const { data, isPending, isError } = useQuery({
		queryKey: ["episodes"],
		queryFn: fetchEpisodes
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "page-wrap px-4 pb-8 pt-14",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "island-shell rise-in rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "island-kicker mb-3",
					children: "TanStack Query Demo"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "display-title mb-5 text-3xl font-bold tracking-tight text-[var(--sea-ink)]",
					children: "Episodes"
				}),
				isPending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[var(--sea-ink-soft)]",
					children: "Loading…"
				}),
				isError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-red-500",
					children: "Failed to load episodes."
				}),
				data && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-3",
					children: data.map((ep) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center justify-between rounded-xl border border-[rgba(50,143,151,0.2)] bg-white/50 px-5 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium text-[var(--sea-ink)]",
							children: ep.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-[var(--sea-ink-soft)]",
							children: ep.duration
						})]
					}, ep.id))
				})
			]
		})
	});
}
//#endregion
export { QueryDemo as component };
