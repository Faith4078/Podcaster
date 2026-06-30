import { useAuth, useUser } from '@clerk/tanstack-react-start'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { BarChart3, Crown, Mic, MoreHorizontal, Plus, TrendingUp } from 'lucide-react'
import { api } from '../../../convex/_generated/api'

export const Route = createFileRoute('/_authenticated/my-profile')({ component: MyProfilePage })

function GradientBox({ from, to, className }: { from: string; to: string; className?: string }) {
  return (
    <div className={className} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} />
  )
}

const PLACEHOLDER_GRADIENT_PAIRS = [
  ['#1e3a5f', '#2563eb'],
  ['#3b0764', '#7c3aed'],
  ['#064e3b', '#059669'],
  ['#78350f', '#d97706'],
  ['#7c2d12', '#f97535'],
  ['#831843', '#db2777'],
]

function MyProfilePage() {
  const { user } = useUser()
  const { has } = useAuth()

  const convexUser = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : 'skip')
  // Live plan check — the badge disappears automatically on downgrade. Falls back
  // to the webhook-synced users doc when the session claim isn't loaded yet.
  const isPro = has?.({ plan: 'pro' }) === true || convexUser?.plan === 'pro'
  const myPodcasts = useQuery(
    api.podcasts.getByAuthor,
    convexUser ? { authorId: convexUser._id } : 'skip'
  )
  const topPodcasters = useQuery(api.users.getTopPodcasters, { limit: 5 })

  const displayName = user?.fullName ?? user?.username ?? 'Anonymous'
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently joined'
  const totalListeners = myPodcasts?.reduce((sum, p) => sum + p.listenerCount, 0) ?? 0

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Main content */}
      <div className="flex-1 min-w-0 px-4 py-6 sm:px-6 md:px-8 md:py-8">
        {/* Profile header */}
        <div className="flex items-start gap-6 mb-10">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={displayName}
              className="w-20 h-20 rounded-full shrink-0 object-cover"
            />
          ) : (
            <GradientBox from="#f59e0b" to="#f97535" className="w-20 h-20 rounded-full shrink-0" />
          )}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:gap-3">
              <h1 className="text-xl font-bold text-white">{displayName}</h1>
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                <span className="rounded-full bg-[#f97535]/15 px-3 py-0.5 text-xs font-semibold text-[#f97535]">
                  Podcaster
                </span>
                {isPro && (
                  <span className="flex items-center gap-1 rounded-full bg-[#f97535] px-3 py-0.5 text-xs font-semibold text-white">
                    <Crown size={12} />
                    Pro
                  </span>
                )}
              </div>
            </div>
            <p className="text-[#71788B] text-sm mb-3">Member since {memberSince}</p>
            <div className="flex items-center gap-2 text-sm text-[#71788B]">
              <BarChart3 size={15} className="text-[#f97535]" />
              <span>
                <span className="text-white font-bold">{totalListeners.toLocaleString()}</span>{' '}
                total listeners
              </span>
            </div>
          </div>
        </div>

        {/* My Podcasts */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">My Podcasts</h2>
              <span className="rounded-full bg-[#f97535]/15 px-2.5 py-0.5 text-xs font-semibold text-[#f97535]">
                {myPodcasts?.length ?? 0}
              </span>
            </div>
            <Link
              to="/create-podcast"
              className="flex items-center gap-1.5 text-base font-semibold text-[#fff] hover:text-[#f97535]/80 transition-colors"
            >
              <Plus size={14} />
              New Podcast
            </Link>
          </div>

          {myPodcasts === undefined ? (
            // Loading skeleton
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-xl bg-[#15171C] border border-[#252525] p-4 animate-pulse"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-14 h-14 rounded-[3px] bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                      <div className="h-3 w-1/2 rounded bg-white/10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : myPodcasts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#252525] bg-[#15171C] py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/5 mb-4">
                <Mic size={28} className="text-[#71788B]" />
              </div>
              <p className="text-white text-base font-bold mb-1">No podcasts yet</p>
              <p className="text-[#71788B] text-sm mb-5">Create your first one and start sharing</p>
              <Link
                to="/create-podcast"
                className="flex items-center gap-2 rounded-md bg-[#f97535] px-[22px] py-[14px] text-base font-bold text-white hover:opacity-90 transition-opacity"
              >
                <Plus size={15} />
                Create your first podcast
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {myPodcasts.map((p, idx) => {
                const [from, to] =
                  PLACEHOLDER_GRADIENT_PAIRS[idx % PLACEHOLDER_GRADIENT_PAIRS.length]
                return (
                  <Link
                    key={p._id}
                    to="/podcast/$id"
                    params={{ id: p._id }}
                    className="rounded-xl bg-[#15171C] border border-[#252525] hover:border-[#f97535]/30 transition-colors cursor-pointer group p-4 block"
                  >
                    <div className="flex items-start gap-3">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={p.title}
                          className="w-14 h-14 rounded-[3px] shrink-0 object-cover"
                        />
                      ) : (
                        <GradientBox
                          from={from}
                          to={to}
                          className="w-14 h-14 rounded-[3px] shrink-0 transition-transform group-hover:scale-[1.03]"
                        />
                      )}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-white text-base font-bold truncate leading-snug mb-1.5">
                          {p.title}
                        </p>
                        <span className="flex items-center gap-1.5 text-xs text-[#71788B] mb-1">
                          <BarChart3 size={11} />
                          {p.listenerCount.toLocaleString()}
                        </span>
                        <span className="inline-block rounded-full bg-[#f97535]/10 px-2 py-0.5 text-[10px] font-semibold text-[#f97535]">
                          {p.status}
                        </span>
                      </div>
                      <MoreHorizontal
                        size={16}
                        className="shrink-0 text-[#71788B] opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Right sidebar — stacks below content on < lg, beside it on lg+ */}
      <aside className="w-full shrink-0 border-t border-[#252525] px-4 py-6 sm:px-6 bg-[#15171C] lg:w-[349px] lg:border-l lg:border-t-0 lg:py-8 lg:overflow-y-auto">
        {/* Top Podcasters */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Top Podcasters</h3>
          </div>
          <div className="flex flex-col gap-6">
            {topPodcasters === undefined
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-2/3 rounded bg-white/10" />
                      <div className="h-3 w-1/3 rounded bg-white/10" />
                    </div>
                  </div>
                ))
              : topPodcasters.map(({ user: u, count }, idx) => {
                  const [from, to] =
                    PLACEHOLDER_GRADIENT_PAIRS[idx % PLACEHOLDER_GRADIENT_PAIRS.length]
                  const isMe = u && convexUser && (u as any)._id === convexUser._id
                  return (
                    <div
                      key={(u as any)?._id ?? idx}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      {(u as any)?.imageUrl ? (
                        <img
                          src={(u as any).imageUrl}
                          alt={(u as any).name}
                          className="w-10 h-10 rounded-full shrink-0 object-cover"
                        />
                      ) : (
                        <GradientBox
                          from={from}
                          to={to}
                          className="w-10 h-10 rounded-full shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-base font-bold truncate transition-colors ${isMe ? 'text-[#f97535]' : 'text-white group-hover:text-[#f97535]'}`}
                        >
                          {(u as any)?.name ?? 'Unknown'}
                          {isMe && (
                            <span className="ml-1.5 text-xs font-normal text-[#f97535]/70">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-[#71788B] text-sm mt-0.5">{count} Podcasts</p>
                      </div>
                    </div>
                  )
                })}
          </div>
        </section>

        {/* Listeners This Month */}
        <section>
          <h3 className="text-base font-bold text-white mb-4">Total Listeners</h3>
          <div className="rounded-xl bg-[#101114] border border-[#252525] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0"
                style={{ background: 'linear-gradient(135deg, #064e3b, #059669)' }}
              >
                <TrendingUp size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white text-base font-bold">{totalListeners.toLocaleString()}</p>
                <p className="text-[#71788B] text-sm">all time</p>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>
  )
}
