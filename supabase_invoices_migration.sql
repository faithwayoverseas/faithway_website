-- ============================================================
-- FaithWay Overseas — Invoices Module Migration
-- Run this entire script in your Supabase SQL Editor.
-- ============================================================

-- 1. invoice_settings table
create table if not exists public.invoice_settings (
  id                  uuid primary key default gen_random_uuid(),
  company_name        text not null default 'FaithWay Overseas',
  company_address     text default 'Bairamalguda Rd, Sri Venkateshwara Colony, Hyderabad - 500079',
  company_phone       text default '+971 50 888 1754 | +91 72075 89444',
  company_email       text default 'faithwayoverseas@gmail.com',
  company_website     text default 'https://faithwayoverseas.com',
  logo_url            text,
  signature_url       text,
  stamp_url           text,
  last_invoice_year   int not null default extract(year from now())::int,
  last_invoice_serial int not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 2. invoices table
create table if not exists public.invoices (
  id               uuid primary key default gen_random_uuid(),
  invoice_number   text unique not null,
  invoice_date     date not null default current_date,
  client_name      text not null,
  client_address   text,
  client_email     text,
  service_name     text not null,
  country          text,
  description      text,
  currency         text not null default 'INR',
  amount           numeric(12,2) not null,
  amount_in_words  text,
  notes            text,
  pdf_url          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 3. Transaction-safe invoice number generator (RPC)
create or replace function public.generate_invoice_number()
returns text
language plpgsql
security definer
as $$
declare
  v_year    int := extract(year from now())::int;
  v_sy      int;
  v_ss      int;
  v_serial  int;
  v_num     text;
begin
  -- Exclusively lock the single settings row
  select last_invoice_year, last_invoice_serial
    into v_sy, v_ss
    from public.invoice_settings
   limit 1
     for update;

  if not found then
    -- Bootstrap: insert default row
    insert into public.invoice_settings
      (company_name, last_invoice_year, last_invoice_serial)
    values ('FaithWay Overseas', v_year, 1);
    v_serial := 1;
  else
    v_serial := case when v_sy != v_year then 1 else v_ss + 1 end;
    update public.invoice_settings
       set last_invoice_year   = v_year,
           last_invoice_serial = v_serial,
           updated_at          = now();
  end if;

  v_num := 'FWO-' || v_year::text || lpad(v_serial::text, 4, '0');
  return v_num;
end;
$$;

-- 4. Enable RLS
alter table public.invoice_settings enable row level security;
alter table public.invoices         enable row level security;

-- 5. Policies — authenticated users have full access; anon has none
create policy "Authenticated: full access to invoice_settings"
  on public.invoice_settings for all
  to authenticated using (true) with check (true);

create policy "Authenticated: full access to invoices"
  on public.invoices for all
  to authenticated using (true) with check (true);

-- 6. Grant RPC to authenticated role
grant execute on function public.generate_invoice_number() to authenticated;

-- 7. Seed default settings row (idempotent)
insert into public.invoice_settings
  (company_name, company_address, company_phone, company_email, company_website, last_invoice_year, last_invoice_serial)
select
  'FaithWay Overseas',
  'Bairamalguda Rd, Sri Venkateshwara Colony, Hyderabad - 500079',
  '+971 50 888 1754 | +91 72075 89444',
  'faithwayoverseas@gmail.com',
  'https://faithwayoverseas.com',
  extract(year from now())::int,
  0
where not exists (select 1 from public.invoice_settings);

-- ============================================================
-- Storage Buckets (create manually in Supabase Dashboard):
--   1. "invoices"       — public — stores generated PDFs
--   2. "invoice-assets" — public — stores logo/signature/stamp
-- ============================================================
