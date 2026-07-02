export interface CompanyProfile {
  id: string;
  userId: string;
  companyName: string;
  legalName?: string;
  nit?: string;
  industry?: string;
  companySize?: 'startup' | 'micro' | 'small' | 'medium' | 'large' | 'enterprise';
  description?: string;
  website?: string;
  websiteUrl?: string;
  logoUrl?: string;
  foundedYear?: number;
  headquartersCity?: string;
  headquartersState?: string;
  employeeCount?: number;
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'suspended';
  rating?: number;
  totalReviews?: number;
  totalProjects?: number;
  profileCompleteness?: number;
  isActive?: boolean;

  // Aliases legacy para vistas previas.
  city?: string;
  department?: string;
  address?: string;
  phone?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  averageRating?: number;
  activeProjects?: number;

  contacts?: CompanyContact[];
  businessAreas?: CompanyBusinessArea[];
  locations?: CompanyLocation[];
  createdAt: string;
  updatedAt: string;
}

export interface CompanyContact {
  id: string;
  firstName: string;
  lastName: string;
  position?: string;
  email: string;
  phone?: string;
  isPrimary?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyBusinessArea {
  id: string;
  areaName: string;
  description?: string;
  displayOrder?: number;
  createdAt?: string;
}

export interface CompanyLocation {
  id: string;
  branchName?: string;
  city: string;
  state?: string;
  country?: string;
  address?: string;
  isHeadquarters?: boolean;
}
