import { type Block, type BlogPost, blogPosts, getLocalPost } from '../content/blogPosts'

// Same project the Studio in studio-podcaster/ publishes to.
const SANITY_PROJECT_ID = 'swpqcqjc'
const SANITY_DATASET = 'production'
const SANITY_API_VERSION = '2025-02-19'

const POST_FIELDS = `
  title,
  "slug": slug.current,
  excerpt,
  category,
  publishedAt,
  imagePrompt,
  "imageUrl": mainImage.asset->url,
  body
`

type SanitySpan = { text?: string }
type SanityBlock = {
  _type: string
  style?: string
  listItem?: string
  children?: SanitySpan[]
}
type SanityPost = Omit<BlogPost, 'body' | 'publishedAt'> & {
  publishedAt: string
  body?: SanityBlock[]
  imageUrl?: string | null
}

// Run a GROQ query against Sanity's public CDN. The dataset must allow public
// reads (the default). Returns null on any failure so callers can fall back.
async function sanityQuery<T>(query: string, params: Record<string, string> = {}) {
  const url = new URL(
    `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`,
  )
  url.searchParams.set('query', query)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(`$${k}`, JSON.stringify(v))
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return ((await res.json()) as { result: T }).result
  } catch {
    return null
  }
}

// Sanity portable text -> the simple Block[] the renderer understands. Bullet
// items that sit next to each other are grouped into one list.
function toBlocks(body: SanityBlock[] = []): Block[] {
  const out: Block[] = []
  for (const b of body) {
    if (b._type !== 'block') continue
    const text = (b.children ?? []).map((c) => c.text ?? '').join('')
    if (!text.trim()) continue
    if (b.listItem) {
      const last = out[out.length - 1]
      if (last?.t === 'ul') last.items.push(text)
      else out.push({ t: 'ul', items: [text] })
    } else if (b.style === 'h2' || b.style === 'h3') {
      out.push({ t: b.style, text })
    } else if (b.style === 'blockquote') {
      out.push({ t: 'quote', text })
    } else {
      out.push({ t: 'p', text })
    }
  }
  return out
}

function fromSanity(p: SanityPost): BlogPost {
  return {
    ...p,
    category: p.category ?? 'Podcaster',
    imageUrl: p.imageUrl ?? undefined,
    body: toBlocks(p.body),
  }
}

// All posts, newest first. Uses Sanity when it has published posts, otherwise
// the built in launch posts, so the blog is never empty.
export async function fetchPosts(): Promise<BlogPost[]> {
  const rows = await sanityQuery<SanityPost[]>(
    `*[_type == "post" && defined(slug.current)] | order(publishedAt desc){${POST_FIELDS}}`,
  )
  if (rows && rows.length > 0) return rows.map(fromSanity)
  return [...blogPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export async function fetchPost(slug: string): Promise<BlogPost | null> {
  const rows = await sanityQuery<SanityPost[]>(
    `*[_type == "post" && slug.current == $slug][0...1]{${POST_FIELDS}}`,
    { slug },
  )
  if (rows && rows.length > 0) return fromSanity(rows[0])
  // Sanity answered but has no such post, or has no posts at all: only use the
  // built in copy if Sanity has nothing published, so deleted posts stay gone.
  const all = await sanityQuery<{ n: number }>(`{"n": count(*[_type == "post"])}`)
  if (all && all.n > 0) return null
  return getLocalPost(slug) ?? null
}

export function formatPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
