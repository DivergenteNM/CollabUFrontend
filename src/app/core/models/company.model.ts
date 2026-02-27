export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  nit: string;
  industry: string;
  companySize: 'micro' | 'small' | 'medium' | 'large';
  description: string;
  websiteUrl?: string;
  logoUrl?: string;
  address: string;
  city: string;
  department: string;
  phone: string;
  isVerified: boolean;
  verifiedAt?: string;
  averageRating?: number;
  totalProjects: number;
  activeProjects: number;
  contacts: CompanyContact[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanyContact {
  id: string;
  fullName: string;
  position: string;
  email: string;
  phone?: string;
  isPrimary: boolean;
}
