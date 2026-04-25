import { getAdminPageContext } from '@/lib/admin-page.server';
import { AdminSettingsForm } from '@/components/admin/admin-settings-form';
import { Settings2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPoliciesPage() {
  const { adminSettings } = await getAdminPageContext();
  if (!adminSettings) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Settings2 className="size-5 text-indigo-600" />
            Platform Configuration
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Manage global settings, branding, and third-party integrations.
          </p>
        </div>
      </div>

      <div className="grid gap-10">
        <AdminSettingsForm
          appName={adminSettings.creationSettings.appName}
          courseCreationMode={adminSettings.creationSettings.courseCreationMode}
          bunnyStorageZone={adminSettings.creationSettings.bunnyStorageZone}
          bunnyStorageAccessKey={adminSettings.creationSettings.bunnyStorageAccessKey}
          bunnyStorageCdnUrl={adminSettings.creationSettings.bunnyStorageCdnUrl}
          bunnyStorageRegion={adminSettings.creationSettings.bunnyStorageRegion}
          supportEmail={adminSettings.creationSettings.supportEmail}
          brandColor={adminSettings.creationSettings.brandColor}
          customHeadScripts={adminSettings.creationSettings.customHeadScripts}
          stripePublicKey={adminSettings.creationSettings.stripePublicKey}
          stripeSecretKey={adminSettings.creationSettings.stripeSecretKey}
          stripeWebhookSecret={adminSettings.creationSettings.stripeWebhookSecret}
        />
      </div>
    </div>
  );
}
