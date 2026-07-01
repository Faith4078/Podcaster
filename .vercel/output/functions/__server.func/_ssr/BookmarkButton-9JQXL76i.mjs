import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, d as useAuth, f as useUser, x as require_react } from "../_libs/@clerk/react+[...].mjs";
import { s as useNavigate } from "../_libs/@clerk/tanstack-react-start+[...].mjs";
import { a as useQuery, i as useMutation } from "../_libs/convex.mjs";
import { t as api } from "./api-DSJLF2wo.mjs";
import { A as BookmarkCheck, O as Check, k as Bookmark, p as Plus, t as X, x as FolderPlus } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BookmarkButton-9JQXL76i.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
var FREE_BOOKMARK_LIMIT = 3;
function BookmarkButton({ podcastId, variant = "icon", className }) {
	const { user } = useUser();
	const { has } = useAuth();
	const navigate = useNavigate();
	const bookmarkedIds = useQuery(api.bookmarks.myBookmarkedIds, user ? {} : "skip");
	const folders = useQuery(api.bookmarks.listMyFolders, user ? {} : "skip");
	const addBookmark = useMutation(api.bookmarks.addBookmark);
	const removeBookmark = useMutation(api.bookmarks.removeBookmark);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [newName, setNewName] = (0, import_react.useState)("");
	const rootRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	const isBookmarked = !!bookmarkedIds?.some((id) => id === podcastId);
	const isPro = has?.({ plan: "pro" }) === true;
	const count = bookmarkedIds?.length ?? 0;
	const atLimit = !isPro && !isBookmarked && count >= FREE_BOOKMARK_LIMIT;
	(0, import_react.useEffect)(() => {
		if (!open) return;
		function onPointer(e) {
			if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
		}
		function onKey(e) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onPointer);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onPointer);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (creating) inputRef.current?.focus();
	}, [creating]);
	(0, import_react.useEffect)(() => {
		if (!open) {
			setCreating(false);
			setNewName("");
		}
	}, [open]);
	function handleTrigger(e) {
		e.preventDefault();
		e.stopPropagation();
		if (!user) {
			navigate({ to: "/sign-in" });
			return;
		}
		if (atLimit) {
			navigate({ to: "/billing" });
			return;
		}
		setOpen((v) => !v);
	}
	function onActionError(err) {
		if (err?.data?.code === "BOOKMARK_LIMIT") {
			setOpen(false);
			toast.error("You've used all 3 free bookmarks — upgrade to Pro for unlimited.");
			navigate({ to: "/billing" });
		} else {
			console.error("Bookmark action failed", err);
			toast.error("Something went wrong. Please try again.");
		}
	}
	async function saveToFolder(folderId, folderName) {
		if (busy) return;
		setBusy(true);
		try {
			await addBookmark({
				podcastId,
				folderId
			});
			setOpen(false);
			toast.success(`Saved to “${folderName}”`);
		} catch (err) {
			onActionError(err);
		} finally {
			setBusy(false);
		}
	}
	async function createAndSave(e) {
		e.preventDefault();
		e.stopPropagation();
		const name = newName.trim();
		if (busy || !name) return;
		setBusy(true);
		try {
			await addBookmark({
				podcastId,
				newFolderName: name
			});
			setOpen(false);
			toast.success(`Saved to “${name}”`);
		} catch (err) {
			onActionError(err);
		} finally {
			setBusy(false);
		}
	}
	async function unsaveEverywhere() {
		if (busy) return;
		setBusy(true);
		try {
			await removeBookmark({ podcastId });
			setOpen(false);
			toast("Removed from bookmarks");
		} catch (err) {
			onActionError(err);
		} finally {
			setBusy(false);
		}
	}
	const Icon = isBookmarked ? BookmarkCheck : Bookmark;
	const label = isBookmarked ? "Saved" : "Save";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: rootRef,
		className: "relative inline-flex",
		children: [variant === "button" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: handleTrigger,
			disabled: busy,
			"aria-haspopup": "menu",
			"aria-expanded": open,
			"aria-label": isBookmarked ? "Manage bookmark" : "Save podcast",
			className: `flex items-center gap-2 rounded-md border px-5 py-[14px] text-base font-bold transition-colors disabled:opacity-50 ${isBookmarked ? "border-[#f97535]/40 bg-[#f97535]/10 text-[#f97535]" : "border-[#252525] bg-[#15171C] text-white hover:border-[#f97535]/40"} ${className ?? ""}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				size: 15,
				fill: isBookmarked ? "currentColor" : "none"
			}), label]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: handleTrigger,
			disabled: busy,
			"aria-haspopup": "menu",
			"aria-expanded": open,
			"aria-label": isBookmarked ? "Manage bookmark" : "Save podcast",
			className: `flex h-8 items-center gap-1.5 rounded-full bg-black/50 px-2.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50 ${isBookmarked ? "text-[#f97535]" : ""} ${className ?? ""}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				size: 16,
				fill: isBookmarked ? "currentColor" : "none"
			}), label]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "menu",
			"aria-label": "Save to folder",
			onClick: (e) => e.stopPropagation(),
			className: "absolute right-0 top-full z-50 mt-2 w-60 max-w-[78vw] rounded-xl border border-[#252525] bg-[#15171C] p-2 shadow-xl shadow-black/40",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-2 pb-2 pt-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-semibold text-[#71788B]",
						children: "Save to folder"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setOpen(false),
						"aria-label": "Close",
						className: "text-[#71788B] hover:text-white transition-colors",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { size: 14 })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-h-56 overflow-y-auto",
					children: folders === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-2 py-2 text-sm text-[#71788B]",
						children: "Loading…"
					}) : folders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-2 py-2 text-sm text-[#71788B]",
						children: "No folders yet — create one below."
					}) : folders.map((folder) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						role: "menuitem",
						disabled: busy,
						onClick: () => saveToFolder(folder._id, folder.name),
						className: "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm text-white transition-colors hover:bg-white/[0.06] disabled:opacity-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "truncate",
							children: folder.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "shrink-0 text-xs text-[#71788B]",
							children: folder.count
						})]
					}, folder._id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 border-t border-[#252525] pt-1",
					children: creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: createAndSave,
						className: "flex items-center gap-1.5 p-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: inputRef,
							value: newName,
							onChange: (e) => setNewName(e.target.value),
							placeholder: "Folder name",
							maxLength: 60,
							className: "min-w-0 flex-1 rounded-md border border-[#252525] bg-[#101114] px-2 py-1.5 text-sm text-white placeholder:text-[#71788B] outline-none focus:border-[#f97535] transition-colors"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: busy || !newName.trim(),
							"aria-label": "Create folder and save",
							className: "flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#f97535] text-white transition-opacity hover:opacity-90 disabled:opacity-50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { size: 14 })
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setCreating(true),
						className: "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold text-[#f97535] transition-colors hover:bg-[#f97535]/10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderPlus, { size: 15 }), "New folder"]
					})
				}),
				isBookmarked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-1 border-t border-[#252525] pt-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: busy,
						onClick: unsaveEverywhere,
						className: "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-[#71788B] transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
							size: 15,
							className: "rotate-45"
						}), "Remove from all folders"]
					})
				})
			]
		})]
	});
}
//#endregion
export { BookmarkButton as t };
