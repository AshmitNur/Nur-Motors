create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('owner', 'manager', 'accountant', 'staff');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('Cash', 'Bank', 'bKash', 'Nagad', 'Cheque');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type public.payment_status as enum ('Pending', 'Partially Paid', 'Paid', 'Overdue');
  end if;
  if not exists (select 1 from pg_type where typname = 'bike_status') then
    create type public.bike_status as enum ('Available', 'Sold', 'Reserved', 'Damaged');
  end if;
  if not exists (select 1 from pg_type where typname = 'home_location') then
    create type public.home_location as enum ('Dhaka', 'Dinajpur');
  end if;
  if not exists (select 1 from pg_type where typname = 'other_record_type') then
    create type public.other_record_type as enum ('Income', 'Expense');
  end if;
end $$;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.app_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.user_profiles where id = auth.uid()),
    'staff'::public.app_role
  );
$$;

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  monthly_salary numeric(12,2) not null default 0 check (monthly_salary >= 0),
  salary_due numeric(12,2) not null default 0 check (salary_due >= 0),
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  alternative_phone text,
  address text not null default '',
  nid_number text,
  customer_photo_url text,
  status text not null default 'Regular' check (status in ('Regular', 'Good Payer', 'Risky', 'Blacklisted')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bikes (
  id uuid primary key default gen_random_uuid(),
  brand text not null default 'Suzuki' check (brand = 'Suzuki'),
  model text not null,
  color text not null default '',
  year integer not null,
  chassis_number text not null unique,
  engine_number text not null unique,
  purchase_price numeric(12,2) not null default 0 check (purchase_price >= 0),
  supplier_name text not null default '',
  purchase_date date not null default current_date,
  current_status public.bike_status not null default 'Available',
  location text not null default 'Showroom',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  part_name text not null,
  category text not null,
  brand text not null default '',
  quantity_available integer not null default 0 check (quantity_available >= 0),
  purchase_price_per_unit numeric(12,2) not null default 0 check (purchase_price_per_unit >= 0),
  selling_price_per_unit numeric(12,2) not null default 0 check (selling_price_per_unit >= 0),
  supplier_name text not null default '',
  minimum_stock_level integer not null default 0 check (minimum_stock_level >= 0),
  location text not null default '',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bike_sales (
  id uuid primary key default gen_random_uuid(),
  sale_no text not null unique,
  sale_date date not null default current_date,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  bike_id uuid references public.bikes(id) on delete set null,
  bike_brand text not null default 'Suzuki' check (bike_brand = 'Suzuki'),
  bike_model text not null,
  bike_color text not null default '',
  chassis_number text not null,
  engine_number text not null,
  registration_number text,
  purchase_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  additional_sale_expense numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  due_amount numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  payment_type text not null default 'Full Payment' check (payment_type in ('Full Payment', 'Partial Payment', 'Loan')),
  payment_method public.payment_method not null default 'Cash',
  salesperson text not null default '',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.due_records (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.bike_sales(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  bike_details text not null,
  total_selling_price numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  due_amount numeric(12,2) not null default 0,
  remaining_due numeric(12,2) not null default 0,
  due_date date not null,
  installment_type text not null default 'One-time' check (installment_type in ('One-time', 'Multiple installments')),
  installment_amount numeric(12,2) not null default 0,
  payment_status public.payment_status not null default 'Pending',
  last_payment_date date,
  next_payment_date date,
  payment_method public.payment_method not null default 'Cash',
  guarantor_name text,
  guarantor_phone text,
  documents jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.due_payments (
  id uuid primary key default gen_random_uuid(),
  due_record_id uuid not null references public.due_records(id) on delete cascade,
  payment_date date not null default current_date,
  amount_received numeric(12,2) not null check (amount_received > 0),
  payment_method public.payment_method not null default 'Cash',
  received_by text not null default '',
  previous_due numeric(12,2) not null default 0,
  remaining_due numeric(12,2) not null default 0,
  receipt_number text not null unique,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_records (
  id uuid primary key default gen_random_uuid(),
  service_no text not null unique,
  service_date date not null default current_date,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  bike_brand text not null default 'Suzuki' check (bike_brand = 'Suzuki'),
  bike_model text not null,
  service_type text not null,
  parts_used text not null default '',
  service_charge numeric(12,2) not null default 0,
  parts_cost numeric(12,2) not null default 0,
  total_bill numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  due_amount numeric(12,2) not null default 0,
  payment_method public.payment_method not null default 'Cash',
  mechanic_name text not null default '',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.parts_transactions (
  id uuid primary key default gen_random_uuid(),
  part_id uuid references public.parts(id) on delete set null,
  transaction_date date not null default current_date,
  transaction_type text not null check (transaction_type in ('Purchase', 'Service Use', 'Direct Sale', 'Adjustment')),
  quantity integer not null,
  unit_cost numeric(12,2) not null default 0,
  unit_price numeric(12,2) not null default 0,
  related_service_id uuid references public.service_records(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.debit_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method public.payment_method not null default 'Cash',
  person text not null default '',
  purpose text not null default '',
  related_module text,
  added_by text not null default '',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method public.payment_method not null default 'Cash',
  person text not null default '',
  purpose text not null default '',
  related_module text,
  related_sale_id uuid references public.bike_sales(id) on delete set null,
  related_service_id uuid references public.service_records(id) on delete set null,
  added_by text not null default '',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.salary_payments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.staff(id) on delete set null,
  staff_name text not null,
  salary_month text not null,
  bonus_amount numeric(12,2) not null default 0,
  bonus_type text,
  payment_date date not null default current_date,
  paid_amount numeric(12,2) not null default 0,
  due_salary numeric(12,2) not null default 0,
  payment_method public.payment_method not null default 'Cash',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bonus_payments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.staff(id) on delete set null,
  bonus_amount numeric(12,2) not null default 0,
  bonus_type text not null,
  payment_date date not null default current_date,
  payment_method public.payment_method not null default 'Cash',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_expenses (
  id uuid primary key default gen_random_uuid(),
  home public.home_location not null,
  expense_date date not null default current_date,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  paid_by text not null default '',
  payment_method public.payment_method not null default 'Cash',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.other_records (
  id uuid primary key default gen_random_uuid(),
  record_date date not null default current_date,
  type public.other_record_type not null,
  category text not null,
  amount numeric(12,2) not null check (amount >= 0),
  description text not null default '',
  payment_method public.payment_method not null default 'Cash',
  added_by text not null default '',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  invoice_type text not null check (invoice_type in ('Bike Sale', 'Service')),
  related_sale_id uuid references public.bike_sales(id) on delete set null,
  related_service_id uuid references public.service_records(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  due_payment_id uuid references public.due_payments(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  entity text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);

create sequence if not exists public.receipt_seq;

alter table public.bikes alter column brand set default 'Suzuki';
alter table public.bike_sales alter column bike_brand set default 'Suzuki';
alter table public.service_records alter column bike_brand set default 'Suzuki';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bikes_brand_suzuki_only' and conrelid = 'public.bikes'::regclass
  ) then
    alter table public.bikes add constraint bikes_brand_suzuki_only check (brand = 'Suzuki') not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'bike_sales_brand_suzuki_only' and conrelid = 'public.bike_sales'::regclass
  ) then
    alter table public.bike_sales add constraint bike_sales_brand_suzuki_only check (bike_brand = 'Suzuki') not valid;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'service_records_brand_suzuki_only' and conrelid = 'public.service_records'::regclass
  ) then
    alter table public.service_records add constraint service_records_brand_suzuki_only check (bike_brand = 'Suzuki') not valid;
  end if;
end $$;

create index if not exists bike_sales_sale_date_idx on public.bike_sales (sale_date);
create index if not exists bike_sales_customer_phone_idx on public.bike_sales (customer_phone);
create index if not exists bike_sales_chassis_number_idx on public.bike_sales (chassis_number);
create index if not exists due_records_due_date_idx on public.due_records (due_date);
create index if not exists due_records_payment_status_idx on public.due_records (payment_status);
create index if not exists service_records_service_date_idx on public.service_records (service_date);
create index if not exists debit_transactions_transaction_date_category_idx on public.debit_transactions (transaction_date, category);
create index if not exists credit_transactions_transaction_date_category_idx on public.credit_transactions (transaction_date, category);

create or replace function public.normalize_bike_sale()
returns trigger
language plpgsql
as $$
begin
  new.due_amount = greatest(new.selling_price - new.discount - new.paid_amount, 0);
  new.profit = new.selling_price - new.purchase_price - new.discount - new.additional_sale_expense;
  if new.due_amount = 0 then
    new.payment_type = 'Full Payment';
  elsif new.payment_type = 'Full Payment' then
    new.payment_type = 'Partial Payment';
  end if;
  return new;
end;
$$;

create or replace function public.refresh_due_status()
returns trigger
language plpgsql
as $$
begin
  if new.remaining_due <= 0 then
    new.payment_status = 'Paid';
  elsif current_date > new.due_date then
    new.payment_status = 'Overdue';
  elsif new.remaining_due < new.due_amount then
    new.payment_status = 'Partially Paid';
  else
    new.payment_status = 'Pending';
  end if;
  return new;
end;
$$;

create or replace function public.record_due_payment(
  p_due_record_id uuid,
  p_amount numeric,
  p_payment_method public.payment_method,
  p_received_by text,
  p_payment_date date default current_date,
  p_notes text default null
)
returns public.due_payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_due public.due_records;
  v_payment public.due_payments;
  v_receipt text;
  v_remaining numeric;
begin
  select * into v_due from public.due_records where id = p_due_record_id for update;
  if not found then
    raise exception 'Due record not found';
  end if;
  if p_amount <= 0 or p_amount > v_due.remaining_due then
    raise exception 'Payment amount must be greater than 0 and less than or equal to remaining due';
  end if;

  v_remaining := v_due.remaining_due - p_amount;
  v_receipt := 'RCPT-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.receipt_seq')::text, 5, '0');

  insert into public.due_payments (
    due_record_id, payment_date, amount_received, payment_method, received_by,
    previous_due, remaining_due, receipt_number, notes
  ) values (
    p_due_record_id, p_payment_date, p_amount, p_payment_method, p_received_by,
    v_due.remaining_due, v_remaining, v_receipt, p_notes
  ) returning * into v_payment;

  update public.due_records
  set remaining_due = v_remaining,
      paid_amount = paid_amount + p_amount,
      last_payment_date = p_payment_date,
      updated_at = now()
  where id = p_due_record_id;

  insert into public.credit_transactions (
    transaction_date, category, amount, payment_method, person, purpose, related_module, related_sale_id, added_by
  ) values (
    p_payment_date, 'Due collection', p_amount, p_payment_method, v_due.customer_name,
    v_receipt || ' due collection', 'Due payment', v_due.sale_id, p_received_by
  );

  insert into public.receipts (receipt_no, due_payment_id, payload)
  values (v_receipt, v_payment.id, to_jsonb(v_payment));

  insert into public.activity_logs (actor, action, entity, entity_id)
  values (p_received_by, 'Collected due payment ' || v_receipt, 'Due Payment', v_payment.id);

  return v_payment;
end;
$$;

drop trigger if exists normalize_bike_sale_before_write on public.bike_sales;
create trigger normalize_bike_sale_before_write
before insert or update on public.bike_sales
for each row execute function public.normalize_bike_sale();

drop trigger if exists refresh_due_status_before_write on public.due_records;
create trigger refresh_due_status_before_write
before insert or update on public.due_records
for each row execute function public.refresh_due_status();

create or replace view public.dashboard_summary as
select
  (select count(*) from public.bike_sales where sale_date = current_date) as bike_sales_today,
  (select count(*) from public.bike_sales where date_trunc('month', sale_date) = date_trunc('month', current_date)) as bike_sales_this_month,
  (select coalesce(sum(paid_amount), 0) from public.service_records) as total_service_income,
  (select coalesce(sum(remaining_due), 0) from public.due_records) as total_due_amount,
  (select count(*) from public.due_records where due_date = current_date and remaining_due > 0) as due_today,
  (select count(*) from public.due_records where due_date > current_date and due_date <= current_date + interval '7 days' and remaining_due > 0) as upcoming_due_payments,
  (select count(*) from public.due_records where due_date < current_date and remaining_due > 0) as overdue_payments,
  (select coalesce(sum(amount), 0) from public.debit_transactions) as total_debit,
  (select coalesce(sum(amount), 0) from public.credit_transactions) as total_credit,
  (select count(*) from public.bikes where current_status = 'Available') as available_bike_stock,
  (select count(*) from public.parts where quantity_available <= minimum_stock_level) as low_stock_parts;

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_profiles','staff','customers','bikes','parts','bike_sales','due_records','due_payments',
    'service_records','parts_transactions','debit_transactions','credit_transactions','salary_payments',
    'bonus_payments','home_expenses','other_records','invoices','receipts','activity_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

drop policy if exists user_profiles_own_select on public.user_profiles;
drop policy if exists user_profiles_owner_write on public.user_profiles;
create policy user_profiles_own_select on public.user_profiles for select to authenticated using (id = auth.uid() or public.current_app_role() = 'owner');
create policy user_profiles_owner_write on public.user_profiles for all to authenticated using (public.current_app_role() = 'owner') with check (public.current_app_role() = 'owner');

drop policy if exists staff_select on public.staff;
drop policy if exists staff_insert on public.staff;
drop policy if exists staff_update on public.staff;
drop policy if exists staff_delete on public.staff;
create policy staff_select on public.staff for select to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy staff_insert on public.staff for insert to authenticated with check (public.current_app_role() in ('owner', 'accountant'));
create policy staff_update on public.staff for update to authenticated using (public.current_app_role() in ('owner', 'accountant')) with check (public.current_app_role() in ('owner', 'accountant'));
create policy staff_delete on public.staff for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists customers_select on public.customers;
drop policy if exists customers_insert on public.customers;
drop policy if exists customers_update on public.customers;
drop policy if exists customers_delete on public.customers;
create policy customers_select on public.customers for select to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant', 'staff'));
create policy customers_insert on public.customers for insert to authenticated with check (public.current_app_role() in ('owner', 'manager', 'staff'));
create policy customers_update on public.customers for update to authenticated using (public.current_app_role() in ('owner', 'manager')) with check (public.current_app_role() in ('owner', 'manager'));
create policy customers_delete on public.customers for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists bikes_select on public.bikes;
drop policy if exists bikes_insert on public.bikes;
drop policy if exists bikes_update on public.bikes;
drop policy if exists bikes_delete on public.bikes;
create policy bikes_select on public.bikes for select to authenticated using (public.current_app_role() in ('owner', 'manager'));
create policy bikes_insert on public.bikes for insert to authenticated with check (public.current_app_role() in ('owner', 'manager'));
create policy bikes_update on public.bikes for update to authenticated using (public.current_app_role() in ('owner', 'manager')) with check (public.current_app_role() in ('owner', 'manager'));
create policy bikes_delete on public.bikes for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists parts_select on public.parts;
drop policy if exists parts_insert on public.parts;
drop policy if exists parts_update on public.parts;
drop policy if exists parts_delete on public.parts;
create policy parts_select on public.parts for select to authenticated using (public.current_app_role() in ('owner', 'manager'));
create policy parts_insert on public.parts for insert to authenticated with check (public.current_app_role() in ('owner', 'manager'));
create policy parts_update on public.parts for update to authenticated using (public.current_app_role() in ('owner', 'manager')) with check (public.current_app_role() in ('owner', 'manager'));
create policy parts_delete on public.parts for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists sales_select on public.bike_sales;
drop policy if exists sales_insert on public.bike_sales;
drop policy if exists sales_update on public.bike_sales;
drop policy if exists sales_delete on public.bike_sales;
create policy sales_select on public.bike_sales for select to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant', 'staff'));
create policy sales_insert on public.bike_sales for insert to authenticated with check (public.current_app_role() in ('owner', 'manager', 'staff'));
create policy sales_update on public.bike_sales for update to authenticated using (public.current_app_role() in ('owner', 'manager')) with check (public.current_app_role() in ('owner', 'manager'));
create policy sales_delete on public.bike_sales for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists dues_select on public.due_records;
drop policy if exists dues_insert on public.due_records;
drop policy if exists dues_update on public.due_records;
drop policy if exists dues_delete on public.due_records;
create policy dues_select on public.due_records for select to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant', 'staff'));
create policy dues_insert on public.due_records for insert to authenticated with check (public.current_app_role() in ('owner', 'manager', 'staff'));
create policy dues_update on public.due_records for update to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant')) with check (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy dues_delete on public.due_records for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists due_payments_select on public.due_payments;
drop policy if exists due_payments_insert on public.due_payments;
drop policy if exists due_payments_update on public.due_payments;
drop policy if exists due_payments_delete on public.due_payments;
create policy due_payments_select on public.due_payments for select to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy due_payments_insert on public.due_payments for insert to authenticated with check (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy due_payments_update on public.due_payments for update to authenticated using (public.current_app_role() in ('owner', 'accountant')) with check (public.current_app_role() in ('owner', 'accountant'));
create policy due_payments_delete on public.due_payments for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists service_select on public.service_records;
drop policy if exists service_insert on public.service_records;
drop policy if exists service_update on public.service_records;
drop policy if exists service_delete on public.service_records;
create policy service_select on public.service_records for select to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant', 'staff'));
create policy service_insert on public.service_records for insert to authenticated with check (public.current_app_role() in ('owner', 'manager', 'staff'));
create policy service_update on public.service_records for update to authenticated using (public.current_app_role() in ('owner', 'manager')) with check (public.current_app_role() in ('owner', 'manager'));
create policy service_delete on public.service_records for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists parts_transactions_select on public.parts_transactions;
drop policy if exists parts_transactions_insert on public.parts_transactions;
drop policy if exists parts_transactions_update on public.parts_transactions;
drop policy if exists parts_transactions_delete on public.parts_transactions;
create policy parts_transactions_select on public.parts_transactions for select to authenticated using (public.current_app_role() in ('owner', 'manager'));
create policy parts_transactions_insert on public.parts_transactions for insert to authenticated with check (public.current_app_role() in ('owner', 'manager'));
create policy parts_transactions_update on public.parts_transactions for update to authenticated using (public.current_app_role() in ('owner', 'manager')) with check (public.current_app_role() in ('owner', 'manager'));
create policy parts_transactions_delete on public.parts_transactions for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists debits_select on public.debit_transactions;
drop policy if exists debits_insert on public.debit_transactions;
drop policy if exists debits_update on public.debit_transactions;
drop policy if exists debits_delete on public.debit_transactions;
create policy debits_select on public.debit_transactions for select to authenticated using (public.current_app_role() in ('owner', 'accountant'));
create policy debits_insert on public.debit_transactions for insert to authenticated with check (public.current_app_role() in ('owner', 'accountant'));
create policy debits_update on public.debit_transactions for update to authenticated using (public.current_app_role() in ('owner', 'accountant')) with check (public.current_app_role() in ('owner', 'accountant'));
create policy debits_delete on public.debit_transactions for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists credits_select on public.credit_transactions;
drop policy if exists credits_insert on public.credit_transactions;
drop policy if exists credits_update on public.credit_transactions;
drop policy if exists credits_delete on public.credit_transactions;
create policy credits_select on public.credit_transactions for select to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy credits_insert on public.credit_transactions for insert to authenticated with check (public.current_app_role() in ('owner', 'manager', 'accountant', 'staff'));
create policy credits_update on public.credit_transactions for update to authenticated using (public.current_app_role() in ('owner', 'accountant')) with check (public.current_app_role() in ('owner', 'accountant'));
create policy credits_delete on public.credit_transactions for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists salary_select on public.salary_payments;
drop policy if exists salary_insert on public.salary_payments;
drop policy if exists salary_update on public.salary_payments;
drop policy if exists salary_delete on public.salary_payments;
create policy salary_select on public.salary_payments for select to authenticated using (public.current_app_role() in ('owner', 'accountant'));
create policy salary_insert on public.salary_payments for insert to authenticated with check (public.current_app_role() in ('owner', 'accountant'));
create policy salary_update on public.salary_payments for update to authenticated using (public.current_app_role() in ('owner', 'accountant')) with check (public.current_app_role() in ('owner', 'accountant'));
create policy salary_delete on public.salary_payments for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists bonus_select on public.bonus_payments;
drop policy if exists bonus_insert on public.bonus_payments;
drop policy if exists bonus_update on public.bonus_payments;
drop policy if exists bonus_delete on public.bonus_payments;
create policy bonus_select on public.bonus_payments for select to authenticated using (public.current_app_role() in ('owner', 'accountant'));
create policy bonus_insert on public.bonus_payments for insert to authenticated with check (public.current_app_role() in ('owner', 'accountant'));
create policy bonus_update on public.bonus_payments for update to authenticated using (public.current_app_role() in ('owner', 'accountant')) with check (public.current_app_role() in ('owner', 'accountant'));
create policy bonus_delete on public.bonus_payments for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists home_expenses_select on public.home_expenses;
drop policy if exists home_expenses_insert on public.home_expenses;
drop policy if exists home_expenses_update on public.home_expenses;
drop policy if exists home_expenses_delete on public.home_expenses;
create policy home_expenses_select on public.home_expenses for select to authenticated using (public.current_app_role() in ('owner', 'accountant'));
create policy home_expenses_insert on public.home_expenses for insert to authenticated with check (public.current_app_role() in ('owner', 'accountant'));
create policy home_expenses_update on public.home_expenses for update to authenticated using (public.current_app_role() in ('owner', 'accountant')) with check (public.current_app_role() in ('owner', 'accountant'));
create policy home_expenses_delete on public.home_expenses for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists other_records_select on public.other_records;
drop policy if exists other_records_insert on public.other_records;
drop policy if exists other_records_update on public.other_records;
drop policy if exists other_records_delete on public.other_records;
create policy other_records_select on public.other_records for select to authenticated using (public.current_app_role() in ('owner', 'accountant'));
create policy other_records_insert on public.other_records for insert to authenticated with check (public.current_app_role() in ('owner', 'accountant'));
create policy other_records_update on public.other_records for update to authenticated using (public.current_app_role() in ('owner', 'accountant')) with check (public.current_app_role() in ('owner', 'accountant'));
create policy other_records_delete on public.other_records for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists invoices_select on public.invoices;
drop policy if exists invoices_insert on public.invoices;
drop policy if exists invoices_update on public.invoices;
drop policy if exists invoices_delete on public.invoices;
create policy invoices_select on public.invoices for select to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy invoices_insert on public.invoices for insert to authenticated with check (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy invoices_update on public.invoices for update to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant')) with check (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy invoices_delete on public.invoices for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists receipts_select on public.receipts;
drop policy if exists receipts_insert on public.receipts;
drop policy if exists receipts_update on public.receipts;
drop policy if exists receipts_delete on public.receipts;
create policy receipts_select on public.receipts for select to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy receipts_insert on public.receipts for insert to authenticated with check (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy receipts_update on public.receipts for update to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant')) with check (public.current_app_role() in ('owner', 'manager', 'accountant'));
create policy receipts_delete on public.receipts for delete to authenticated using (public.current_app_role() = 'owner');

drop policy if exists activity_select on public.activity_logs;
drop policy if exists activity_insert on public.activity_logs;
drop policy if exists activity_delete on public.activity_logs;
create policy activity_select on public.activity_logs for select to authenticated using (public.current_app_role() in ('owner', 'manager', 'accountant', 'staff'));
create policy activity_insert on public.activity_logs for insert to authenticated with check (public.current_app_role() in ('owner', 'manager', 'accountant', 'staff'));
create policy activity_delete on public.activity_logs for delete to authenticated using (public.current_app_role() = 'owner');

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_profiles','staff','customers','bikes','parts','bike_sales','due_records','due_payments',
    'service_records','parts_transactions','debit_transactions','credit_transactions','salary_payments',
    'bonus_payments','home_expenses','other_records'
  ]
  loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;
