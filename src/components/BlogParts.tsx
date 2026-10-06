import { Link } from '@tanstack/react-router'
import { type Block, type BlogPost, readingMinutes } from '../content/blogPosts'
import { formatPostDate } from '../lib/blog'
import './blog.css'

export function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link to="/blog/$slug" params={{ slug: post.slug }} className="blog-card">
      <div className="blog-card-media">
        {post.imageUrl && <img src={post.imageUrl} alt="" loading="lazy" />}
      </div>
      <div className="blog-card-body">
        <div className="blog-card-meta">
          <span className="blog-tag">{post.category}</span>
          <span>{formatPostDate(post.publishedAt)}</span>
          <span>{readingMinutes(post)} min read</span>
        </div>
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
        <span className="blog-card-link">Read the post</span>
      </div>
    </Link>
  )
}

export function PostBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="post-body">
      {blocks.map((b, i) => {
        const key = `${b.t}-${i}`
        if (b.t === 'h2') return <h2 key={key}>{b.text}</h2>
        if (b.t === 'h3') return <h3 key={key}>{b.text}</h3>
        if (b.t === 'quote') return <blockquote key={key}>{b.text}</blockquote>
        if (b.t === 'ul') {
          return (
            <ul key={key}>
              {b.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )
        }
        return <p key={key}>{b.text}</p>
      })}
    </div>
  )
}
