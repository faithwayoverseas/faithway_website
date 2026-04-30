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

export type InvoiceCurrency = 'INR' | 'AED' | 'USD';

export interface InvoiceSettings {
  id: string;
  company_name: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  logo_url: string | null;
  signature_url: string | null;
  stamp_url: string | null;
  notes_terms: string | null;
  last_invoice_year: number;
  last_invoice_serial: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  client_name: string;
  client_address: string | null;
  client_email: string | null;
  service_name: string;
  country: string | null;
  description: string | null;
  currency: InvoiceCurrency;
  amount: number;
  amount_in_words: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}
