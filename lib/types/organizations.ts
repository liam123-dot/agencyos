// Organization System TypeScript Types

// API Response type
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Database enums
export type OrganizationRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// Core database types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  vapi_api_key?: string;
  stripe_api_key?: string;
  domain?: string;
  created_at: string;
  updated_at: string;
}

export interface UserOrganization {
  id: string;
  user_id: string;
  organization_id: string;
  role: OrganizationRole;
  created_at: string;
  updated_at: string;
  organization?: Organization;
  user?: UserProfile;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  invited_email: string;
  invited_by: string;
  role: OrganizationRole;
  status: InvitationStatus;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at?: string;
  organization?: Organization;
  inviter?: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  selected_organization_id?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with computed fields
export interface OrganizationWithDetails extends Organization {
  member_count: number;
  user_role: OrganizationRole;
  is_owner: boolean;
  is_admin: boolean;
  can_manage_members: boolean;
  can_invite: boolean;
}

export interface OrganizationMember extends UserProfile {
  role: OrganizationRole;
  joined_at: string;
  organization_id: string;
}

export interface InvitationWithDetails extends OrganizationInvitation {
  organization_name: string;
  organization_slug: string;
  invited_by_name?: string;
  invited_by_email: string;
  is_expired: boolean;
  days_until_expiry: number;
}

// Request types for server actions and forms
export interface CreateOrganizationRequest {
  name: string;
}

export interface UpdateOrganizationRequest {
  name?: string;
  slug?: string;
  description?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: OrganizationRole;
}

export interface InviteMembersRequest {
  invitations: InviteMemberRequest[];
}

export interface UpdateMemberRoleRequest {
  role: OrganizationRole;
}

export interface TransferOwnershipRequest {
  new_owner_id: string;
}

// Form schemas and validation types
export interface CreateOrganizationFormData {
  name: string;
}

export interface EditOrganizationFormData {
  name: string;
  slug: string;
  description: string;
}

export interface InviteMemberFormData {
  email: string;
  role: OrganizationRole;
}

export interface BulkInviteFormData {
  emails: string;
  role: OrganizationRole;
}

// Component prop types
export interface OrganizationSelectorProps {
  value?: string;
  onChange: (organizationId: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export interface OrganizationCardProps {
  organization: OrganizationWithDetails;
  onSelect?: (organization: OrganizationWithDetails) => void;
  showActions?: boolean;
  className?: string;
}

export interface CreateOrganizationFormProps {
  onSuccess: (organization: Organization) => void;
  onCancel: () => void;
  className?: string;
}

export interface OrganizationSettingsProps {
  organizationId: string;
  onUpdate: (organization: Organization) => void;
  className?: string;
}

export interface MemberListProps {
  organizationId: string;
  canManage?: boolean;
  className?: string;
}

export interface InviteMemberFormProps {
  organizationId: string;
  onInviteSent: (invitations: OrganizationInvitation[]) => void;
  onCancel?: () => void;
  className?: string;
}

export interface PendingInvitationsProps {
  organizationId: string;
  className?: string;
}

export interface InvitationPageProps {
  token: string;
  className?: string;
}

export interface PermissionGateProps {
  userRole?: OrganizationRole;
  requiredRole: OrganizationRole;
  organizationId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mode?: 'hide' | 'show-fallback';
}

// Context types
export interface OrganizationContextValue {
  currentOrganization: OrganizationWithDetails | null;
  userRole: OrganizationRole | null;
  isLoading: boolean;
  error: string | null;
  organizations: OrganizationWithDetails[];
  switchOrganization: (organizationId: string) => Promise<void>;
  refetchOrganizations: () => Promise<void>;
  refetchCurrentOrganization: () => Promise<void>;
  createOrganization: (data: CreateOrganizationRequest) => Promise<Organization>;
  updateOrganization: (id: string, data: UpdateOrganizationRequest) => Promise<Organization>;
  deleteOrganization: (id: string) => Promise<void>;
  leaveOrganization: (id: string) => Promise<void>;
}

// Hook return types
export interface UseOrganizationsReturn {
  organizations: OrganizationWithDetails[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseOrganizationMembersReturn {
  members: OrganizationMember[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateMemberRole: (userId: string, role: OrganizationRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
}

export interface UsePendingInvitationsReturn {
  invitations: InvitationWithDetails[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
}

export interface UseUserRoleReturn {
  role: OrganizationRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  canManageMembers: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
  canDelete: boolean;
  isLoading: boolean;
}

export interface UseInvitationDetailsReturn {
  invitation: InvitationWithDetails | null;
  isLoading: boolean;
  error: string | null;
  isExpired: boolean;
  acceptInvitation: () => Promise<void>;
  declineInvitation: () => Promise<void>;
}

// Action hook types (for server actions)
export interface UseCreateOrganizationReturn {
  createOrganization: (data: CreateOrganizationRequest) => Promise<Organization>;
  isLoading: boolean;
  error: string | null;
}

export interface UseUpdateOrganizationReturn {
  updateOrganization: (data: UpdateOrganizationRequest) => Promise<Organization>;
  isLoading: boolean;
  error: string | null;
}

export interface UseInviteMembersReturn {
  inviteMembers: (data: InviteMembersRequest) => Promise<OrganizationInvitation[]>;
  inviteMember: (data: InviteMemberRequest) => Promise<OrganizationInvitation>;
  isLoading: boolean;
  error: string | null;
}

export interface UseManageMembersReturn {
  updateMemberRole: (userId: string, role: OrganizationRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  transferOwnership: (userId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseInvitationActionsReturn {
  acceptInvitation: (token: string) => Promise<void>;
  declineInvitation: (token: string) => Promise<void>;
  cancelInvitation: (invitationId: string) => Promise<void>;
  resendInvitation: (invitationId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

// Utility types
export interface RoleHierarchy {
  owner: number;
  admin: number;
  member: number;
}

export interface PermissionMatrix {
  [key: string]: {
    [role in OrganizationRole]: boolean;
  };
}

// Error types
export interface OrganizationError extends Error {
  code?: string;
  statusCode?: number;
  details?: unknown;
}

export interface ValidationError extends OrganizationError {
  field?: string;
  value?: unknown;
}

// Onboarding flow types
export interface OnboardingState {
  step: 'loading' | 'needs_organization' | 'has_organization' | 'error';
  hasOrganization: boolean;
  selectedOrganization: OrganizationWithDetails | null;
  availableInvitations: InvitationWithDetails[];
  isLoading: boolean;
  error: string | null;
}

export interface OnboardingFlowProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export interface CreateOrJoinOrgProps {
  onComplete: (organization: OrganizationWithDetails) => void;
  availableInvitations: InvitationWithDetails[];
  className?: string;
}

// Slug generation options
export interface SlugOptions {
  maxLength?: number;
  separator?: string;
  lowercase?: boolean;
  replacements?: Record<string, string>;
}

// Search and filter types
export interface OrganizationFilters {
  role?: OrganizationRole[];
  search?: string;
  sortBy?: 'name' | 'created_at' | 'member_count';
  sortOrder?: 'asc' | 'desc';
}

export interface MemberFilters {
  role?: OrganizationRole[];
  search?: string;
  sortBy?: 'name' | 'email' | 'joined_at' | 'role';
  sortOrder?: 'asc' | 'desc';
}

export interface InvitationFilters {
  status?: InvitationStatus[];
  role?: OrganizationRole[];
  search?: string;
  sortBy?: 'email' | 'created_at' | 'expires_at' | 'role';
  sortOrder?: 'asc' | 'desc';
}
