export type OrganizationCreationMode = 'app_admin' | 'authenticated';
export type CourseCreationMode = 'app_admin' | 'org_staff';

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

export type AdminSettingsResponse = {
  isAppAdmin: boolean;
  creationSettings: CreationSettings;
  adminConfig: {
    hasConfiguredAdmins: boolean;
    adminIds: string[];
    adminEmails: string[];
  };
  adminRoster: AdminRosterMember[];
  setup: {
    hasAnyAdmin: boolean;
    canBootstrapInitialAdmin: boolean;
    adminStorageReady: boolean;
    adminStorageMessage: string | null;
  };
};

export type AdminOrganization = {
  id: string;
  name: string;
  subscription_status: string | null;
  created_at: string;
};
