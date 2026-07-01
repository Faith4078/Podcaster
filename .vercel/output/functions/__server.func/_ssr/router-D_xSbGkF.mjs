import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, d as useAuth, f as useUser, l as UserButton, p as QueryClient, r as Show, x as require_react } from "../_libs/@clerk/react+[...].mjs";
import { r as ClerkProvider } from "../_libs/@clerk/tanstack-react-start+[...].mjs";
import { c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRoute, k as redirect, l as useRouterState, m as createFileRoute, p as lazyRouteComponent, s as Scripts } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as getServerFnById, n as createServerFn, r as TSS_SERVER_FUNCTION } from "./ssr.mjs";
import { i as useMutation, n as ConvexReactClient, t as ConvexProviderWithClerk } from "../_libs/convex.mjs";
import { t as api } from "./api-DSJLF2wo.mjs";
import { C as CreditCard, F as House, _ as Menu, c as Shuffle, d as Repeat, g as Mic, h as Pause, k as Bookmark, m as Play, n as Volume2, r as User, s as SkipForward, t as X, w as Compass } from "../_libs/lucide-react.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as Route$12 } from "./edit._id-CQCGB4fi.mjs";
import { t as usePlayerStore } from "./playerStore-N3DxDJ64.mjs";
import { t as Route$13 } from "./podcast._id-VrU2iuhY.mjs";
import { n as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as ReactQueryDevtools2 } from "../_libs/tanstack__react-query-devtools.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-D_xSbGkF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
function formatTime(secs) {
	if (!secs || Number.isNaN(secs)) return "0:00";
	return `${Math.floor(secs / 60)}:${Math.floor(secs % 60).toString().padStart(2, "0")}`;
}
function SkipButton({ seconds, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: "relative flex flex-col items-center text-[#7f8596] hover:text-white transition-colors",
		"aria-label": `${seconds > 0 ? "Forward" : "Rewind"} ${Math.abs(seconds)} seconds`,
		title: `${seconds > 0 ? "Forward" : "Rewind"} ${Math.abs(seconds)} seconds`,
		children: [seconds < 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			width: "20",
			height: "20",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M1 4v6h6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3.51 15a9 9 0 1 0 .49-3.51" })]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			width: "20",
			height: "20",
			viewBox: "0 0 24 24",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M23 4v6h-6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20.49 15a9 9 0 1 1-.49-3.51" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold leading-none mt-px",
			children: Math.abs(seconds)
		})]
	});
}
function MiniPlayer() {
	const { currentTrack, isPlaying, pause, resume, stop } = usePlayerStore();
	const audioRef = (0, import_react.useRef)(null);
	const [current, setCurrent] = (0, import_react.useState)(0);
	const [duration, setDuration] = (0, import_react.useState)(0);
	const [volume, setVolume] = (0, import_react.useState)(.8);
	const [isShuffled, setShuffled] = (0, import_react.useState)(false);
	const [isRepeat, setRepeat] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const el = audioRef.current;
		if (!el || !currentTrack?.audioUrl) return;
		const syncPlayback = async () => {
			if (el.src !== currentTrack.audioUrl) {
				el.src = currentTrack.audioUrl;
				el.load();
				setCurrent(0);
				setDuration(0);
			}
			if (isPlaying) try {
				await el.play();
			} catch (err) {
				console.error("Playback failed:", err);
			}
			else el.pause();
		};
		syncPlayback();
	}, [
		currentTrack?.id,
		currentTrack?.audioUrl,
		isPlaying
	]);
	(0, import_react.useEffect)(() => {
		const el = audioRef.current;
		if (el) el.volume = volume;
	}, [volume]);
	if (!currentTrack) return null;
	const progress = duration > 0 ? current / duration * 100 : 0;
	const { title, author, imageGradient } = currentTrack;
	function seek(e) {
		const el = audioRef.current;
		if (!el || !duration) return;
		const rect = e.currentTarget.getBoundingClientRect();
		el.currentTime = (e.clientX - rect.left) / rect.width * duration;
	}
	function skip(seconds) {
		const el = audioRef.current;
		if (!el) return;
		el.currentTime = Math.max(0, Math.min(duration, el.currentTime + seconds));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-3 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] md:gap-6 md:px-6 md:py-3 md:pb-3",
		style: {
			background: "linear-gradient(to top, #0a0c14 80%, #0d0f1180)",
			backdropFilter: "blur(12px)",
			borderTop: "1px solid rgba(255,255,255,0.06)"
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("audio", {
				ref: audioRef,
				preload: "metadata",
				onTimeUpdate: () => setCurrent(audioRef.current?.currentTime ?? 0),
				onLoadedMetadata: () => setDuration(audioRef.current?.duration ?? 0),
				onError: () => console.error("Audio element error — check audioUrl:", currentTrack?.audioUrl),
				onEnded: isRepeat ? () => {
					if (audioRef.current) {
						audioRef.current.currentTime = 0;
						audioRef.current.play().catch(() => {});
					}
				} : stop
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 items-center gap-3 md:w-52 md:flex-none md:shrink-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-11 w-11 rounded-lg shrink-0 md:h-12 md:w-12",
					style: { background: `linear-gradient(135deg, ${imageGradient.from}, ${imageGradient.to})` }
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-white text-xs font-semibold truncate",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[#7f8596] text-[11px] truncate mt-0.5",
						children: author
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 flex-col items-center gap-2 md:flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4 md:gap-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setShuffled((v) => !v),
							className: `hidden md:inline-flex transition-colors ${isShuffled ? "text-[#f97535]" : "text-[#7f8596] hover:text-white"}`,
							"aria-label": "Shuffle",
							title: "Shuffle",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, { size: 17 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipButton, {
							seconds: -15,
							onClick: () => skip(-15)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: isPlaying ? pause : resume,
							"aria-label": isPlaying ? "Pause" : "Play",
							title: isPlaying ? "Pause" : "Play",
							className: "flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0d0f11] hover:bg-white/90 transition-colors shadow-lg md:h-10 md:w-10",
							children: isPlaying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {
								size: 17,
								fill: "#0d0f11"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {
								size: 17,
								fill: "#0d0f11",
								className: "translate-x-px"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipButton, {
							seconds: 15,
							onClick: () => skip(15)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "hidden md:inline-flex text-[#7f8596] hover:text-white transition-colors",
							"aria-label": "Skip to next",
							title: "Skip to next",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, { size: 17 })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setRepeat((v) => !v),
							className: `hidden md:inline-flex transition-colors ${isRepeat ? "text-[#f97535]" : "text-[#7f8596] hover:text-white"}`,
							"aria-label": "Repeat",
							title: "Repeat",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, { size: 17 })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "hidden w-full max-w-sm items-center gap-3 md:flex",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[#7f8596] text-[10px] w-7 text-right shrink-0",
							children: formatTime(current)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							role: "slider",
							tabIndex: 0,
							"aria-label": "Seek",
							title: "Seek",
							"aria-valuemin": 0,
							"aria-valuemax": Math.round(duration),
							"aria-valuenow": Math.round(current),
							"aria-valuetext": `${formatTime(current)} of ${formatTime(duration)}`,
							className: "flex-1 h-1 rounded-full bg-white/10 cursor-pointer relative",
							onClick: seek,
							onKeyDown: (e) => {
								const el = audioRef.current;
								if (!el) return;
								if (e.key === "ArrowRight") {
									e.preventDefault();
									el.currentTime = Math.min(duration, el.currentTime + 5);
								} else if (e.key === "ArrowLeft") {
									e.preventDefault();
									el.currentTime = Math.max(0, el.currentTime - 5);
								}
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full rounded-full bg-white transition-all",
								style: { width: `${progress}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[#7f8596] text-[10px] w-7 shrink-0",
							children: formatTime(duration)
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "hidden md:flex items-center gap-2.5 w-36 shrink-0 justify-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {
					size: 15,
					className: "text-[#7f8596] shrink-0"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "slider",
					tabIndex: 0,
					"aria-label": "Volume",
					title: "Volume",
					"aria-valuemin": 0,
					"aria-valuemax": 100,
					"aria-valuenow": Math.round(volume * 100),
					className: "flex-1 h-1 rounded-full bg-white/10 cursor-pointer relative",
					onClick: (e) => {
						const rect = e.currentTarget.getBoundingClientRect();
						setVolume(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
					},
					onKeyDown: (e) => {
						if (e.key === "ArrowRight" || e.key === "ArrowUp") {
							e.preventDefault();
							setVolume((v) => Math.min(1, v + .05));
						} else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
							e.preventDefault();
							setVolume((v) => Math.max(0, v - .05));
						}
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full rounded-full bg-white/60 transition-all",
						style: { width: `${volume * 100}%` }
					})
				})]
			})
		]
	});
}
var navItems = [
	{
		to: "/",
		icon: House,
		label: "Home",
		exact: true
	},
	{
		to: "/discover",
		icon: Compass,
		label: "Discover"
	},
	{
		to: "/bookmarks",
		icon: Bookmark,
		label: "Bookmarks"
	},
	{
		to: "/create-podcast",
		icon: Mic,
		label: "Create Podcast"
	},
	{
		to: "/my-profile",
		icon: User,
		label: "My Profile"
	},
	{
		to: "/billing",
		icon: CreditCard,
		label: "Billing"
	}
];
function PodcastrSidebar({ open = false, onClose }) {
	const { user } = useUser();
	const ensureCurrentUser = useMutation(api.users.ensureCurrentUser);
	(0, import_react.useEffect)(() => {
		if (!user) return;
		ensureCurrentUser({
			clerkId: user.id,
			name: user.fullName ?? user.username ?? "User",
			email: user.primaryEmailAddress?.emailAddress ?? "",
			imageUrl: user.imageUrl ?? void 0
		}).catch(console.error);
	}, [user?.id]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-[55] bg-black/60 md:hidden",
		onClick: onClose,
		"aria-hidden": "true"
	}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: `fixed inset-y-0 left-0 z-[60] flex h-full w-[270px] shrink-0 flex-col bg-[#15171C] transition-transform duration-300 ease-out md:static md:z-auto md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 px-7 py-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
						width: "28",
						height: "28",
						viewBox: "0 0 24 24",
						fill: "none",
						"aria-hidden": "true",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M4 3.5L21 12L4 20.5V3.5Z",
							fill: "#f97535"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xl font-bold tracking-tight text-white",
						children: "Podcastr"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						"aria-label": "Close menu",
						title: "Close menu",
						className: "ml-auto text-[#71788B] transition-colors hover:text-white md:hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 22 })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "mt-1 flex flex-col gap-0.5 pl-4 pr-0",
				children: navItems.map(({ to, icon: Icon, label, exact }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to,
					onClick: onClose,
					activeOptions: exact ? { exact: true } : void 0,
					className: "relative flex items-center gap-4 rounded-xl px-4 py-3 text-base font-bold text-[#71788B] transition-colors hover:bg-white/6 hover:text-white",
					activeProps: { className: "relative flex items-center gap-4 rounded-xl px-4 py-3 text-base font-bold text-white bg-white/6 after:content-[''] after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2 after:h-7 after:w-[3px] after:rounded-l-full after:bg-[#f97535]" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { size: 18 }), label]
				}, to))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-white/6 px-6 py-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Show, {
					when: "signed-in",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {
						showName: true,
						appearance: {
							variables: {
								colorForeground: "#ffffff",
								colorBackground: "#15171C",
								colorMutedForeground: "#71788B"
							},
							elements: {
								userButtonOuterIdentifier: "text-white font-semibold",
								userButtonPopoverCard: "bg-[#15171C] border border-[#252525]",
								userButtonPopoverMain: "bg-[#15171C]",
								userButtonPopoverActions: "bg-[#15171C]",
								userButtonPopoverActionButton: "text-white hover:bg-white/5",
								userButtonPopoverActionButtonIcon: "text-[#71788B]",
								userButtonPopoverActionButtonIconBox: "text-[#71788B]",
								userButtonPopoverFooter: "bg-[#15171C]"
							}
						}
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Show, {
					when: "signed-out",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/sign-in",
						onClick: onClose,
						className: "flex w-full items-center justify-center rounded-md bg-[#f97535] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90",
						children: "Sign up"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-center text-xs text-[#71788B]",
						children: [
							"Already have an account?",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/sign-in",
								onClick: onClose,
								className: "font-semibold text-[#f97535] hover:underline",
								children: "Sign in"
							})
						]
					})]
				})]
			})
		]
	})] });
}
var PUBLISHABLE_KEY = "pk_test_ZGVzaXJlZC1jYXRmaXNoLTkxLmNsZXJrLmFjY291bnRzLmRldiQ";
function AppClerkProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClerkProvider, {
		publishableKey: PUBLISHABLE_KEY,
		afterSignOutUrl: "/",
		children
	});
}
var convex = new ConvexReactClient("https://modest-chihuahua-994.convex.cloud");
function ConvexProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConvexProviderWithClerk, {
		client: convex,
		useAuth,
		children
	});
}
var queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 6e4 } } });
function AppQueryProvider({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReactQueryDevtools2, { initialIsOpen: false })]
	});
}
var styles_default = "/assets/styles-DRTkg7ob.css";
var Route$11 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Podcastr — AI Podcast App" }
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}]
	}),
	shellComponent: RootDocument,
	component: AppShell
});
var NO_SIDEBAR_ROUTES = ["/sign-in", "/sign-up"];
function AppShell() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const withSidebar = !NO_SIDEBAR_ROUTES.some((p) => pathname.startsWith(p));
	const [navOpen, setNavOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setNavOpen(false);
	}, [pathname]);
	(0, import_react.useEffect)(() => {
		if (!navOpen) return;
		const onKey = (e) => {
			if (e.key === "Escape") setNavOpen(false);
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [navOpen]);
	if (!withSidebar) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-screen overflow-hidden bg-[#101114]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PodcastrSidebar, {
				open: navOpen,
				onClose: () => setNavOpen(false)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex h-14 shrink-0 items-center gap-3 border-b border-[#252525] bg-[#15171C] px-4 md:hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setNavOpen(true),
						"aria-label": "Open menu",
						title: "Open menu",
						className: "text-white transition-colors hover:text-[#f97535]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, { size: 24 })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-lg font-bold tracking-tight text-white",
						children: "Podcastr"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-24",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MiniPlayer, {})
		]
	});
}
function RootDocument({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "font-sans antialiased bg-[#101114] text-white [overflow-wrap:anywhere]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppQueryProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppClerkProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ConvexProvider, { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "bottom-right",
				richColors: true,
				toastOptions: { style: {
					background: "#15171C",
					border: "1px solid #252525",
					color: "#ffffff"
				} }
			})] }) }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})]
		})]
	});
}
var $$splitComponentImporter$10 = () => import("./sign-in-DkUJeC0m.mjs");
var Route$10 = createFileRoute("/sign-in")({ component: lazyRouteComponent($$splitComponentImporter$10, "component") });
var $$splitComponentImporter$9 = () => import("./discover-DARREXBU.mjs");
var Route$9 = createFileRoute("/discover")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./bookmarks-BFn-kKDO.mjs");
var Route$8 = createFileRoute("/bookmarks")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./billing-CeBQ9hgG.mjs");
var Route$7 = createFileRoute("/billing")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./about-D9herq5f.mjs");
var Route$6 = createFileRoute("/about")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var $$splitComponentImporter$5 = () => import("../_authenticated-BsiboBRC.mjs");
var checkAuth = createServerFn({ method: "GET" }).handler(createSsrRpc("946c77cb015d3af369324ebdb693c583b25d59a10ba5ec676db9a45c5b74da4a"));
var Route$5 = createFileRoute("/_authenticated")({
	beforeLoad: async () => {
		const { userId } = await checkAuth();
		if (!userId) throw redirect({ to: "/sign-in" });
	},
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./routes-CSbQVTF5.mjs");
var Route$4 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./query-Dd-mGTYT.mjs");
var Route$3 = createFileRoute("/demo/query")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./clerk-DwBHME0d.mjs");
var Route$2 = createFileRoute("/demo/clerk")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./my-profile-DTX8nJZd.mjs");
var Route$1 = createFileRoute("/_authenticated/my-profile")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./create-podcast-DK65quHB.mjs");
var Route = createFileRoute("/_authenticated/create-podcast")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var SignInRoute = Route$10.update({
	id: "/sign-in",
	path: "/sign-in",
	getParentRoute: () => Route$11
});
var DiscoverRoute = Route$9.update({
	id: "/discover",
	path: "/discover",
	getParentRoute: () => Route$11
});
var BookmarksRoute = Route$8.update({
	id: "/bookmarks",
	path: "/bookmarks",
	getParentRoute: () => Route$11
});
var BillingRoute = Route$7.update({
	id: "/billing",
	path: "/billing",
	getParentRoute: () => Route$11
});
var AboutRoute = Route$6.update({
	id: "/about",
	path: "/about",
	getParentRoute: () => Route$11
});
var AuthenticatedRoute = Route$5.update({
	id: "/_authenticated",
	getParentRoute: () => Route$11
});
var IndexRoute = Route$4.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$11
});
var PodcastIdRoute = Route$13.update({
	id: "/podcast/$id",
	path: "/podcast/$id",
	getParentRoute: () => Route$11
});
var EditIdRoute = Route$12.update({
	id: "/edit/$id",
	path: "/edit/$id",
	getParentRoute: () => Route$11
});
var DemoQueryRoute = Route$3.update({
	id: "/demo/query",
	path: "/demo/query",
	getParentRoute: () => Route$11
});
var DemoClerkRoute = Route$2.update({
	id: "/demo/clerk",
	path: "/demo/clerk",
	getParentRoute: () => Route$11
});
var AuthenticatedMyProfileRoute = Route$1.update({
	id: "/my-profile",
	path: "/my-profile",
	getParentRoute: () => AuthenticatedRoute
});
var AuthenticatedRouteChildren = {
	AuthenticatedCreatePodcastRoute: Route.update({
		id: "/create-podcast",
		path: "/create-podcast",
		getParentRoute: () => AuthenticatedRoute
	}),
	AuthenticatedMyProfileRoute
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRoute: AuthenticatedRoute._addFileChildren(AuthenticatedRouteChildren),
	AboutRoute,
	BillingRoute,
	BookmarksRoute,
	DiscoverRoute,
	SignInRoute,
	DemoClerkRoute,
	DemoQueryRoute,
	EditIdRoute,
	PodcastIdRoute
};
var routeTree = Route$11._addFileChildren(rootRouteChildren)._addFileTypes();
function getRouter() {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		defaultViewTransition: true
	});
}
//#endregion
export { getRouter };
