import { SignUp } from '@clerk/tanstack-react-start';
import { createFileRoute } from '@tanstack/react-router';
import AuthPageLayout from '../../components/AuthPageLayout';

export const Route = createFileRoute('/sign-up/')({
  component: SignUpPage,
});

// Theming comes from the app-wide ClerkProvider `appearance`
// (src/integrations/clerk/provider.tsx) — don't override it here.
function SignUpPage() {
  return (
    <AuthPageLayout>
      <SignUp />
    </AuthPageLayout>
  );
}
