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

export const ORGANIZATION_CREATION_MODES = ['app_admin', 'authenticated'] as const;
export const COURSE_CREATION_MODES = ['app_admin', 'org_staff'] as const;

export type OrganizationCreationMode = (typeof ORGANIZATION_CREATION_MODES)[number];
export type CourseCreationMode = (typeof COURSE_CREATION_MODES)[number];

export type CreationSettings = {
  organizationCreationMode: OrganizationCreationMode;
  courseCreationMode: CourseCreationMode;
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
      organizationCreationMode: 'app_admin',
      courseCreationMode: 'app_admin',
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
      .select('organization_creation_mode, course_creation_mode, updated_at')
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
      organizationCreationMode: data.organization_creation_mode as OrganizationCreationMode,
      courseCreationMode: data.course_creation_mode as CourseCreationMode,
      updatedAt: data.updated_at ?? null,
    };
  }

  async updateCreationSettings(settings: {
    organizationCreationMode: OrganizationCreationMode;
    courseCreationMode: CourseCreationMode;
  }) {
    const supabase = this.supabaseService.createServiceClient();
    const { data, error } = await supabase
      .from('app_config')
      .upsert(
        {
          id: true,
          organization_creation_mode: settings.organizationCreationMode,
          course_creation_mode: settings.courseCreationMode,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      )
      .select('organization_creation_mode, course_creation_mode, updated_at')
      .single();

    if (error) {
      throw new InternalServerErrorException(
        error.message.includes('relation "public.app_config" does not exist')
          ? 'Apply the latest Supabase migrations before changing admin settings.'
          : error.message,
      );
    }

    return {
      organizationCreationMode: data.organization_creation_mode as OrganizationCreationMode,
      courseCreationMode: data.course_creation_mode as CourseCreationMode,
      updatedAt: data.updated_at ?? null,
    } satisfies CreationSettings;
  }

  async getSettingsSummary(userId?: string, email?: string) {
    const setup = await this.getAdminSetupState();
    return {
      isAppAdmin: await this.isAppAdmin(userId, email),
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

  async assertCanCreateOrganization(userId?: string, email?: string) {
    const settings = await this.getCreationSettings();
    if (settings.organizationCreationMode === 'app_admin' && !(await this.isAppAdmin(userId, email))) {
      throw new ForbiddenException('Only app administrators can create organizations');
    }
  }

  async getCourseCreationAccess(userId?: string, email?: string) {
    const settings = await this.getCreationSettings();
    const isAppAdmin = await this.isAppAdmin(userId, email);

    if (isAppAdmin) {
      return { isAppAdmin: true, useServiceRole: true };
    }

    if (settings.courseCreationMode === 'app_admin') {
      throw new ForbiddenException('Only app administrators can create courses');
    }

    return { isAppAdmin: false, useServiceRole: false };
  }

  async listOrganizations() {
    const supabase = this.supabaseService.createServiceClient();
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, subscription_status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
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
