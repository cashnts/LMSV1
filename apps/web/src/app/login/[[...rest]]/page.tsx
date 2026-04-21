import { redirect } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

export default async function LoginPage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <SignIn
        appearance={{
          elements: { rootBox: 'mx-auto' },
        }}
        routing="path"
        path="/login"
        signUpUrl="/sign-up"
      />
    </div>
  );
}
