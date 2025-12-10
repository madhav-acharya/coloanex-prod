export class Tenant {
  id: string;
  name: string;
  isActive: boolean;
  isBanned: boolean;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerUserId?: string;
}
