'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import type { CourseCreationMode } from '@/lib/admin-settings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Palette, 
  Video, 
  CreditCard, 
  ShieldCheck, 
  Globe,
  Mail,
  Type,
  Code
} from 'lucide-react';

type Props = {
  appName: string;
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
  const [courseMode, setCourseMode] = useState<CourseCreationMode>(courseCreationMode);
  const [bunnyZone, setBunnyZone] = useState(bunnyStorageZone);
  const [bunnyKey, setBunnyKey] = useState(bunnyStorageAccessKey);
  const [bunnyCdn, setBunnyCdn] = useState(bunnyStorageCdnUrl);
  const [bunnyRegion] = useState(bunnyStorageRegion);
  const [supportEmailState, setSupportEmailState] = useState(supportEmail);
  const [brandColorState, setBrandColorState] = useState(brandColor);
  const [customScripts, setCustomScripts] = useState(customHeadScripts);
  const [stripePublic, setStripePublic] = useState(stripePublicKey);
  const [stripeSecret, setStripeSecret] = useState(stripeSecretKey);
  const [stripeWebhook, setStripeWebhook] = useState(stripeWebhookSecret);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

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
      setIsDirty(false);
      router.refresh();
      alert('Settings saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save admin settings');
    }

    setLoading(false);
  }

  const handleInputChange = (setter: (val: any) => void) => (e: any) => {
    setter(e.target.value);
    setIsDirty(true);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Branding & General */}
        <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/30">
                <Palette className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Branding & General</CardTitle>
                <CardDescription>Visual identity and contact info.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="app-name">Platform Name</Label>
              <div className="relative">
                <Type className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="app-name"
                  value={appNameState}
                  onChange={handleInputChange(setAppNameState)}
                  className="pl-10 h-11"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="support-email">Support Email</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="support-email"
                  type="email"
                  value={supportEmailState}
                  onChange={handleInputChange(setSupportEmailState)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="brand-color">Brand Primary Color</Label>
              <div className="flex gap-3">
                <Input
                  id="brand-color"
                  type="color"
                  value={brandColorState}
                  onChange={handleInputChange(setBrandColorState)}
                  className="w-14 h-11 p-1 rounded-xl cursor-pointer"
                />
                <Input
                  value={brandColorState}
                  onChange={handleInputChange(setBrandColorState)}
                  className="flex-1 h-11 font-mono uppercase"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Video Infrastructure */}
        <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/30">
                <Video className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Video Infrastructure</CardTitle>
                <CardDescription>Powered by Bunny.net</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="bunny-zone">Storage Zone</Label>
              <Input
                id="bunny-zone"
                value={bunnyZone}
                onChange={handleInputChange(setBunnyZone)}
                placeholder="Zone Name"
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="bunny-key">Access Key</Label>
              <Input
                id="bunny-key"
                type="password"
                value={bunnyKey}
                onChange={handleInputChange(setBunnyKey)}
                placeholder="API/FTP Password"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="bunny-cdn">CDN URL (Pull Zone)</Label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  id="bunny-cdn"
                  value={bunnyCdn}
                  onChange={handleInputChange(setBunnyCdn)}
                  placeholder="https://..."
                  className="pl-10 h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Gateways */}
        <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/30">
                <CreditCard className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Payment Gateway</CardTitle>
                <CardDescription>Powered by Stripe</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="stripe-public">Publishable Key</Label>
              <Input
                id="stripe-public"
                value={stripePublic}
                onChange={handleInputChange(setStripePublic)}
                placeholder="pk_test_..."
                className="h-11 font-mono text-xs"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="stripe-secret">Secret Key</Label>
              <Input
                id="stripe-secret"
                type="password"
                value={stripeSecret}
                onChange={handleInputChange(setStripeSecret)}
                placeholder="sk_test_..."
                className="h-11 font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="stripe-webhook">Webhook Signing Secret</Label>
              <Input
                id="stripe-webhook"
                type="password"
                value={stripeWebhook}
                onChange={handleInputChange(setStripeWebhook)}
                placeholder="whsec_..."
                className="h-11 font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Security & Advanced */}
        <Card className="rounded-[1.5rem] border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="border-b border-slate-50 dark:border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-50 p-2 text-slate-600 dark:bg-slate-900">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Policy & Advanced</CardTitle>
                <CardDescription>Access control and custom code.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="course-mode">Course Creation Permission</Label>
              <select
                id="course-mode"
                value={courseMode}
                onChange={(e) => {
                  setCourseMode(e.target.value as CourseCreationMode);
                  setIsDirty(true);
                }}
                className="flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              >
                <option value="app_admin">Strict (Admins Only)</option>
                <option value="org_staff">Flexible (All Instructors)</option>
              </select>
              <p className="text-[10px] text-slate-400 font-medium italic">Determines who can launch new courses in the catalog.</p>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2" htmlFor="custom-scripts">
                <Code className="size-3" />
                Custom Head Scripts
              </Label>
              <Textarea
                id="custom-scripts"
                value={customScripts}
                onChange={handleInputChange(setCustomScripts)}
                placeholder="<script>...</script>"
                className="min-h-[100px] font-mono text-[10px] rounded-xl bg-slate-50 dark:bg-slate-900"
              />
              <p className="text-[10px] text-slate-400 font-medium italic">Use for Google Analytics or other third-party tracking.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Action Bar */}
      {isDirty && (
        <div className="sticky bottom-8 z-30 flex items-center justify-between gap-4 rounded-[2rem] border border-slate-200 bg-white/80 p-4 backdrop-blur-xl shadow-2xl dark:border-slate-800 dark:bg-slate-950/80 max-w-2xl mx-auto border-t-indigo-100">
          <div className="pl-4">
            {error ? (
              <p className="text-sm font-bold text-red-600">{error}</p>
            ) : (
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Unsaved changes detected</p>
            )}
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Global settings update</p>
          </div>
          <div className="flex items-center gap-3">
             <Button 
                type="button" 
                variant="ghost" 
                onClick={() => {
                  setAppNameState(appName);
                  setCourseMode(courseCreationMode);
                  setBunnyZone(bunnyStorageZone);
                  setBunnyKey(bunnyStorageAccessKey);
                  setBunnyCdn(bunnyStorageCdnUrl);
                  setSupportEmailState(supportEmail);
                  setBrandColorState(brandColor);
                  setCustomScripts(customHeadScripts);
                  setStripePublic(stripePublicKey);
                  setStripeSecret(stripeSecretKey);
                  setStripeWebhook(stripeWebhookSecret);
                  setIsDirty(false);
                }}
                className="text-xs font-bold text-slate-500 rounded-xl"
             >
               Reset
             </Button>
             <Button 
              type="submit" 
              disabled={loading} 
              className="rounded-2xl h-12 px-10 font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 dark:shadow-none transition-all"
            >
              {loading ? 'Saving…' : 'Apply Changes'}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
