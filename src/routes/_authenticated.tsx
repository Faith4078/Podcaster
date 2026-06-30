import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'

const checkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  return { userId }
})

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const { userId } = await checkAuth()
    if (!userId) throw redirect({ to: '/sign-in' })
  },
  component: () => <Outlet />,
})
