# Blog image prompts

One prompt per launch post. Give each to your image agent, then upload the result as the
post’s **Main image** in Sanity Studio (add a short alt text). The same prompt is stored on the
post in the **Image prompt** field.

Rendering notes: 16:9 landscape, photographic, no text or logos in the image.

## 1. From Idea to Episode: Making Your First Podcast With Podcaster

Slug: `from-idea-to-episode`

```text
Realistic editorial photograph of a person at a tidy wooden desk by a window in soft morning light, writing a few ideas in a notebook next to an open laptop and a mug of coffee, shallow depth of field, warm natural tones with a subtle orange accent from a desk lamp, candid and unposed, 16:9 landscape, no text, no logos, no watermark.
```

## 2. Why You Should Read Your AI Script Before You Press Generate

Slug: `read-your-script-before-you-generate`

```text
Realistic close up photograph of a pair of hands holding a printed script page with handwritten pencil corrections and underlines, a pair of over ear headphones and a pencil resting on the desk beside it, soft directional window light, shallow depth of field, calm focused mood, 16:9 landscape, no readable text, no logos, no watermark.
```

## 3. How to Get Your Podcast on Apple Podcasts and Spotify With One Link

Slug: `get-your-podcast-on-apple-and-spotify`

```text
Realistic photograph of a smartphone resting on a clean desk showing a generic podcast player screen with colorful abstract cover art, a pair of wireless earbuds and a small potted plant beside it, soft natural light, shallow depth of field, modern and inviting, 16:9 landscape, no brand logos, no readable text, no watermark.
```

## 4. Podcast Analytics for Beginners: The Five Numbers Worth Watching

Slug: `podcast-analytics-for-beginners`

```text
Realistic photograph over the shoulder of a creator reviewing a clean analytics dashboard with simple bar charts on a laptop screen, notebook and pen to the side, evening desk lamp glow with soft warm highlights, shallow depth of field, thoughtful and optimistic mood, 16:9 landscape, screen content abstract with no readable text, no logos, no watermark.
```

## 5. How to Choose an AI Voice That Fits Your Show

Slug: `choosing-an-ai-voice-for-your-show`

```text
Realistic photograph of a modern podcast microphone on a boom arm in a softly lit home studio with acoustic foam panels in warm neutral tones, a pair of headphones hanging on the arm, shallow depth of field, a gentle orange glow from a small lamp in the background, calm and professional, 16:9 landscape, no text, no logos, no watermark.
```

## 6. Write Topic Prompts That Make Better Episodes

Slug: `write-topic-prompts-that-make-better-episodes`

```text
Realistic overhead photograph of a desk with an open notebook showing a hand drawn mind map of connected ideas with no readable words, sticky notes in muted colors, a pen, and a cup of tea, soft daylight from the left, warm tones with a hint of orange, tidy and inspiring, 16:9 landscape, no readable text, no logos, no watermark.
```

## 7. Cover Art That Earns the Click: Designing a Thumbnail for Your Podcast

Slug: `cover-art-that-earns-the-click`

```text
Realistic photograph of a grid of several square podcast cover art prints with bold abstract colorful designs laid out on a light wooden table, a hand arranging one print, soft natural light from above, shallow depth of field, creative studio atmosphere with warm orange accents, 16:9 landscape, covers show abstract shapes only with no readable text, no logos, no watermark.
```

## Publishing the posts to Sanity

```bash
cd studio-podcaster
node scripts/build-seed.mjs
npx sanity login
npx sanity dataset import seed/posts.ndjson production --replace
```

Until the posts are imported, the site shows the same seven posts from `src/content/blogPosts.ts`.
Once Sanity has any published post, the site shows only what is in Sanity.
