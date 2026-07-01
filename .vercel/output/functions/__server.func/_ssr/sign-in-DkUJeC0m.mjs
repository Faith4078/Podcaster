import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime } from "../_libs/@clerk/react+[...].mjs";
import { n as SignUp } from "../_libs/@clerk/tanstack-react-start+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sign-in-DkUJeC0m.js
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function AuthPageLayout({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d0f11]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: "/assets/Auth (3).webp",
				alt: "",
				"aria-hidden": "true",
				className: "pointer-events-none absolute inset-0 h-full w-full object-cover"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 bg-black/50" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none absolute inset-0",
				style: { background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 0%, rgba(0,0,0,0.55) 100%)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative z-10",
				children
			})
		]
	});
}
var clerkAppearance = { variables: {
	colorPrimary: "#f97535",
	colorPrimaryForeground: "#ffffff",
	colorBackground: "#13162b",
	colorForeground: "#ffffff",
	colorMutedForeground: "#b0b8d1",
	colorInput: "#1c1f38",
	colorInputForeground: "#ffffff",
	colorNeutral: "#8892b0",
	colorDanger: "#f87171",
	colorSuccess: "#4ade80",
	colorWarning: "#fbbf24",
	borderRadius: "10px",
	fontFamily: "inherit",
	fontSize: "14px"
} };
function SignUpPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthPageLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignUp, { appearance: clerkAppearance }) });
}
//#endregion
export { SignUpPage as component };
