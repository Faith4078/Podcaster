import { httpRouter } from 'convex/server'
import { Webhook } from 'svix'
import { internal } from './_generated/api'
import { httpAction } from './_generated/server'
import { buildFeedXml } from './rss'

const http = httpRouter()

// ── Clerk Billing event names ────────────────────────────────────────────────
// ⚠️ MANUAL VERIFICATION REQUIRED. Clerk Billing is configured in the dashboard
// (enable Billing, create the `pro` plan + `custom_thumbnail` feature). The exact
// webhook event names depend on the Billing version enabled there. These are the
// most likely names per current Clerk docs; if the plan doesn't sync, confirm the
// real event names under Webhooks → Message attempts and adjust this set only.
const SUBSCRIPTION_EVENT_TYPES = new Set([
  'subscription.created',
  'subscription.updated',
  'subscription.active',
  'subscriptionItem.created',
  'subscriptionItem.updated',
  'subscriptionItem.active',
])

// The plan slug created in the Clerk dashboard. Mirrored onto the users doc as
// `plan: 'pro'` while an active Pro subscription exists, else `'free'`.
const PRO_PLAN_SLUG = 'pro'

// Pull the Clerk user id off a Billing subscription payload. Clerk has shipped a
// few payload shapes across Billing iterations, so we check the known locations.
function extractClerkUserId(data: any): string | undefined {
  return (
    data?.payer?.user_id ??
    data?.user_id ??
    data?.payer_id ??
    (data?.payer?.id?.startsWith?.('user_') ? data.payer.id : undefined)
  )
}

// Decide whether the payload represents an active Pro subscription. We look for
// the `pro` plan slug among the subscription items and an active-ish status.
function isActiveProSubscription(data: any): boolean {
  const status: string | undefined = data?.status
  const isActive =
    status === undefined || status === 'active' || status === 'trialing'
  if (!isActive) return false

  const items: any[] = data?.items ?? (data?.plan ? [{ plan: data.plan }] : [])
  const slugs = items
    .map((item) => item?.plan?.slug ?? item?.plan_slug ?? item?.slug)
    .filter(Boolean)
  // If we can't read item slugs, fall back to a top-level slug if present.
  if (slugs.length === 0) {
    const topSlug = data?.plan?.slug ?? data?.plan_slug
    return topSlug === PRO_PLAN_SLUG
  }
  return slugs.includes(PRO_PLAN_SLUG)
}

// Clerk webhook — syncs user create/update events into Convex
http.route({
  path: '/clerk-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhookSecret) {
      return new Response('Missing CLERK_WEBHOOK_SECRET', { status: 500 })
    }

    const svix_id = req.headers.get('svix-id')
    const svix_timestamp = req.headers.get('svix-timestamp')
    const svix_signature = req.headers.get('svix-signature')

    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Missing svix headers', { status: 400 })
    }

    const body = await req.text()
    const wh = new Webhook(webhookSecret)

    let event: any
    try {
      event = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch {
      return new Response('Invalid webhook signature', { status: 400 })
    }

    const { type, data } = event

    if (type === 'user.created' || type === 'user.updated') {
      const primaryEmail =
        data.email_addresses?.find((e: any) => e.id === data.primary_email_address_id)
          ?.email_address ?? ''

      await ctx.runMutation(internal.users.createOrUpdate, {
        clerkId: data.id,
        name: `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() || data.username || 'User',
        email: primaryEmail,
        imageUrl: data.image_url,
      })
    } else if (SUBSCRIPTION_EVENT_TYPES.has(type)) {
      // Clerk Billing subscription event → mirror the plan onto the users doc.
      // The Convex generation gate is authoritative and reads `plan` from there.
      const clerkUserId = extractClerkUserId(data)
      if (clerkUserId) {
        await ctx.runMutation(internal.users.setPlan, {
          clerkId: clerkUserId,
          plan: isActiveProSubscription(data) ? 'pro' : 'free',
        })
      }
    }

    return new Response(null, { status: 200 })
  }),
})

// ── RSS distribution ─────────────────────────────────────────────────────────

// Public podcast feed for one creator: GET /rss/<userId>.xml
http.route({
  pathPrefix: '/rss/',
  method: 'GET',
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url)
    const authorId = decodeURIComponent(url.pathname.slice('/rss/'.length)).replace(/\.xml$/, '')
    const data = await ctx.runQuery(internal.rss.feedData, { authorId })
    if (!data) return new Response('Feed not found', { status: 404 })

    const siteUrl = process.env.SITE_URL ?? url.origin
    const xml = buildFeedXml(
      {
        title: `${data.name}'s Podcasts`,
        description: `AI-generated podcast episodes by ${data.name}, made with Podcastr.`,
        author: data.name,
        email: data.email,
        imageUrl: data.imageUrl ?? data.episodes[0]?.imageUrl,
        link: siteUrl,
        feedUrl: url.href,
        episodes: data.episodes,
      },
      url.origin,
    )
    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    })
  }),
})

// Episode audio as referenced by the feed's <enclosure>: counts the download,
// then redirects to the stored file. GET /audio/<podcastId>.<ext>
http.route({
  pathPrefix: '/audio/',
  method: 'GET',
  handler: httpAction(async (ctx, req) => {
    const name = decodeURIComponent(new URL(req.url).pathname.slice('/audio/'.length))
    const podcastId = name.replace(/\.[a-z0-9]+$/i, '')
    const target = await ctx.runMutation(internal.rss.recordDownload, { podcastId })
    if (!target) return new Response('Episode not found', { status: 404 })
    return new Response(null, { status: 302, headers: { Location: target } })
  }),
})

export default http
