'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useSupabaseAccessToken } from '@/lib/supabase-access-token';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, User, Trash2, Key, Ban, CheckCircle2, Search } from 'lucide-react';

type Profile = {
  id: string;
  role: 'admin' | 'instructor' | 'student';
  email: string | null;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  suspended_at: string | null;
  created_at: string;
};

export function UserManager() {
  const { getAccessToken } = useSupabaseAccessToken();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token');
      const data = await apiFetch<Profile[]>('/admin/profiles', token);
      setProfiles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function performAction(userId: string, action: 'suspend' | 'unsuspend' | 'delete' | 'reset-password' | 'role', value?: string) {
    if (action === 'delete' && !confirm('Are you sure you want to PERMANENTLY delete this user? This will also remove them from Clerk.')) return;
    
    setBusyId(userId);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token');

      let endpoint = `/admin/profiles/${userId}`;
      let method = 'POST';

      if (action === 'suspend') endpoint += '/suspend';
      else if (action === 'unsuspend') endpoint += '/unsuspend';
      else if (action === 'delete') method = 'DELETE';
      else if (action === 'reset-password') endpoint += '/password-reset';
      else if (action === 'role') {
        endpoint += '/role';
        method = 'PATCH';
      }

      const res = await apiFetch<any>(endpoint, token, {
        method,
        body: value ? JSON.stringify({ role: value }) : undefined,
      });

      if (action === 'delete') {
        setProfiles(profiles.filter(p => p.id !== userId));
      } else if (action === 'reset-password') {
        alert(res.message || 'Password reset requested.');
      } else {
        await fetchProfiles();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  }

  if (loading && profiles.length === 0) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  if (error) return <p className="text-red-500">{error}</p>;

  const filteredProfiles = profiles.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      (p.full_name || '').toLowerCase().includes(query) ||
      (p.email || '').toLowerCase().includes(query) ||
      (p.username || '').toLowerCase().includes(query) ||
      p.id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <Input
          placeholder="Search by name, email, or username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-12 pr-4 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all dark:border-slate-800 dark:bg-slate-950"
        />
      </div>

      <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <CardHeader>
          <CardTitle className="text-xl">User Management</CardTitle>
          <CardDescription>
            {searchQuery 
              ? `${filteredProfiles.length} matching ${filteredProfiles.length === 1 ? 'user' : 'users'} found`
              : 'Manage all registered users, their roles, and account status.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProfiles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500">No users found.</p>
                {searchQuery && (
                  <Button 
                    variant="link" 
                    className="text-indigo-600 mt-2 h-auto p-0" 
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              filteredProfiles.map((profile) => (
              <div key={profile.id} className="flex flex-col gap-4 p-5 border border-slate-100 rounded-[1.5rem] bg-slate-50/30 dark:border-slate-800/50 dark:bg-slate-900/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 relative">
                      <User className="size-6 text-slate-400" />
                      {profile.suspended_at && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm">
                          <Ban className="size-3" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate">{profile.full_name || profile.username || 'Anonymous'}</p>
                        {profile.suspended_at && (
                          <Badge variant="destructive" className="h-4 text-[10px] uppercase">Suspended</Badge>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {profile.email && <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">{profile.email}</p>}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {profile.username && <p className="text-[10px] text-slate-400 font-mono">@{profile.username}</p>}
                          <p className="text-[10px] text-slate-400 font-mono truncate">ID: {profile.id}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <Badge 
                      className="h-6"
                      variant={profile.role === 'admin' ? 'default' : profile.role === 'instructor' ? 'success' : 'secondary'}
                    >
                      {profile.role}
                    </Badge>
                    
                    <div className="relative group">
                      <select
                        disabled={busyId === profile.id}
                        value={profile.role}
                        onChange={(e) => performAction(profile.id, 'role', e.target.value)}
                        className="appearance-none h-9 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 disabled:opacity-50"
                      >
                        <option value="student">Student</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-slate-600 transition-colors">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {profile.suspended_at ? (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 text-xs gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                      disabled={busyId === profile.id}
                      onClick={() => performAction(profile.id, 'unsuspend')}
                    >
                      <CheckCircle2 className="size-3.5" />
                      Unsuspend
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 text-xs gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      disabled={busyId === profile.id}
                      onClick={() => performAction(profile.id, 'suspend')}
                    >
                      <Ban className="size-3.5" />
                      Suspend
                    </Button>
                  )}

                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs gap-1.5"
                    disabled={busyId === profile.id}
                    onClick={() => performAction(profile.id, 'reset-password')}
                  >
                    <Key className="size-3.5" />
                    Reset Password
                  </Button>

                  <div className="flex-1 min-w-[20px]" />

                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-100 dark:border-red-900/30"
                    disabled={busyId === profile.id}
                    onClick={() => performAction(profile.id, 'delete')}
                  >
                    <Trash2 className="size-3.5" />
                    Delete Account
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}

