# Podcastr — LinkedIn Post(s)

Employer-facing narrative for the project. Leads with a concrete engineering
decision (signals depth), shows product breadth, ends with honest trade-off
thinking (signals seniority).

---

## Main post (copy-paste ready)

**I built an AI podcast platform — and the most interesting bug taught me why "search" is really two problems, not one.**

Meet **Podcastr**: you describe a topic, and it generates a full podcast — script, voices, audio, and cover art — then makes it discoverable. Built solo, end to end.

The stack:
→ **TanStack Start (React 19)** for a server-rendered frontend
→ **Convex** as a reactive backend — the UI updates itself the instant a podcast finishes generating, no polling, no manual websockets
→ **Google Gemini** for transcript generation, text-to-speech, embeddings, and thumbnails
→ **Clerk** for auth + billing (Free vs Pro tiers, server-enforced quotas)
→ Deployed on **Vercel** (SSR)

But here's the part I'm proud of. 👇

Search had a subtle bug: *"podcast about the trajectory of SaaS apps"* returned my SaaS episodes… and a plane-crash episode. Why? Because good search is **two** systems fighting for the same slot:

🔹 **Keyword search** (fast, literal) — matched "trajectory" in a plane's flight path.
🔹 **Semantic search** (AI embeddings, meaning-based) — correctly understood I wanted SaaS.

I was naively stapling the two result lists together, so literal coincidences leaked to the top. The fix: **Reciprocal Rank Fusion (RRF)** — score every result by its *rank* in each list and sum them, so results BOTH methods agree on rise, and one-off coincidences sink. One elegant formula, and search suddenly felt intelligent.

I also shipped: a background AI generation pipeline (with graceful fallbacks when a model is rate-limited), unique-listener counting, bookmark folders, token-bucket rate limiting on the AI endpoints, and **57 passing tests** across the backend.

The lesson I keep coming back to: **the interesting engineering isn't making it work once — it's understanding *why* it behaves the way it does, and choosing the principled fix over the quick one.**

Building in public. If your team is doing hard things with AI + product, I'd love to talk. 🚀

#SoftwareEngineering #AI #FullStack #React #BuildInPublic

---

## Why this works on employers
1. Opens with a story, not a feature list.
2. Proves systems thinking with the RRF decision.
3. Name-drops real, current tech.
4. Quantifies rigor ("57 passing tests").
5. Ends with senior-signal humility + a soft "I'm available."

---

## Variants to generate on request
- **Short/punchy** version for higher engagement.
- **Technical deep-dive thread** (5–7 tweets/slides) on the hybrid-search story.
- **Recruiter-friendly** version that leads with impact and stack.
- Role-tailored (frontend / full-stack / AI engineer).
