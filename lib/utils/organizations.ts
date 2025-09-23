import { 
  OrganizationRole, 
  RoleHierarchy, 
  PermissionMatrix,
  SlugOptions 
} from '@/lib/types/organizations';

// Role hierarchy for permission checking
export const ROLE_HIERARCHY: RoleHierarchy = {
  owner: 3,
  admin: 2,
  member: 1,
};

// Permission matrix for different actions
export const PERMISSIONS: PermissionMatrix = {
  view_organization: {
    owner: true,
    admin: true,
    member: true,
  },
  edit_organization: {
    owner: true,
    admin: true,
    member: false,
  },
  delete_organization: {
    owner: true,
    admin: false,
    member: false,
  },
  invite_members: {
    owner: true,
    admin: true,
    member: false,
  },
  manage_members: {
    owner: true,
    admin: true,
    member: false,
  },
  remove_members: {
    owner: true,
    admin: true,
    member: false,
  },
  change_member_roles: {
    owner: true,
    admin: true,
    member: false,
  },
  transfer_ownership: {
    owner: true,
    admin: false,
    member: false,
  },
  view_invitations: {
    owner: true,
    admin: true,
    member: false,
  },
  manage_invitations: {
    owner: true,
    admin: true,
    member: false,
  },
};

// Permission checking utilities
export function hasPermission(
  userRole: OrganizationRole | null | undefined,
  permission: keyof typeof PERMISSIONS
): boolean {
  if (!userRole) return false;
  return PERMISSIONS[permission]?.[userRole] ?? false;
}

export function canManageRole(
  currentUserRole: OrganizationRole,
  targetRole: OrganizationRole
): boolean {
  const currentHierarchy = ROLE_HIERARCHY[currentUserRole];
  const targetHierarchy = ROLE_HIERARCHY[targetRole];
  
  // Only owners can manage owners
  if (targetRole === 'owner' && currentUserRole !== 'owner') {
    return false;
  }
  
  // Admins cannot manage other admins
  if (targetRole === 'admin' && currentUserRole === 'admin') {
    return false;
  }
  
  return currentHierarchy > targetHierarchy;
}

export function canPromoteToRole(
  currentUserRole: OrganizationRole,
  targetRole: OrganizationRole
): boolean {
  // Only owners can promote to owner
  if (targetRole === 'owner' && currentUserRole !== 'owner') {
    return false;
  }
  
  // Current user must have higher or equal hierarchy
  return ROLE_HIERARCHY[currentUserRole] >= ROLE_HIERARCHY[targetRole];
}

export function isHigherRole(role1: OrganizationRole, role2: OrganizationRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

export function isEqualOrHigherRole(role1: OrganizationRole, role2: OrganizationRole): boolean {
  return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2];
}

// Role checking utilities
export function isOwner(role: OrganizationRole | null | undefined): boolean {
  return role === 'owner';
}

export function isAdmin(role: OrganizationRole | null | undefined): boolean {
  return role === 'admin';
}

export function isMember(role: OrganizationRole | null | undefined): boolean {
  return role === 'member';
}

export function isOwnerOrAdmin(role: OrganizationRole | null | undefined): boolean {
  return role === 'owner' || role === 'admin';
}

export function canManageMembers(role: OrganizationRole | null | undefined): boolean {
  return hasPermission(role, 'manage_members');
}

export function canInviteMembers(role: OrganizationRole | null | undefined): boolean {
  return hasPermission(role, 'invite_members');
}

export function canEditOrganization(role: OrganizationRole | null | undefined): boolean {
  return hasPermission(role, 'edit_organization');
}

export function canDeleteOrganization(role: OrganizationRole | null | undefined): boolean {
  return hasPermission(role, 'delete_organization');
}

// Slug generation utilities
export function generateSlug(
  name: string, 
  options: SlugOptions = {}
): string {
  const {
    maxLength = 50,
    separator = '-',
    lowercase = true,
    replacements = {}
  } = options;

  let slug = name;

  // Apply custom replacements
  Object.entries(replacements).forEach(([from, to]) => {
    slug = slug.replace(new RegExp(from, 'g'), to);
  });

  // Convert to lowercase if specified
  if (lowercase) {
    slug = slug.toLowerCase();
  }

  // Replace spaces and special characters with separator
  slug = slug
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, and hyphens
    .replace(/[\s_]+/g, separator) // Replace spaces and underscores with separator
    .replace(new RegExp(`${separator}+`, 'g'), separator) // Replace multiple separators with single
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), ''); // Trim separators from start/end

  // Truncate to max length
  if (slug.length > maxLength) {
    slug = slug.substring(0, maxLength).replace(new RegExp(`${separator}+$`), '');
  }

  return slug;
}

export function validateSlug(slug: string): boolean {
  // Must contain only lowercase letters, numbers, and hyphens
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug) && slug.length >= 2 && slug.length <= 50;
}

export function generateUniqueSlug(name: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(name);
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateEmails(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach(email => {
    if (validateEmail(email.trim())) {
      valid.push(email.trim());
    } else {
      invalid.push(email.trim());
    }
  });

  return { valid, invalid };
}

export function parseEmailList(emailString: string): string[] {
  return emailString
    .split(/[,;\n\r]+/)
    .map(email => email.trim())
    .filter(email => email.length > 0);
}

// Date utilities for invitations
export function isInvitationExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function getDaysUntilExpiry(expiresAt: string): number {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getExpiryStatus(expiresAt: string): 'expired' | 'expires-today' | 'expires-soon' | 'valid' {
  const daysLeft = getDaysUntilExpiry(expiresAt);
  
  if (daysLeft === 0 && isInvitationExpired(expiresAt)) {
    return 'expired';
  }
  
  if (daysLeft === 0) {
    return 'expires-today';
  }
  
  if (daysLeft <= 2) {
    return 'expires-soon';
  }
  
  return 'valid';
}

// Organization name validation
export function validateOrganizationName(name: string): boolean {
  return name.length >= 2 && name.length <= 100;
}

// API response helpers
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string
) {
  return {
    success,
    data,
    error,
    message,
  };
}

export function createSuccessResponse<T>(data: T, message?: string) {
  return createApiResponse(true, data, undefined, message);
}

export function createErrorResponse(error: string) {
  return createApiResponse(false, undefined, error);
}

// Role display utilities
export function getRoleDisplayName(role: OrganizationRole): string {
  const roleNames = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  };
  return roleNames[role];
}

export function getRoleColor(role: OrganizationRole): string {
  const roleColors = {
    owner: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-blue-100 text-blue-800 border-blue-200',
    member: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return roleColors[role];
}

export function getRoleIcon(role: OrganizationRole): string {
  const roleIcons = {
    owner: '👑',
    admin: '⚡',
    member: '👤',
  };
  return roleIcons[role];
}

// Sort utilities
export function sortMembersByRole<T extends { role: OrganizationRole }>(members: T[]): T[] {
  return [...members].sort((a, b) => {
    const aHierarchy = ROLE_HIERARCHY[a.role];
    const bHierarchy = ROLE_HIERARCHY[b.role];
    return bHierarchy - aHierarchy; // Higher roles first
  });
}

// URL utilities
export function getInvitationUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/invite/${token}`;
}

export function getOrganizationUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/org/${slug}`;
}
