import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createClerkClient } from '@clerk/backend';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAdminMemberDto } from './dto/create-admin-member.dto';

export const COURSE_CREATION_MODES = ['app_admin', 'org_staff'] as const;

export type CourseCreationMode = (typeof COURSE_CREATION_MODES)[number];

export type CreationSettings = {
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
  updatedAt: string | null;
};

export type AdminRosterMember = {
  id: number | null;
  userId: string | null;
  email: string | null;
  source: 'config' | 'managed';
  removable: boolean;
  createdAt: string | null;
  addedByUserId: string | null;
  addedByEmail: string | null;
};

export type AdminSetupState = {
  hasAnyAdmin: boolean;
  canBootstrapInitialAdmin: boolean;
  adminStorageReady: boolean;
  adminStorageMessage: string | null;
};

type AppAdminMemberRow = {
  id: number;
  user_id: string | null;
  email: string | null;
  added_by_user_id: string | null;
  added_by_email: string | null;
  created_at: string;
};

function parseCsv(value: string | undefined) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

@Injectable()
export class AdminService {
  constructor(
    private readonly config: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  private defaultSettings(): CreationSettings {
    return {
      appName: 'LMS',
      courseCreationMode: 'app_admin',
      bunnyStorageZone: '',
      bunnyStorageAccessKey: '',
      bunnyStorageCdnUrl: '',
      bunnyStorageRegion: 'ny',
      supportEmail: '',
      brandColor: '#4f46e5',
      customHeadScripts: '',
      stripePublicKey: '',
      stripeSecretKey: '',
      stripeWebhookSecret: '',
      updatedAt: null,
    };
  }

  private async getManagedAdminStorageState() {
    const supabase = this.supabaseService.createServiceClient();
    const { error } = await supabase.from('app_admin_members').select('id').limit(1);

    if (!error) {
      return {
        ready: true,
        message: null,
      };
    }

    if (error.message.includes('relation "public.app_admin_members" does not exist')) {
      return {
        ready: false,
        message: 'Apply the latest Supabase migrations before using dynamic admin management.',
      };
    }

    throw new InternalServerErrorException(error.message);
  }

  private normalizeAdminIdentity(dto: Pick<CreateAdminMemberDto, 'userId' | 'email'>) {
    const userId = dto.userId?.trim().toLowerCase() || null;
    const email = dto.email?.trim().toLowerCase() || null;

    if (!userId && !email) {
      throw new BadRequestException('Provide an email address or a Clerk user id');
    }

    return { userId, email };
  }

  getAdminConfigSummary() {
    const adminIds = parseCsv(this.config.get<string>('APP_ADMIN_USER_IDS'));
    const adminEmails = parseCsv(this.config.get<string>('APP_ADMIN_EMAILS'));

    return {
      hasConfiguredAdmins: adminIds.size > 0 || adminEmails.size > 0,
      adminIds: [...adminIds],
      adminEmails: [...adminEmails],
    };
  }

  private getConfigAdmins(): AdminRosterMember[] {
    const adminConfig = this.getAdminConfigSummary();

    return [
      ...adminConfig.adminIds.map((userId) => ({
        id: null,
        userId,
        email: null,
        source: 'config' as const,
        removable: false,
        createdAt: null,
        addedByUserId: null,
        addedByEmail: null,
      })),
      ...adminConfig.adminEmails.map((email) => ({
        id: null,
        userId: null,
        email,
        source: 'config' as const,
        removable: false,
        createdAt: null,
        addedByUserId: null,
        addedByEmail: null,
      })),
    ];
  }

  private async listManagedAdmins(): Promise<AdminRosterMember[]> {
    const storage = await this.getManagedAdminStorageState();
    if (!storage.ready) return [];

    const supabase = this.supabaseService.createServiceClient();
    const { data, error } = await supabase
      .from('app_admin_members')
      .select('id, user_id, email, added_by_user_id, added_by_email, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return (data ?? []).map((member: AppAdminMemberRow) => ({
      id: member.id,
      userId: member.user_id,
      email: member.email,
      source: 'managed',
      removable: true,
      createdAt: member.created_at,
      addedByUserId: member.added_by_user_id,
      addedByEmail: member.added_by_email,
    }));
  }

  async getAdminRoster() {
    const managedAdmins = await this.listManagedAdmins();
    return [...managedAdmins, ...this.getConfigAdmins()];
  }

  async getAdminSetupState(): Promise<AdminSetupState> {
    const storage = await this.getManagedAdminStorageState();
    const roster = await this.getAdminRoster();
    const hasAnyAdmin = roster.length > 0;

    return {
      hasAnyAdmin,
      canBootstrapInitialAdmin: storage.ready && !hasAnyAdmin,
      adminStorageReady: storage.ready,
      adminStorageMessage: storage.message,
    };
  }

  private matchesConfiguredAdmin(userId?: string, email?: string) {
    if (!userId && !email) return false;

    const normalizedUserId = userId?.toLowerCase();
    const normalizedEmail = email?.toLowerCase();
    const { adminIds, adminEmails } = this.getAdminConfigSummary();

    if (normalizedUserId && adminIds.includes(normalizedUserId)) return true;
    if (normalizedEmail && adminEmails.includes(normalizedEmail)) return true;
    return false;
  }

  private async matchesManagedAdmin(userId?: string, email?: string) {
    const normalizedUserId = userId?.toLowerCase();
    const normalizedEmail = email?.toLowerCase();
    if (!normalizedUserId && !normalizedEmail) return false;

    const storage = await this.getManagedAdminStorageState();
    if (!storage.ready) return false;

    const supabase = this.supabaseService.createServiceClient();
    let query = supabase.from('app_admin_members').select('id').limit(1);

    if (normalizedUserId && normalizedEmail) {
      query = query.or(`user_id.eq.${normalizedUserId},email.eq.${normalizedEmail}`);
    } else if (normalizedUserId) {
      query = query.eq('user_id', normalizedUserId);
    } else if (normalizedEmail) {
      query = query.eq('email', normalizedEmail);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return Boolean(data);
  }

  private async resolveUserEmail(userId?: string, email?: string) {
    if (email) return email;
    if (!userId) return undefined;

    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) return undefined;

    try {
      const clerk = createClerkClient({ secretKey });
      const user = await clerk.users.getUser(userId);
      const primaryEmailId = user.primaryEmailAddressId;
      return user.emailAddresses.find((entry) => entry.id === primaryEmailId)?.emailAddress?.toLowerCase();
    } catch {
      return undefined;
    }
  }

  async isAppAdmin(userId?: string, email?: string) {
    if (this.matchesConfiguredAdmin(userId, email)) return true;
    if (await this.matchesManagedAdmin(userId, email)) return true;

    const resolvedEmail = await this.resolveUserEmail(userId, email);
    if (!resolvedEmail || resolvedEmail === email?.toLowerCase()) return false;

    if (this.matchesConfiguredAdmin(userId, resolvedEmail)) return true;
    return this.matchesManagedAdmin(userId, resolvedEmail);
  }

  async getCreationSettings(): Promise<CreationSettings> {
    const supabase = this.supabaseService.createServiceClient();
    const { data, error } = await supabase
      .from('app_config')
      .select('app_name, course_creation_mode, bunny_storage_zone, bunny_storage_access_key, bunny_storage_cdn_url, bunny_storage_region, support_email, brand_color, custom_head_scripts, stripe_public_key, stripe_secret_key, stripe_webhook_secret, updated_at')
      .eq('id', true)
      .maybeSingle();

    if (error) {
      if (error.message.includes('relation "public.app_config" does not exist')) {
        return this.defaultSettings();
      }
      throw new InternalServerErrorException(error.message);
    }

    if (!data) return this.defaultSettings();

    return {
      appName: data.app_name as string,
      courseCreationMode: data.course_creation_mode as CourseCreationMode,
      bunnyStorageZone: data.bunny_storage_zone ?? '',
      bunnyStorageAccessKey: data.bunny_storage_access_key ?? '',
      bunnyStorageCdnUrl: data.bunny_storage_cdn_url ?? '',
      bunnyStorageRegion: data.bunny_storage_region ?? 'ny',
      supportEmail: data.support_email ?? '',
      brandColor: data.brand_color ?? '#4f46e5',
      customHeadScripts: data.custom_head_scripts ?? '',
      stripePublicKey: data.stripe_public_key ?? '',
      stripeSecretKey: data.stripe_secret_key ?? '',
      stripeWebhookSecret: data.stripe_webhook_secret ?? '',
      updatedAt: data.updated_at ?? null,
    };
  }

  async updateCreationSettings(settings: {
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
  }) {
    const supabase = this.supabaseService.createServiceClient();
    const { data, error } = await supabase
      .from('app_config')
      .upsert(
        {
          id: true,
          app_name: settings.appName,
          course_creation_mode: settings.courseCreationMode,
          bunny_storage_zone: settings.bunnyStorageZone,
          bunny_storage_access_key: settings.bunnyStorageAccessKey,
          bunny_storage_cdn_url: settings.bunnyStorageCdnUrl,
          bunny_storage_region: settings.bunnyStorageRegion,
          support_email: settings.supportEmail,
          brand_color: settings.brandColor,
          custom_head_scripts: settings.customHeadScripts,
          stripe_public_key: settings.stripePublicKey,
          stripe_secret_key: settings.stripeSecretKey,
          stripe_webhook_secret: settings.stripeWebhookSecret,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('app_name, course_creation_mode, bunny_storage_zone, bunny_storage_access_key, bunny_storage_cdn_url, bunny_storage_region, support_email, brand_color, custom_head_scripts, stripe_public_key, stripe_secret_key, stripe_webhook_secret, updated_at')
      .single();

    if (error) {
      throw new InternalServerErrorException(
        error.message.includes('relation "public.app_config" does not exist')
          ? 'Apply the latest Supabase migrations before changing admin settings.'
          : error.message,
      );
    }

    return {
      appName: data.app_name as string,
      courseCreationMode: data.course_creation_mode as CourseCreationMode,
      bunnyStorageZone: data.bunny_storage_zone ?? '',
      bunnyStorageAccessKey: data.bunny_storage_access_key ?? '',
      bunnyStorageCdnUrl: data.bunny_storage_cdn_url ?? '',
      bunnyStorageRegion: data.bunny_storage_region ?? 'ny',
      supportEmail: data.support_email ?? '',
      brandColor: data.brand_color ?? '#4f46e5',
      customHeadScripts: data.custom_head_scripts ?? '',
      stripePublicKey: data.stripe_public_key ?? '',
      stripeSecretKey: data.stripe_secret_key ?? '',
      stripeWebhookSecret: data.stripe_webhook_secret ?? '',
      updatedAt: data.updated_at ?? null,
    } satisfies CreationSettings;
  }

  async getSettingsSummary(userId?: string, email?: string) {
    const setup = await this.getAdminSetupState();
    let userRole: 'admin' | 'instructor' | 'student' = 'student';

    if (await this.isAppAdmin(userId, email)) {
      userRole = 'admin';
    } else if (userId) {
      const supabase = this.supabaseService.createServiceClient();
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
      if (data?.role) {
        userRole = data.role as any;
      }
    }

    return {
      isAppAdmin: userRole === 'admin',
      userRole,
      creationSettings: await this.getCreationSettings(),
      adminConfig: this.getAdminConfigSummary(),
      adminRoster: await this.getAdminRoster(),
      setup,
    };
  }

  async assertAppAdmin(userId?: string, email?: string) {
    if (!(await this.isAppAdmin(userId, email))) {
      throw new ForbiddenException('App administrator access required');
    }
  }

  async getCourseCreationAccess(userId?: string, email?: string) {
    const settings = await this.getCreationSettings();
    const isAppAdmin = await this.isAppAdmin(userId, email);

    if (isAppAdmin) {
      return { isAppAdmin: true, useServiceRole: true };
    }

    // Check if the user has instructor role in profiles
    if (userId) {
      const supabase = this.supabaseService.createServiceClient();
      const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
      if (data?.role === 'instructor') {
        return { isAppAdmin: false, useServiceRole: false };
      }
    }

    if (settings.courseCreationMode === 'app_admin') {
      throw new ForbiddenException('Only app administrators or instructors can create courses');
    }

    return { isAppAdmin: false, useServiceRole: false };
  }

  async listProfiles() {
    // 1. Trigger background sync from Clerk to ensure list is fresh
    try {
      await this.syncAllUsers();
    } catch (err) {
      console.error('Auto-sync failed during listProfiles:', err);
      // Continue anyway to show what we have in DB
    }

    // 2. Fetch the final authoritative list from Supabase
    const supabase = this.supabaseService.createServiceClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  async updateProfileRole(userId: string, role: 'admin' | 'instructor' | 'student') {
    const supabase = this.supabaseService.createServiceClient();
    const { error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async suspendUser(userId: string) {
    const supabase = this.supabaseService.createServiceClient();
    const { error } = await supabase
      .from('profiles')
      .update({ suspended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async unsuspendUser(userId: string) {
    const supabase = this.supabaseService.createServiceClient();
    const { error } = await supabase
      .from('profiles')
      .update({ suspended_at: null, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async deleteUser(userId: string) {
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (secretKey) {
      try {
        const clerk = createClerkClient({ secretKey });
        await clerk.users.deleteUser(userId);
      } catch (err) {
        console.error('Failed to delete user from Clerk:', err);
      }
    }

    const supabase = this.supabaseService.createServiceClient();
    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  async requestPasswordReset(userId: string) {
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) throw new InternalServerErrorException('Clerk not configured');

    const clerk = createClerkClient({ secretKey });
    // This triggers a "magic link" or similar depending on Clerk settings, 
    // or we can use Clerk's createPasswordReset API if they have a direct one.
    // For most setups, we can use clerk.users.updateUser(userId, { ... }) 
    // but the most reliable way to "reset" is to have them use the sign-in flow.
    // Let's use the Clerk communication to send a reset email if possible.
    // Note: Clerk's SDK version might vary, but users.getUser then emails is common.
    
    return { success: true, message: 'Please use Clerk Dashboard or trigger via Clerk UI flow.' };
  }

  async syncAllUsers() {
    const secretKey = this.config.get<string>('CLERK_SECRET_KEY');
    if (!secretKey) throw new InternalServerErrorException('Clerk not configured');

    const clerk = createClerkClient({ secretKey });
    const { data: clerkUsers } = await clerk.users.getUserList();
    const supabase = this.supabaseService.createServiceClient();

    for (const user of clerkUsers) {
      const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
      const avatarUrl = user.imageUrl;
      
      // Identify primary email
      const primaryEmailObj = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId) 
        || user.emailAddresses[0];
      const email = primaryEmailObj?.emailAddress ?? null;
      const username = user.username ?? null;

      await supabase.from('profiles').upsert({
        id: user.id,
        email,
        username,
        full_name: fullName || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }

    return { success: true, count: clerkUsers.length };
  }

  async getAnalytics() {
    const supabase = this.supabaseService.createServiceClient();
    
    // 1. Fetch counts
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalCourses } = await supabase.from('courses').select('*', { count: 'exact', head: true });
    const { count: totalEnrollments } = await supabase.from('enrollments').select('*', { count: 'exact', head: true });
    const { count: totalLessons } = await supabase.from('lessons').select('*', { count: 'exact', head: true });
    
    // 2. Trend data (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: recentProfiles } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { data: recentEnrollments } = await supabase
      .from('enrollments')
      .select('enrolled_at')
      .gte('enrolled_at', thirtyDaysAgo.toISOString());

    // 3. Top Courses
    const { data: topCourses } = await supabase
      .from('courses')
      .select('id, title, enrollments(count)')
      .limit(5);
    
    // Sort and format top courses
    const formattedTopCourses = (topCourses || [])
      .map(c => ({
        id: c.id,
        title: c.title,
        enrollmentCount: (c as any).enrollments?.[0]?.count ?? 0
      }))
      .sort((a, b) => b.enrollmentCount - a.enrollmentCount);

    return {
      overview: {
        totalUsers: totalUsers ?? 0,
        totalCourses: totalCourses ?? 0,
        totalEnrollments: totalEnrollments ?? 0,
        totalLessons: totalLessons ?? 0,
      },
      trends: {
        registrations: recentProfiles || [],
        enrollments: recentEnrollments || [],
      },
      topCourses: formattedTopCourses
    };
  }

  async addAdminMember(member: CreateAdminMemberDto, addedByUserId?: string, addedByEmail?: string) {
    const storage = await this.getManagedAdminStorageState();
    if (!storage.ready) {
      throw new InternalServerErrorException(storage.message ?? 'Admin storage is unavailable.');
    }

    const normalized = this.normalizeAdminIdentity(member);
    const supabase = this.supabaseService.createServiceClient();

    const payload = {
      user_id: normalized.userId,
      email: normalized.email,
      added_by_user_id: addedByUserId?.toLowerCase() ?? null,
      added_by_email: addedByEmail?.toLowerCase() ?? null,
    };

    let existingQuery = supabase.from('app_admin_members').select('id');
    if (normalized.userId && normalized.email) {
      existingQuery = existingQuery.or(`user_id.eq.${normalized.userId},email.eq.${normalized.email}`);
    } else if (normalized.userId) {
      existingQuery = existingQuery.eq('user_id', normalized.userId);
    } else if (normalized.email) {
      existingQuery = existingQuery.eq('email', normalized.email);
    }

    const { data: existingRows, error: existingError } = await existingQuery.limit(2);
    if (existingError) {
      throw new InternalServerErrorException(existingError.message);
    }

    const existingId = existingRows?.[0]?.id;
    const operation = existingId
      ? supabase.from('app_admin_members').update(payload).eq('id', existingId)
      : supabase.from('app_admin_members').insert(payload);

    const { error } = await operation;
    if (error) {
      throw new InternalServerErrorException(error.message);
    }

    return this.getAdminRoster();
  }

  async claimInitialAdmin(userId?: string, email?: string) {
    const setup = await this.getAdminSetupState();
    if (!setup.adminStorageReady) {
      throw new InternalServerErrorException(
        setup.adminStorageMessage ?? 'Admin storage is unavailable.',
      );
    }
    if (setup.hasAnyAdmin) {
      throw new ForbiddenException('Initial admin has already been configured');
    }

    if (!userId) {
      throw new BadRequestException('Signed-in user is required to claim initial admin access');
    }

    const resolvedEmail = await this.resolveUserEmail(userId, email);
    await this.addAdminMember(
      {
        userId,
        email: resolvedEmail ?? email,
      },
      userId,
      resolvedEmail ?? email,
    );

    return this.getSettingsSummary(userId, resolvedEmail ?? email);
  }

  async removeAdminMember(adminId: number) {
    const storage = await this.getManagedAdminStorageState();
    if (!storage.ready) {
      throw new InternalServerErrorException(storage.message ?? 'Admin storage is unavailable.');
    }

    const roster = await this.getAdminRoster();
    const target = roster.find((member) => member.id === adminId);

    if (!target || target.source !== 'managed') {
      throw new NotFoundException('Admin member not found');
    }

    if (roster.filter((member) => member.userId || member.email).length <= 1) {
      throw new BadRequestException('At least one admin must remain');
    }

    const supabase = this.supabaseService.createServiceClient();
    const { error } = await supabase.from('app_admin_members').delete().eq('id', adminId);

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
