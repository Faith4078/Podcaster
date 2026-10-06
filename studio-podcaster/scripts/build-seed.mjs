// Builds seed/posts.ndjson from the app's launch posts so they can be imported
// into Sanity in one command:
//
//   node scripts/build-seed.mjs
//   npx sanity dataset import seed/posts.ndjson production --replace
//
// The content lives in ../src/content/blogPosts.ts (the app's fallback copy), so
// the site and Sanity always start from the same text. Needs Node 22.18+ (runs
// TypeScript directly). Re-running with --replace updates the same documents.
import {writeFileSync} from 'node:fs'
import {blogPosts} from '../../src/content/blogPosts.ts'

let keyCounter = 0
const key = () => `k${(keyCounter++).toString(36).padStart(4, '0')}`

function block(text, style = 'normal', listItem) {
  return {
    _type: 'block',
    _key: key(),
    style,
    ...(listItem ? {listItem, level: 1} : {}),
    markDefs: [],
    children: [{_type: 'span', _key: key(), text, marks: []}],
  }
}

function toPortableText(body) {
  return body.flatMap((b) => {
    if (b.t === 'ul') return b.items.map((item) => block(item, 'normal', 'bullet'))
    if (b.t === 'quote') return [block(b.text, 'blockquote')]
    return [block(b.text, b.t)]
  })
}

const lines = blogPosts.map((p) =>
  JSON.stringify({
    _id: `post-${p.slug}`,
    _type: 'post',
    title: p.title,
    slug: {_type: 'slug', current: p.slug},
    excerpt: p.excerpt,
    category: p.category,
    publishedAt: new Date(`${p.publishedAt}T09:00:00Z`).toISOString(),
    imagePrompt: p.imagePrompt,
    body: toPortableText(p.body),
  }),
)

writeFileSync(new URL('../seed/posts.ndjson', import.meta.url), `${lines.join('\n')}\n`)
console.log(`Wrote ${lines.length} posts to seed/posts.ndjson`)
