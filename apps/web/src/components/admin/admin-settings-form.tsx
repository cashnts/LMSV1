'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import type { CourseCreationMode, OrganizationCreationMode } from '@/lib/admin-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  appName: string;
  organizationCreationMode: OrganizationCreationMode;
  courseCreationMode: CourseCreationMode;
  bunnyStorageZone: string;
  bunnyStorageAccessKey: string;
  bunnyStorageCdnUrl: string;
  bunnyStorageRegion: string;
  supportEmail: string;
  brandColor: string;
  customHeadScripts: string;
  stripePublicKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
};

export function AdminSettingsForm({
  appName,
  organizationCreationMode,
  courseCreationMode,
  bunnyStorageZone,
  bunnyStorageAccessKey,
  bunnyStorageCdnUrl,
  bunnyStorageRegion,
  supportEmail,
  brandColor,
  customHeadScripts,
  stripePublicKey,
  stripeSecretKey,
  stripeWebhookSecret,
}: Props) {
  const router = useRouter();
  const { getAccessToken } = useSupabaseAccessToken();
  const [appNameState, setAppNameState] = useState(appName);
  const [orgMode, setOrgMode] = useState<OrganizationCreationMode>(organizationCreationMode);
  const [courseMode, setCourseMode] = useState<CourseCreationMode>(courseCreationMode);
  const [bunnyZone, setBunnyZone] = useState(bunnyStorageZone);
  const [bunnyKey, setBunnyKey] = useState(bunnyStorageAccessKey);
  const [bunnyCdn, setBunnyCdn] = useState(bunnyStorageCdnUrl);
  const [bunnyRegion, setBunnyRegion] = useState(bunnyStorageRegion);
  const [supportEmailState, setSupportEmailState] = useState(supportEmail);
  const [brandColorState, setBrandColorState] = useState(brandColor);
  const [customScripts, setCustomScripts] = useState(customHeadScripts);
  const [stripePublic, setStripePublic] = useState(stripePublicKey);
  const [stripeSecret, setStripeSecret] = useState(stripeSecretKey);
  const [stripeWebhook, setStripeWebhook] = useState(stripeWebhookSecret);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const accessToken = await getAccessToken();
    if (!accessToken) {
      setError('Missing Supabase JWT.');
      setLoading(false);
      return;
    }

    try {
      await apiFetch('/admin/settings', accessToken, {
        method: 'PATCH',
        body: JSON.stringify({
          appName: appNameState,
          organizationCreationMode: orgMode,
          courseCreationMode: courseMode,
          bunnyStorageZone: bunnyZone,
          bunnyStorageAccessKey: bunnyKey,
          bunnyStorageCdnUrl: bunnyCdn,
          bunnyStorageRegion: bunnyRegion,
          supportEmail: supportEmailState,
          brandColor: brandColorState,
          customHeadScripts: customScripts,
          stripePublicKey: stripePublic,
          stripeSecretKey: stripeSecret,
          stripeWebhookSecret: stripeWebhook,
        }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save admin settings');
    }

    setLoading(false);
  }

  return (
    <Card className="rounded-[2rem] border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <CardHeader className="px-8 pt-8 pb-4">
        <CardTitle className="text-2xl font-bold">Global Settings</CardTitle>
        <CardDescription>Configure application-wide parameters and infrastructure integrations.</CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={onSubmit} className="space-y-10">
          {/* General Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">General</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="app-name">Application Name</Label>
                <Input
                  id="app-name"
                  value={appNameState}
                  onChange={(e) => setAppNameState(e.target.value)}
                  placeholder="e.g. Acme Academy"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={supportEmailState}
                  onChange={(e) => setSupportEmailState(e.target.value)}
                  placeholder="support@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand-color">Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="brand-color"
                    type="color"
                    value={brandColorState}
                    onChange={(e) => setBrandColorState(e.target.value)}
                    className="w-12 h-11 p-1"
                  />
                  <Input
                    value={brandColorState}
                    onChange={(e) => setBrandColorState(e.target.value)}
                    placeholder="#4f46e5"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Permissions</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-mode">Organization Creation</Label>
                <select
                  id="org-mode"
                  value={orgMode}
                  onChange={(e) => setOrgMode(e.target.value as OrganizationCreationMode)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="app_admin">Restricted to Admins</option>
                  <option value="authenticated">Open to all users</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-mode">Course Creation</Label>
                <select
                  id="course-mode"
                  value={courseMode}
                  onChange={(e) => setCourseMode(e.target.value as CourseCreationMode)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="app_admin">Restricted to Admins</option>
                  <option value="org_staff">Organization Staff</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bunny.net Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Bunny.net Storage</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bunny-zone">Storage Zone Name</Label>
                <Input
                  id="bunny-zone"
                  value={bunnyZone}
                  onChange={(e) => setBunnyZone(e.target.value)}
                  placeholder="e.g. my-lms-assets"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bunny-region">Storage Region</Label>
                <select
                  id="bunny-region"
                  value={bunnyRegion}
                  onChange={(e) => setBunnyRegion(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="ny">New York (ny)</option>
                  <option value="la">Los Angeles (la)</option>
                  <option value="sg">Singapore (sg)</option>
                  <option value="se">Stockholm (se)</option>
                  <option value="uk">London (uk)</option>
                  <option value="de">Frankfurt (de)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bunny-key">Access Key (Password)</Label>
                <Input
                  id="bunny-key"
                  type="password"
                  value={bunnyKey}
                  onChange={(e) => setBunnyKey(e.target.value)}
                  placeholder="FTP/API Password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bunny-cdn">Pull Zone URL</Label>
                <Input
                  id="bunny-cdn"
                  value={bunnyCdn}
                  onChange={(e) => setBunnyCdn(e.target.value)}
                  placeholder="https://myzone.b-cdn.net"
                />
              </div>
            </div>
          </div>

          {/* Stripe Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Stripe Payments</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stripe-public">Publishable Key</Label>
                <Input
                  id="stripe-public"
                  value={stripePublic}
                  onChange={(e) => setStripePublic(e.target.value)}
                  placeholder="pk_test_..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-secret">Secret Key</Label>
                <Input
                  id="stripe-secret"
                  type="password"
                  value={stripeSecret}
                  onChange={(e) => setStripeSecret(e.target.value)}
                  placeholder="sk_test_..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-webhook">Webhook Secret</Label>
                <Input
                  id="stripe-webhook"
                  type="password"
                  value={stripeWebhook}
                  onChange={(e) => setStripeWebhook(e.target.value)}
                  placeholder="whsec_..."
                />
              </div>
            </div>
          </div>

          {/* Custom Scripts Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Custom Scripts</h3>
            <div className="space-y-2">
              <Label htmlFor="custom-scripts">Head Scripts (Analytics, etc.)</Label>
              <Textarea
                id="custom-scripts"
                value={customScripts}
                onChange={(e) => setCustomScripts(e.target.value)}
                placeholder="<script>...</script>"
                className="min-h-[100px] font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            {error ? (
              <p className="text-sm font-medium text-red-600">{error}</p>
            ) : (
              <p className="text-xs text-slate-500 italic">Settings are applied instantly across the platform.</p>
            )}
            <Button type="submit" disabled={loading} className="rounded-xl h-11 px-8 font-bold">
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
