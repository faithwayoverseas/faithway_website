-- ============================================================
-- FaithWay Overseas — Invoices Module FIX Migration
-- Run this entire script in your Supabase SQL Editor.
-- This replaces/extends the original migration with correct
-- RLS and permission grants for the anon browser client.
-- ============================================================

-- 1. Drop old policies (idempotent)
drop policy if exists "Authenticated: full access to invoice_settings" on public.invoice_settings;
drop policy if exists "Authenticated: full access to invoices"         on public.invoices;
drop policy if exists "Public full access invoice_settings"            on public.invoice_settings;
drop policy if exists "Public full access invoices"                    on public.invoices;
drop policy if exists "Admin panel can manage invoice settings"        on public.invoice_settings;
drop policy if exists "Admin panel can manage invoices"                on public.invoices;

-- 2. Ensure RLS is enabled
alter table public.invoice_settings enable row level security;
alter table public.invoices         enable row level security;

-- 3. New permissive policies — allow both anon and authenticated
--    (the admin panel runs under the anon public key)
create policy "Admin panel can manage invoice settings"
  on public.invoice_settings
  for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "Admin panel can manage invoices"
  on public.invoices
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- 4. Table-level grants
grant all on public.invoice_settings to anon, authenticated;
grant all on public.invoices         to anon, authenticated;

-- 5. Sequence grants (needed for UUID/serial generation)
grant usage, select on all sequences in schema public to anon, authenticated;

-- 6. RPC grant to both roles
grant execute on function public.generate_invoice_number() to anon, authenticated;

-- 7. Recreate the RPC ensuring security definer + anon access
create or replace function public.generate_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
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
    -- Bootstrap: create default settings row
    insert into public.invoice_settings
      (company_name, company_address, company_phone, company_email,
       company_website, last_invoice_year, last_invoice_serial)
    values
      ('FaithWay Overseas',
       'Bairamalguda Rd, Sri Venkateshwara Colony, Hyderabad - 500079',
       '+971 50 888 1754 | +91 72075 89444',
       'faithwayoverseas@gmail.com',
       'https://faithwayoverseas.com',
       v_year, 1);
    v_serial := 1;
  else
    v_serial := case when v_sy != v_year then 1 else v_ss + 1 end;
    update public.invoice_settings
       set last_invoice_year   = v_year,
           last_invoice_serial = v_serial,
           updated_at          = now()
     where id = (select id from public.invoice_settings limit 1);
  end if;

  v_num := 'FWO-' || v_year::text || lpad(v_serial::text, 4, '0');
  return v_num;
end;
$$;

-- Re-grant after recreate
grant execute on function public.generate_invoice_number() to anon, authenticated;

-- 8. Storage buckets (create / ensure public)
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('invoice-assets', 'invoice-assets', true)
on conflict (id) do update set public = true;

-- 9. Storage object policies — drop old, recreate
drop policy if exists "Public read invoices bucket"          on storage.objects;
drop policy if exists "Public upload invoices bucket"        on storage.objects;
drop policy if exists "Public update invoices bucket"        on storage.objects;
drop policy if exists "Public delete invoices bucket"        on storage.objects;
drop policy if exists "Public read invoice assets bucket"    on storage.objects;
drop policy if exists "Public upload invoice assets bucket"  on storage.objects;
drop policy if exists "Public update invoice assets bucket"  on storage.objects;
drop policy if exists "Public delete invoice assets bucket"  on storage.objects;

create policy "Public read invoices bucket"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'invoices');

create policy "Public upload invoices bucket"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'invoices');

create policy "Public update invoices bucket"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'invoices')
  with check (bucket_id = 'invoices');

create policy "Public delete invoices bucket"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'invoices');

create policy "Public read invoice assets bucket"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'invoice-assets');

create policy "Public upload invoice assets bucket"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'invoice-assets');

create policy "Public update invoice assets bucket"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'invoice-assets')
  with check (bucket_id = 'invoice-assets');

create policy "Public delete invoice assets bucket"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'invoice-assets');

-- ============================================================
-- DONE. After running this script:
-- 1. Go to Supabase Dashboard > Storage > Buckets
-- 2. Ensure "invoices" and "invoice-assets" buckets exist and are Public
-- 3. Test /admin/invoices in the browser
-- ============================================================
