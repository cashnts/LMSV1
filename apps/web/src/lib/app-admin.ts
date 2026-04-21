import type { User } from '@clerk/nextjs/server';

function parseCsv(value: string | undefined) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

function configuredAdminIds() {
  return parseCsv(process.env.APP_ADMIN_USER_IDS);
}

function configuredAdminEmails() {
  return parseCsv(process.env.APP_ADMIN_EMAILS);
}

export function isConfiguredAppAdmin(user: Pick<User, 'id' | 'emailAddresses'> | null | undefined) {
  if (!user) return false;

  const adminIds = configuredAdminIds();
  if (adminIds.has(user.id.toLowerCase())) return true;

  const adminEmails = configuredAdminEmails();
  return user.emailAddresses.some((email) => adminEmails.has(email.emailAddress.toLowerCase()));
}

export function getAppAdminConfigSummary() {
  const adminIds = configuredAdminIds();
  const adminEmails = configuredAdminEmails();

  return {
    hasAdminsConfigured: adminIds.size > 0 || adminEmails.size > 0,
    adminIds: [...adminIds],
    adminEmails: [...adminEmails],
  };
}
