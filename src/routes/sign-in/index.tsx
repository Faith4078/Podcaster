import { SignIn } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';
import AuthPageLayout from '../../components/AuthPageLayout';

export const Route = createFileRoute('/sign-in/')({
  component: SignInPage,
});

// Theming comes from the app-wide ClerkProvider `appearance`
// (src/integrations/clerk/provider.tsx) — don't override it here.
function SignInPage() {
  return (
    <AuthPageLayout>
      <SignIn />
    </AuthPageLayout>
  );
}
