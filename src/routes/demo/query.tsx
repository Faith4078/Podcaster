import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/demo/query')({
  component: QueryDemo,
})

type Episode = {
  id: number
  title: string
  duration: string
}

async function fetchEpisodes(): Promise<Episode[]> {
  await new Promise((r) => setTimeout(r, 300))
  return [
    { id: 1, title: 'Getting Started with TanStack', duration: '42:00' },
    { id: 2, title: 'Deep Dive into React Query', duration: '58:15' },
    { id: 3, title: 'Server Functions & SSR', duration: '37:45' },
  ]
}

function QueryDemo() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['episodes'],
    queryFn: fetchEpisodes,
  })

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rise-in rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <p className="island-kicker mb-3">TanStack Query Demo</p>
        <h1 className="display-title mb-5 text-3xl font-bold tracking-tight text-[var(--sea-ink)]">
          Episodes
        </h1>

        {isPending && <p className="text-[var(--sea-ink-soft)]">Loading…</p>}
        {isError && <p className="text-red-500">Failed to load episodes.</p>}
        {data && (
          <ul className="mt-4 space-y-3">
            {data.map((ep) => (
              <li
                key={ep.id}
                className="flex items-center justify-between rounded-xl border border-[rgba(50,143,151,0.2)] bg-white/50 px-5 py-3"
              >
                <span className="font-medium text-[var(--sea-ink)]">{ep.title}</span>
                <span className="text-sm text-[var(--sea-ink-soft)]">{ep.duration}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
