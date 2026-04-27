export type InquiryStatus = 'New' | 'Contacted' | 'In Progress' | 'Converted' | 'Rejected';

export interface Inquiry {
  id: string;
  created_at: string;
  name: string;
  email: string;
  service: string;
  details: string;
  status: InquiryStatus;
  notes: string | null;
  assigned_to: string | null;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  benefits: string[];
  order: number;
  is_active: boolean;
  created_at: string;
}

export interface Destination {
  id: string;
  name: string;
  code: string;
  description: string;
  image_url: string;
  is_featured: boolean;
  created_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar_url: string;
  is_published: boolean;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_title: string;
  meta_description: string;
  featured_image: string | null;
  is_published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}
