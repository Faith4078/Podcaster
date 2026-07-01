import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, f as useUser, x as require_react } from "../_libs/@clerk/react+[...].mjs";
import { s as useNavigate } from "../_libs/@clerk/tanstack-react-start+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQuery, r as useAction } from "../_libs/convex.mjs";
import { t as api } from "./api-DSJLF2wo.mjs";
import { L as CircleAlert, P as LoaderCircle, j as ArrowLeft, u as Save } from "../_libs/lucide-react.mjs";
import { t as Route } from "./edit._id-CQCGB4fi.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/edit._id-DDVtftdC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
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
var VOICES = [
	"alloy",
	"echo",
	"fable",
	"onyx",
	"nova",
	"shimmer"
];
function needsRegen(original, draft) {
	return draft.topicPrompt !== original.topicPrompt || draft.speaker1Voice !== original.speaker1Voice || draft.thumbnailPrompt !== (original.thumbnailPrompt ?? "");
}
function EditPodcastPage() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const { user, isLoaded: userLoaded } = useUser();
	const podcast = useQuery(api.podcasts.getById, { id });
	const convexUser = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");
	const editAndRegenerate = useAction(api.podcasts.editAndRegenerate);
	const [title, setTitle] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const [topicPrompt, setTopicPrompt] = (0, import_react.useState)("");
	const [speaker1Voice, setSpeaker1Voice] = (0, import_react.useState)("");
	const [thumbnailPrompt, setThumbnailPrompt] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (!podcast) return;
		setTitle(podcast.title);
		setDescription(podcast.description);
		setCategory(podcast.category);
		setTopicPrompt(podcast.topicPrompt);
		setSpeaker1Voice(podcast.speaker1Voice);
		setThumbnailPrompt(podcast.thumbnailPrompt ?? "");
	}, [podcast?._id]);
	if (!userLoaded || podcast === void 0 || !!user && convexUser === void 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
	if (!user || !convexUser) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col items-center justify-center gap-3 text-[#71788B]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 32 }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-base font-bold text-white",
				children: "Sign in to edit podcasts"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/sign-in",
				className: "text-[#f97535] text-sm font-semibold hover:underline",
				children: "Sign in"
			})
		]
	});
	if (convexUser._id !== podcast.authorId) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col items-center justify-center gap-3 text-[#71788B]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { size: 32 }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-base font-bold text-white",
				children: "You don't own this podcast"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/podcast/$id",
				params: { id },
				className: "text-[#f97535] text-sm font-semibold hover:underline",
				children: "Back to episode"
			})
		]
	});
	const draft = {
		topicPrompt,
		speaker1Voice,
		thumbnailPrompt
	};
	const willRegenerate = needsRegen({
		topicPrompt: podcast.topicPrompt,
		speaker1Voice: podcast.speaker1Voice,
		thumbnailPrompt: podcast.thumbnailPrompt
	}, draft);
	async function handleSubmit(e) {
		e.preventDefault();
		if (!convexUser) return;
		setSaving(true);
		setError(null);
		try {
			await editAndRegenerate({
				id,
				authorId: convexUser._id,
				title: title.trim() || void 0,
				description: description.trim() || void 0,
				category: category || void 0,
				topicPrompt: topicPrompt.trim() || void 0,
				speaker1Voice: speaker1Voice || void 0,
				thumbnailPrompt: thumbnailPrompt.trim() || void 0,
				needsRegeneration: willRegenerate
			});
			navigate({
				to: "/podcast/$id",
				params: { id }
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save changes");
			setSaving(false);
		}
	}
	const inputClass = "w-full rounded-xl border border-[#252525] bg-[#15171C] px-4 py-3 text-white text-sm placeholder:text-[#71788B] focus:border-[#f97535]/50 focus:outline-none transition-colors";
	const labelClass = "block text-sm font-semibold text-white mb-2";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-full px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-2xl mx-auto",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/podcast/$id",
				params: { id },
				className: "inline-flex items-center gap-2 text-[#71788B] text-sm font-semibold hover:text-white transition-colors mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { size: 16 }), "Back to episode"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-bold text-white mb-1",
				children: "Edit Podcast"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[#71788B] text-sm mb-8",
				children: "Changes to the topic, voices, or thumbnail prompt will trigger a full re-generation."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmit,
				className: "flex flex-col gap-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: labelClass,
						children: "Title"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: title,
						onChange: (e) => setTitle(e.target.value),
						required: true,
						className: inputClass,
						placeholder: "Episode title"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: labelClass,
						children: "Category"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: category,
						onChange: (e) => setCategory(e.target.value),
						required: true,
						className: `${inputClass} cursor-pointer`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							disabled: true,
							children: "Select a category"
						}), CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: c,
							children: c
						}, c))]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: labelClass,
						children: "Description"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: description,
						onChange: (e) => setDescription(e.target.value),
						rows: 3,
						className: `${inputClass} resize-none`,
						placeholder: "Brief episode description"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: labelClass,
						children: ["Topic / Script Prompt", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-[10px] font-normal text-[#f97535] uppercase tracking-wide",
							children: "re-generates audio"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: topicPrompt,
						onChange: (e) => setTopicPrompt(e.target.value),
						rows: 4,
						className: `${inputClass} resize-none`,
						placeholder: "Describe what the podcast episode should cover…"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: labelClass,
						children: ["Voice", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-[10px] font-normal text-[#f97535] uppercase tracking-wide",
							children: "re-generates audio"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: speaker1Voice,
						onChange: (e) => setSpeaker1Voice(e.target.value),
						className: `${inputClass} cursor-pointer`,
						children: VOICES.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: v,
							children: v
						}, v))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: labelClass,
						children: ["Thumbnail Prompt", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-[10px] font-normal text-[#f97535] uppercase tracking-wide",
							children: "re-generates thumbnail"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: thumbnailPrompt,
						onChange: (e) => setThumbnailPrompt(e.target.value),
						className: inputClass,
						placeholder: "Describe the thumbnail image (optional)"
					})] }),
					willRegenerate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-[#f97535]/25 bg-[#f97535]/8 px-4 py-3 flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							size: 16,
							className: "text-[#f97535] shrink-0 mt-0.5"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-[#f97535]",
							children: "These changes will trigger a full re-generation. The episode will enter the pending state while the new audio and thumbnail are created."
						})]
					}),
					error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-red-400",
							children: error
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "submit",
							disabled: saving,
							className: "flex items-center gap-2 rounded-md bg-[#f97535] px-6 py-3 text-base font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50",
							children: saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
								size: 16,
								className: "animate-spin"
							}), "Saving…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { size: 16 }), willRegenerate ? "Save & Regenerate" : "Save Changes"] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/podcast/$id",
							params: { id },
							className: "rounded-md border border-[#252525] px-6 py-3 text-base font-bold text-[#71788B] hover:text-white transition-colors",
							children: "Cancel"
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { EditPodcastPage as component };
