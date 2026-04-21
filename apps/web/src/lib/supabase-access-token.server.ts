import { auth } from '@clerk/nextjs/server';
import { CLERK_SUPABASE_JWT_TEMPLATE } from '@/lib/auth.constants';

export async function getSupabaseAccessTokenFromSession() {
  const { getToken } = await auth();

  try {
    return await getToken({ template: CLERK_SUPABASE_JWT_TEMPLATE });
  } catch (error) {
    if (isMissingClerkTemplate(error)) {
      console.warn(
        `Clerk JWT template "${CLERK_SUPABASE_JWT_TEMPLATE}" was not found. Returning no Supabase access token.`,
      );
      return null;
    }

    throw error;
  }
}

function isMissingClerkTemplate(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as {
    clerkError?: unknown;
    code?: unknown;
    status?: unknown;
    errors?: Array<{ code?: unknown; message?: unknown; long_message?: unknown }>;
  };

  if (candidate.clerkError !== true || candidate.code !== 'api_response_error' || candidate.status !== 404) {
    return false;
  }

  return (candidate.errors ?? []).some((entry) => {
    if (!entry || typeof entry !== 'object') return false;

    return [entry.code, entry.message, entry.long_message].some((value) =>
      typeof value === 'string' && value.toLowerCase().includes('template'),
    );
  });
}
