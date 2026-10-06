import { createFileRoute } from '@tanstack/react-router'
import { PostCard } from '../../components/BlogParts'
import { SiteFooter, SiteHeader } from '../../components/SiteChrome'
import { fetchPosts } from '../../lib/blog'

export const Route = createFileRoute('/blog/')({
  loader: () => fetchPosts(),
  head: () => ({
    meta: [
      { title: 'Blog | Podcaster' },
      {
        name: 'description',
        content:
          'Practical guides on making, publishing and growing a podcast with AI voices, from first idea to RSS distribution.',
      },
    ],
  }),
  component: BlogIndex,
})

function BlogIndex() {
  const posts = Route.useLoaderData()
  return (
    <div className="landing-page">
      <SiteHeader />
      <main className="landing-container blog-main">
        <p className="blog-kicker">The Podcaster blog</p>
        <h1 className="blog-title">Make something worth hearing</h1>
        <p className="blog-lede">
          Practical guides on writing, voicing, publishing and growing a podcast, from your first
          idea to your first thousand listeners.
        </p>
        {posts.length === 0 ? (
          <p className="blog-empty">No posts yet. Check back soon.</p>
        ) : (
          <div className="blog-grid">
            {posts.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
