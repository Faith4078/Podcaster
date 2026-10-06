import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { PostBody, PostCard } from '../../components/BlogParts'
import { SiteFooter, SiteHeader } from '../../components/SiteChrome'
import { readingMinutes } from '../../content/blogPosts'
import { fetchPost, fetchPosts, formatPostDate } from '../../lib/blog'

export const Route = createFileRoute('/blog/$slug')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.slug)
    if (!post) throw notFound()
    const others = (await fetchPosts()).filter((p) => p.slug !== post.slug).slice(0, 3)
    return { post, others }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.post.title} | Podcaster` },
          { name: 'description', content: loaderData.post.excerpt },
        ]
      : [],
  }),
  notFoundComponent: PostNotFound,
  component: BlogPostPage,
})

function PostNotFound() {
  return (
    <div className="landing-page">
      <SiteHeader />
      <main className="post-wrap blog-main">
        <h1 className="post-title">That post could not be found</h1>
        <Link to="/blog" className="post-back">
          Back to the blog
        </Link>
      </main>
      <SiteFooter />
    </div>
  )
}

function BlogPostPage() {
  const { post, others } = Route.useLoaderData()
  return (
    <div className="landing-page">
      <SiteHeader />
      <main className="blog-main">
        <article className="post-wrap">
          <Link to="/blog" className="post-back">
            Back to the blog
          </Link>
          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            <span className="blog-tag">{post.category}</span>
            <span>{formatPostDate(post.publishedAt)}</span>
            <span>{readingMinutes(post)} min read</span>
          </div>
          <div className="post-hero">
            {post.imageUrl && <img src={post.imageUrl} alt={post.title} />}
          </div>
          <PostBody blocks={post.body} />

          <aside className="post-cta">
            <h2>Ready to make your first episode?</h2>
            <p>Write an idea, review the script, and publish it to your own podcast feed.</p>
            <Link to="/sign-up" className="landing-button landing-button-primary">
              Start creating
            </Link>
          </aside>
        </article>

        {others.length > 0 && (
          <section className="landing-container post-more">
            <h2>More from the blog</h2>
            <div className="blog-grid">
              {others.map((p) => (
                <PostCard key={p.slug} post={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}
