import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, f as useUser, o as PricingTable } from "../_libs/@clerk/react+[...].mjs";
import { a as useQuery } from "../_libs/convex.mjs";
import { t as api } from "./api-DSJLF2wo.mjs";
import { M as Sparkles, S as Crown } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/billing-CeBQ9hgG.js
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function BillingPage() {
	const { user } = useUser();
	const isPro = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip")?.plan === "pro";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-3xl mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-bold text-white",
						children: "Plans & Billing"
					}), isPro && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1 rounded-full bg-[#f97535]/15 px-2.5 py-0.5 text-xs font-semibold text-[#f97535]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { size: 12 }), "Pro"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[#71788B] text-sm",
					children: "Free includes 3 podcast generations. Upgrade to Pro for unlimited generations, custom thumbnail uploads, and the Pro creator badge."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl border border-[#252525] bg-[#15171C] p-3 sm:p-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PricingTable, {})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex items-start gap-3 rounded-xl border border-[#252525] bg-[#15171C] px-4 py-3 text-sm text-[#71788B]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
					size: 16,
					className: "mt-0.5 shrink-0 text-[#f97535]"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Manage or cancel your subscription anytime from the pricing card above or your account settings. Cancelling keeps existing podcasts intact; the free generation limit simply re-applies." })]
			})
		]
	});
}
//#endregion
export { BillingPage as component };
