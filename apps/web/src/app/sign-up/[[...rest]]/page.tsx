import { redirect } from 'next/navigation';
import { SignUp } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

export default async function SignUpPage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignUp
        appearance={{
          elements: { rootBox: 'mx-auto' },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/login"
      />
    </div>
  );
}
