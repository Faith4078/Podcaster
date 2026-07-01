import { r as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, d as useAuth, f as useUser, x as require_react } from "../_libs/@clerk/react+[...].mjs";
import { s as useNavigate } from "../_libs/@clerk/tanstack-react-start+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as useQuery, i as useMutation, r as useAction } from "../_libs/convex.mjs";
import { t as api } from "./api-DSJLF2wo.mjs";
import { P as LoaderCircle, S as Crown, i as Upload, v as Lock } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/create-podcast-DK65quHB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime());
var FREE_GENERATION_LIMIT = 3;
var AI_VOICES = [
	{
		id: "alloy",
		name: "Alloy"
	},
	{
		id: "echo",
		name: "Echo"
	},
	{
		id: "fable",
		name: "Fable"
	},
	{
		id: "onyx",
		name: "Onyx"
	},
	{
		id: "nova",
		name: "Nova"
	},
	{
		id: "shimmer",
		name: "Shimmer"
	}
];
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
function VoiceSelect({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			className: "block text-base font-bold text-[#71788B] mb-2",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				value,
				onChange: (e) => onChange(e.target.value),
				className: "w-full appearance-none rounded-md bg-[#15171C] px-4 py-3 pr-10 text-sm border border-[#252525] outline-none focus:border-[#f97535] transition-colors cursor-pointer",
				style: { color: value ? "#fff" : "#71788B" },
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: "",
					disabled: true,
					className: "bg-[#15171C] text-[#71788B]",
					children: "Select a voice"
				}), AI_VOICES.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
					value: v.id,
					className: "bg-[#15171C] text-white",
					children: v.name
				}, v.id))]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
				className: "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71788B]",
				width: "14",
				height: "14",
				viewBox: "0 0 14 14",
				fill: "none",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
					d: "M3 5l4 4 4-4",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			})]
		})]
	});
}
function CreatePodcastPage() {
	const { user } = useUser();
	const { has } = useAuth();
	const navigate = useNavigate();
	const convexUser = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : "skip");
	const createPodcast = useMutation(api.podcasts.create);
	const generatePodcast = useAction(api.podcasts.generatePodcast);
	const generateUploadUrl = useMutation(api.podcasts.generateThumbnailUploadUrl);
	const setCustomThumbnail = useMutation(api.podcasts.setCustomThumbnail);
	const isPro = convexUser?.plan === "pro" || has?.({ plan: "pro" }) === true;
	const canUploadThumbnail = isPro || has?.({ feature: "custom_thumbnail" }) === true;
	const generationCount = convexUser?.generationCount ?? 0;
	const remainingFree = Math.max(0, FREE_GENERATION_LIMIT - generationCount);
	const atFreeLimit = !isPro && remainingFree === 0;
	const [title, setTitle] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [speaker1, setSpeaker1] = (0, import_react.useState)("");
	const [script, setScript] = (0, import_react.useState)("");
	const [thumbnailPrompt, setThumbnailPrompt] = (0, import_react.useState)("");
	const [thumbnailMethod, setThumbnailMethod] = (0, import_react.useState)("ai");
	const [thumbnailFile, setThumbnailFile] = (0, import_react.useState)(null);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [quotaHit, setQuotaHit] = (0, import_react.useState)(false);
	const fileInputRef = (0, import_react.useRef)(null);
	async function handlePublish() {
		if (!convexUser) return;
		setSubmitting(true);
		setQuotaHit(false);
		try {
			const id = await createPodcast({
				title,
				description,
				category,
				topicPrompt: script,
				thumbnailPrompt: thumbnailMethod === "ai" ? thumbnailPrompt || void 0 : void 0,
				speaker1Voice: speaker1,
				authorId: convexUser._id
			});
			if (thumbnailMethod === "upload" && thumbnailFile && canUploadThumbnail) try {
				const uploadUrl = await generateUploadUrl({});
				const { storageId } = await (await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": thumbnailFile.type },
					body: thumbnailFile
				})).json();
				await setCustomThumbnail({
					podcastId: id,
					storageId
				});
			} catch (uploadErr) {
				console.error("Custom thumbnail upload failed", uploadErr);
			}
			await generatePodcast({ podcastId: id });
			toast.success("Your podcast is generating — this can take a moment.");
			navigate({
				to: "/podcast/$id",
				params: { id }
			});
		} catch (err) {
			if (err?.data?.code === "QUOTA_EXCEEDED") setQuotaHit(true);
			else {
				console.error("Failed to create podcast", err);
				toast.error("Failed to create podcast. Please try again.");
			}
			setSubmitting(false);
		}
	}
	const showWall = atFreeLimit || quotaHit;
	const canPublish = !submitting && !!convexUser && title.trim() && speaker1 && script.trim() && category;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-2xl",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-xl font-bold text-white mb-8",
			children: "Create Podcast"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-base font-bold text-white mb-2.5",
					children: ["Podcast Title ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[#f97535]",
						children: "*"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					value: title,
					onChange: (e) => setTitle(e.target.value),
					placeholder: "Give your podcast a title",
					className: "w-full rounded-md bg-[#15171C] px-4 py-3 text-sm text-white placeholder:text-[#71788B] border border-[#252525] outline-none focus:border-[#f97535] transition-colors"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-base font-bold text-white mb-2.5",
					children: ["Category ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[#f97535]",
						children: "*"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: category,
						onChange: (e) => setCategory(e.target.value),
						className: "w-full appearance-none rounded-md bg-[#15171C] px-4 py-3 pr-10 text-sm border border-[#252525] outline-none focus:border-[#f97535] transition-colors cursor-pointer",
						style: { color: category ? "#fff" : "#71788B" },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							disabled: true,
							className: "bg-[#15171C] text-[#71788B]",
							children: "Select a category"
						}), CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: c,
							className: "bg-[#15171C] text-white",
							children: c
						}, c))]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
						className: "pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#71788B]",
						width: "14",
						height: "14",
						viewBox: "0 0 14 14",
						fill: "none",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M3 5l4 4 4-4",
							stroke: "currentColor",
							strokeWidth: "1.5",
							strokeLinecap: "round",
							strokeLinejoin: "round"
						})
					})]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "block text-base font-bold text-white mb-2.5",
					children: "Description"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: description,
					onChange: (e) => setDescription(e.target.value),
					placeholder: "What is your podcast about?",
					rows: 3,
					className: "w-full rounded-md bg-[#15171C] px-4 py-3 text-sm text-white placeholder:text-[#71788B] border border-[#252525] outline-none focus:border-[#f97535] transition-colors resize-none"
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-base font-bold text-white mb-3",
					children: ["Voice ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[#f97535]",
						children: "*"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VoiceSelect, {
					label: "Speaker Voice",
					value: speaker1,
					onChange: setSpeaker1
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-base font-bold text-white mb-1",
						children: ["AI Topic Prompt ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[#f97535]",
							children: "*"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[#71788B] text-sm mb-3",
						children: "Describe the topic you want the AI to discuss — it will write and voice the dialogue."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: script,
						onChange: (e) => setScript(e.target.value),
						placeholder: "e.g. The future of autonomous vehicles and how they will reshape city infrastructure",
						rows: 6,
						className: "w-full rounded-md bg-[#15171C] px-4 py-3 text-sm text-white placeholder:text-[#71788B] border border-[#252525] outline-none focus:border-[#f97535] transition-colors resize-none"
					})
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-base font-bold text-white mb-3",
						children: "Podcast Thumbnail"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-3 mb-4",
						children: ["ai", "upload"].map((method) => {
							const locked = method === "upload" && !canUploadThumbnail;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									if (locked) {
										navigate({ to: "/billing" });
										return;
									}
									setThumbnailMethod(method);
								},
								className: `flex-1 flex items-center justify-center gap-2 rounded-md py-3 text-base font-bold border transition-colors ${thumbnailMethod === method ? "border-[#f97535] bg-[#f97535]/10 text-[#f97535]" : "border-[#252525] bg-[#15171C] text-[#71788B] hover:text-white"}`,
								children: [locked && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 13 }), method === "ai" ? "AI Generate" : "Upload Image"]
							}, method);
						})
					}),
					thumbnailMethod === "ai" || !canUploadThumbnail ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: thumbnailPrompt,
						onChange: (e) => setThumbnailPrompt(e.target.value),
						placeholder: "Describe your thumbnail (e.g. futuristic microphone with neon lights)",
						className: "w-full rounded-md bg-[#15171C] px-4 py-3 text-sm text-white placeholder:text-[#71788B] border border-[#252525] outline-none focus:border-[#f97535] transition-colors"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-[#252525] bg-[#15171C] p-10 cursor-pointer hover:border-[#f97535]/40 transition-colors",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
								size: 24,
								className: "text-[#71788B]"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-white text-base font-bold",
									children: thumbnailFile ? thumbnailFile.name : "Click to upload"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[#71788B] text-sm mt-1",
									children: "PNG, JPG up to 10 MB"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileInputRef,
								type: "file",
								accept: "image/*",
								className: "hidden",
								onChange: (e) => setThumbnailFile(e.target.files?.[0] ?? null)
							})
						]
					}),
					!canUploadThumbnail && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 flex items-center gap-1.5 text-xs text-[#71788B]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { size: 12 }),
							"Custom thumbnail upload is a",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/billing",
								className: "font-semibold text-[#f97535] hover:underline",
								children: "Pro"
							}),
							" ",
							"feature. Free creators get AI-generated cover art."
						]
					})
				] }),
				!isPro && !showWall && convexUser && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-[#71788B]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold text-white",
							children: generationCount
						}),
						" of",
						" ",
						FREE_GENERATION_LIMIT,
						" free podcasts used.",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/billing",
							className: "font-semibold text-[#f97535] hover:underline",
							children: "Upgrade to Pro"
						}),
						" ",
						"for unlimited generations."
					]
				}),
				showWall ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-xl border border-[#f97535]/30 bg-[#f97535]/8 p-5",
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
										"You've used all ",
										FREE_GENERATION_LIMIT,
										" free generations."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-[#71788B] mb-4",
									children: "Upgrade to Pro for unlimited podcast generations, custom thumbnail uploads, and the Pro creator badge."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/billing",
									className: "inline-flex items-center gap-2 rounded-md bg-[#f97535] px-[22px] py-[14px] text-base font-bold text-white transition-opacity hover:opacity-90",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { size: 16 }), "Upgrade to Pro"]
								})
							]
						})]
					})
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					disabled: !canPublish,
					onClick: handlePublish,
					className: "self-start flex items-center gap-2 rounded-md bg-[#f97535] px-[22px] py-[14px] text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed",
					children: [submitting && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						size: 16,
						className: "animate-spin"
					}), submitting ? "Creating…" : "Publish Podcast"]
				})
			]
		})]
	});
}
//#endregion
export { CreatePodcastPage as component };
