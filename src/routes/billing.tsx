import { PricingTable, useUser } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from 'convex/react'
import { Crown, Sparkles } from 'lucide-react'
import { api } from '../../convex/_generated/api'

export const Route = createFileRoute('/billing')({ component: BillingPage })

function BillingPage() {
  const { user } = useUser()
  const convexUser = useQuery(api.users.getByClerkId, user ? { clerkId: user.id } : 'skip')
  const isPro = convexUser?.plan === 'pro'

  return (
    <div className="px-4 py-6 sm:px-6 md:px-8 md:py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-xl font-bold text-white">Plans &amp; Billing</h1>
          {isPro && (
            <span className="flex items-center gap-1 rounded-full bg-[#f97535]/15 px-2.5 py-0.5 text-xs font-semibold text-[#f97535]">
              <Crown size={12} />
              Pro
            </span>
          )}
        </div>
        <p className="text-[#71788B] text-sm">
          Free includes 3 podcast generations. Upgrade to Pro for more podcast generations, custom
          thumbnail uploads, and the Pro creator badge.
        </p>
      </div>

      {/* Clerk-hosted pricing + checkout. Manage / cancel a subscription is also
          surfaced here (and in the Clerk <UserButton /> account portal). */}
      <div className="rounded-xl border border-[#252525] bg-[#15171C] p-3 sm:p-6">
        <PricingTable />
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#252525] bg-[#15171C] px-4 py-3 text-sm text-[#71788B]">
        <Sparkles size={16} className="mt-0.5 shrink-0 text-[#f97535]" />
        <p>
          Manage or cancel your subscription anytime from the pricing card above or your account
          settings. Cancelling keeps existing podcasts intact; the free generation limit simply
          re-applies.
        </p>
      </div>
    </div>
  )
}
