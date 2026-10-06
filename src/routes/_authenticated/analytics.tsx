import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Bookmark, Download, Headphones, Mic, Plus, Rss } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { api } from '../../../convex/_generated/api'
import RssFeedCard from '../../components/RssFeedCard'

export const Route = createFileRoute('/_authenticated/analytics')({ component: AnalyticsPage })

const LISTENER_COLOR = '#f97535'
const RSS_COLOR = '#38bdf8'

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: number
  hint?: string
}) {
  return (
    <div className="rounded-xl bg-[#15171C] border border-[#252525] p-4">
      <div className="flex items-center gap-2 text-[#71788B] text-xs font-semibold mb-2">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      {hint && <p className="text-xs text-[#71788B] mt-1">{hint}</p>}
    </div>
  )
}

type Point = { date: string; listeners: number; rssDownloads: number }

// Grouped daily bars (listeners + RSS downloads). Plain divs: the data is tiny
// (<= 90 days x 2 series) so a charting library isn't worth the bundle weight.
function ActivityChart({ series }: { series: Point[] }) {
  const max = Math.max(1, ...series.flatMap((p) => [p.listeners, p.rssDownloads]))
  const empty = series.every((p) => p.listeners === 0 && p.rssDownloads === 0)

  return (
    <div>
      <div className="flex items-center gap-4 text-xs text-[#71788B] mb-3">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: LISTENER_COLOR }} />
          New listeners
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: RSS_COLOR }} />
          RSS downloads
        </span>
      </div>

      <div
        className="flex h-40 items-end gap-[3px]"
        role="img"
        aria-label={`Daily new listeners and RSS downloads over the last ${series.length} days`}
      >
        {series.map((p) => (
          <div
            key={p.date}
            className="flex h-full min-w-0 flex-1 items-end justify-center gap-px"
            title={`${p.date}: ${p.listeners} new listeners, ${p.rssDownloads} RSS downloads`}
          >
            <div
              className="w-1/2 rounded-t-[2px]"
              style={{
                height: `${(p.listeners / max) * 100}%`,
                minHeight: p.listeners ? 2 : 0,
                background: LISTENER_COLOR,
              }}
            />
            <div
              className="w-1/2 rounded-t-[2px]"
              style={{
                height: `${(p.rssDownloads / max) * 100}%`,
                minHeight: p.rssDownloads ? 2 : 0,
                background: RSS_COLOR,
              }}
            />
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] text-[#71788B]">
        <span>{series[0]?.date}</span>
        <span>{series[series.length - 1]?.date}</span>
      </div>
      {empty && (
        <p className="mt-3 text-sm text-[#71788B]">
          No activity in this period yet — share your episodes or submit your RSS feed to get started.
        </p>
      )}
    </div>
  )
}

// Current UTC day (YYYY-MM-DD), kept fresh: it ticks over at UTC midnight and when
// the tab becomes visible again, so the page's date windows roll forward without
// a manual refresh. Passing it to the query is what makes the query re-run.
function useUtcDay() {
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10))
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const sync = () => {
      setDay(new Date().toISOString().slice(0, 10))
      const now = Date.now()
      const nextMidnight = Math.floor(now / 86_400_000 + 1) * 86_400_000
      clearTimeout(timer)
      timer = setTimeout(sync, nextMidnight - now + 1000)
    }
    sync()
    const onVisible = () => document.visibilityState === 'visible' && sync()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return day
}

function AnalyticsPage() {
  const today = useUtcDay()
  const data = useQuery(api.analytics.myOverview, { days: 30, today })

  if (data === undefined) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f97535] border-t-transparent" />
      </div>
    )
  }

  if (data === null) {
    return (
      <div className="px-4 py-8 sm:px-8 text-[#71788B] text-sm">
        We couldn't load your analytics yet — your account is still being set up. Refresh in a moment.
      </div>
    )
  }

  const { totals, series, episodes } = data

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-5xl">
      <h1 className="text-xl font-bold text-white mb-1">Creator Analytics</h1>
      <p className="text-[#71788B] text-sm mb-8">How your episodes are performing.</p>

      {totals.episodes === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#252525] bg-[#15171C] py-16 text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
            <Mic size={28} className="text-[#71788B]" />
          </div>
          <p className="text-white text-base font-bold mb-1">No published episodes yet</p>
          <p className="text-[#71788B] text-sm mb-5">Analytics appear once an episode is ready.</p>
          <Link
            to="/create-podcast"
            className="flex items-center gap-2 rounded-md bg-[#f97535] px-[22px] py-[14px] text-base font-bold text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            Create a podcast
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mb-8">
            <StatCard
              icon={<Headphones size={14} />}
              label="Unique listeners"
              value={totals.listeners}
              hint={`${totals.listenersInRange.toLocaleString()} in the last ${data.days} days`}
            />
            <StatCard
              icon={<Rss size={14} />}
              label="RSS downloads"
              value={totals.rssDownloads}
              hint={`${totals.rssDownloadsInRange.toLocaleString()} in the last ${data.days} days`}
            />
            <StatCard icon={<Bookmark size={14} />} label="Saves" value={totals.bookmarks} />
            <StatCard icon={<Download size={14} />} label="App downloads" value={totals.appDownloads} />
          </div>

          <section className="rounded-xl bg-[#15171C] border border-[#252525] p-5 mb-8">
            <h2 className="text-base font-bold text-white mb-4">Last {data.days} days</h2>
            <ActivityChart series={series} />
          </section>

          <section className="mb-8">
            <h2 className="text-base font-bold text-white mb-4">Episodes</h2>
            <div className="overflow-x-auto rounded-xl border border-[#252525] bg-[#15171C]">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#252525] text-xs text-[#71788B]">
                    <th className="px-4 py-3 font-semibold">Episode</th>
                    <th className="px-3 py-3 text-right font-semibold">Listeners</th>
                    <th className="px-3 py-3 text-right font-semibold">Last 7d</th>
                    <th className="px-3 py-3 text-right font-semibold">RSS</th>
                    <th className="px-3 py-3 text-right font-semibold">Saves</th>
                    <th className="px-4 py-3 text-right font-semibold">Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {episodes.map((e) => (
                    <tr key={e.id} className="border-b border-[#252525] last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          to="/podcast/$id"
                          params={{ id: e.id }}
                          className="font-bold text-white hover:text-[#f97535] transition-colors"
                        >
                          {e.title}
                        </Link>
                        <p className="text-xs text-[#71788B]">
                          {e.category} · {new Date(e.publishedAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right text-white">{e.listeners.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-white">
                        {e.listenersLast7Days.toLocaleString()}
                      </td>
                      <td className="px-3 py-3 text-right text-white">{e.rssDownloads.toLocaleString()}</td>
                      <td className="px-3 py-3 text-right text-white">{e.bookmarks.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-white">{e.appDownloads.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-[#71788B]">
              Listeners are signed-in users who played an episode for 30+ seconds. RSS counts audio
              fetches by podcast apps (an app may fetch more than once per listen).
            </p>
          </section>
        </>
      )}

      <section>
        <h2 className="text-base font-bold text-white mb-4">Distribution</h2>
        <RssFeedCard userId={data.userId} />
      </section>
    </div>
  )
}
