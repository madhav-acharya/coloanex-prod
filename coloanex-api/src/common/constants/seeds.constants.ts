export const ROLES = ['Super Admin', 'Admin', 'Borrower', 'Lender'] as const;

export const PERMISSIONS = [
  'Read Roles',
  'Create Roles',
  'Update Roles',
  'Delete Roles',

  'Read Permissions',
  'Create Permissions',
  'Update Permissions',
  'Delete Permissions',

  'Read Users',
  'Create Users',
  'Update Users',
  'Delete Users',

  'Read Tenants',
  'Create Tenants',
  'Update Tenants',
  'Delete Tenants',

  'Read Borrowers',
  'Create Borrowers',
  'Update Borrowers',
  'Delete Borrowers',

  'Read KYC Documents',
  'Create KYC Documents',
  'Update KYC Documents',
  'Delete KYC Documents',
] as const;

export type Role = (typeof ROLES)[number];
export type Permission = (typeof PERMISSIONS)[number];
