import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, f as useUser, r as Show } from "../_libs/@clerk/react+[...].mjs";
import { t as SignIn } from "../_libs/@clerk/tanstack-react-start+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/clerk-DwBHME0d.js
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function ClerkDemo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "demo-page demo-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "demo-panel w-full max-w-md space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Show, {
				when: "signed-out",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "island-kicker mb-2",
								children: "Clerk"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "demo-title",
								children: "Sign in to continue"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "demo-muted text-sm",
								children: "Clerk renders the sign-in UI, manages sessions, and handles social providers for you."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-center pt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignIn, { routing: "hash" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "demo-muted text-center text-xs",
						children: [
							"Built with",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "https://clerk.com",
								target: "_blank",
								rel: "noopener noreferrer",
								className: "font-medium",
								children: "CLERK"
							}),
							"."
						]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Show, {
				when: "signed-in",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SignedInGreeting, {})
			})]
		})
	});
}
function SignedInGreeting() {
	const { user } = useUser();
	if (!user) return null;
	const email = user.primaryEmailAddress?.emailAddress;
	const initial = (user.firstName || email || "U").charAt(0).toUpperCase();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "island-kicker mb-2",
						children: "Clerk"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "demo-title",
						children: "Welcome back"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "demo-muted text-sm",
						children: ["You're signed in as ", email]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [user.imageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: user.imageUrl,
					alt: "",
					className: "h-10 w-10 rounded-full"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-10 w-10 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center rounded-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-medium text-neutral-600 dark:text-neutral-400",
						children: initial
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-medium truncate",
						children: [
							user.firstName,
							" ",
							user.lastName
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-neutral-500 dark:text-neutral-400 truncate",
						children: email
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "demo-muted text-center text-xs",
				children: [
					"Manage your account from the avatar in the header. Built with",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "https://clerk.com",
						target: "_blank",
						rel: "noopener noreferrer",
						className: "font-medium",
						children: "CLERK"
					}),
					"."
				]
			})
		]
	});
}
//#endregion
export { ClerkDemo as component };
