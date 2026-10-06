import { Check, Copy, ExternalLink, Rss } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

// The Convex HTTP router (convex/http.ts) serves feeds from the deployment's
// .convex.site origin, not the .convex.cloud one the client talks to.
const SITE_URL = (import.meta.env.VITE_CONVEX_SITE_URL as string | undefined)?.replace(/\/$/, '')

export function feedUrlFor(userId: string): string | null {
  return SITE_URL ? `${SITE_URL}/rss/${userId}.xml` : null
}

const DIRECTORIES = [
  { name: 'Apple Podcasts', href: 'https://podcastsconnect.apple.com/' },
  { name: 'Spotify', href: 'https://creators.spotify.com/' },
  { name: 'Pocket Casts', href: 'https://pocketcasts.com/submit/' },
]

// Shows the creator's public podcast feed — paste it into a podcast directory
// once and every new ready episode appears there automatically.
export default function RssFeedCard({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false)
  const url = feedUrlFor(userId)

  if (!url) {
    return (
      <p className="text-sm text-[#71788B]">
        RSS feed unavailable: set <code>VITE_CONVEX_SITE_URL</code> in your environment.
      </p>
    )
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url as string)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy — select the link and copy it manually.')
    }
  }

  return (
    <div className="rounded-xl bg-[#15171C] border border-[#252525] p-5">
      <div className="flex items-center gap-2 mb-1">
        <Rss size={16} className="text-[#f97535]" />
        <h3 className="text-base font-bold text-white">Your RSS feed</h3>
      </div>
      <p className="text-sm text-[#71788B] mb-4">
        Submit this link once to a podcast directory. Every episode you publish shows up there
        automatically, and feed downloads are counted in your analytics.
      </p>

      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          aria-label="RSS feed URL"
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-md bg-[#101114] px-3 py-2.5 text-xs text-white/80 border border-[#252525] outline-none focus:border-[#f97535]"
        />
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#f97535] px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 font-semibold text-[#f97535] hover:underline"
        >
          Preview feed <ExternalLink size={11} />
        </a>
        <span className="text-[#71788B]">Submit to:</span>
        {DIRECTORIES.map((d) => (
          <a
            key={d.name}
            href={d.href}
            target="_blank"
            rel="noreferrer"
            className="text-white/80 hover:text-[#f97535] transition-colors"
          >
            {d.name}
          </a>
        ))}
      </div>
    </div>
  )
}
