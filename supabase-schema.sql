-- Run each statement separately in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard/project/nywrftutioksevutcrpn/sql/new

create table if not exists categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name_ar    text not null,
  name_tr    text not null,
  image_url  text,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  slug           text unique not null,
  name_ar        text not null,
  name_tr        text not null,
  description_ar text,
  description_tr text,
  price          numeric(10,2) not null,
  compare_price  numeric(10,2),
  category_id    uuid references categories(id) on delete set null,
  is_active      boolean default true,
  stock          int default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

create table if not exists product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid references products(id) on delete cascade not null,
  url         text not null,
  alt_ar      text,
  alt_tr      text,
  sort_order  int default 0,
  created_at  timestamptz default now()
);

create table if not exists product_models (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade not null,
  brand      text not null,
  model_name text not null,
  sort_order int default 0
);

create table if not exists admin_sessions (
  id         uuid primary key default gen_random_uuid(),
  token      text unique not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_product_images_product on product_images(product_id);
create index if not exists idx_product_models_product on product_models(product_id);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists trg_products_updated_at on products;
create trigger trg_products_updated_at
  before update on products
  for each row execute function update_updated_at();

alter table categories      enable row level security;
alter table products        enable row level security;
alter table product_images  enable row level security;
alter table product_models  enable row level security;
alter table admin_sessions  enable row level security;

drop policy if exists "public read categories"     on categories;
drop policy if exists "public read products"       on products;
drop policy if exists "public read product_images" on product_images;
drop policy if exists "public read product_models" on product_models;
drop policy if exists "service full categories"    on categories;
drop policy if exists "service full products"      on products;
drop policy if exists "service full images"        on product_images;
drop policy if exists "service full models"        on product_models;
drop policy if exists "service full sessions"      on admin_sessions;

create policy "public read categories"     on categories     for select using (true);
create policy "public read products"       on products       for select using (is_active = true);
create policy "public read product_images" on product_images for select using (true);
create policy "public read product_models" on product_models for select using (true);

create policy "service full categories"    on categories     for all using (auth.role() = 'service_role');
create policy "service full products"      on products       for all using (auth.role() = 'service_role');
create policy "service full images"        on product_images for all using (auth.role() = 'service_role');
create policy "service full models"        on product_models for all using (auth.role() = 'service_role');
create policy "service full sessions"      on admin_sessions for all using (auth.role() = 'service_role');

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "public read storage" on storage.objects
  for select using (bucket_id = 'products');

create policy "service upload storage" on storage.objects
  for insert with check (bucket_id = 'products');

create policy "service delete storage" on storage.objects
  for delete using (bucket_id = 'products');

create table if not exists store_settings (
  id         text primary key,
  value      jsonb not null,
  updated_at timestamptz default now()
);

alter table store_settings enable row level security;

drop policy if exists "public read settings" on store_settings;
drop policy if exists "service full settings" on store_settings;

create policy "public read settings" on store_settings for select using (true);
create policy "service full settings" on store_settings for all using (auth.role() = 'service_role');

-- Print-on-Demand custom requirements columns
alter table products add column if not exists custom_type text default 'none';
alter table products add column if not exists custom_label_ar text;
alter table products add column if not exists custom_placeholder_ar text;

-- Orders table definition
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  order_code     text not null,
  email          text not null,
  first_name     text not null,
  last_name      text not null,
  country        text not null,
  address        text not null,
  district       text not null,
  postal_code    text,
  city           text not null,
  phone          text not null,
  shipping_cost  numeric(10,2) default 90.00,
  discount       numeric(10,2) default 0.00,
  total_price    numeric(10,2) not null,
  grand_total    numeric(10,2) not null,
  status         text default 'pending',
  payment_method text default 'cod',
  items          jsonb not null,
  created_at     timestamptz default now()
);

alter table orders enable row level security;
drop policy if exists "public read orders" on orders;
drop policy if exists "service full orders" on orders;
create policy "public read orders" on orders for select using (true);
create policy "service full orders" on orders for all using (auth.role() = 'service_role');

-- Customers table definition
create table if not exists customers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  phone      text not null,
  first_name text not null,
  last_name  text not null,
  created_at timestamptz default now()
);

create unique index if not exists idx_customers_email_phone on customers(email, phone);
alter table customers enable row level security;
drop policy if exists "public read customers" on customers;
drop policy if exists "service full customers" on customers;
create policy "public read customers" on customers for select using (true);
create policy "service full customers" on customers for all using (auth.role() = 'service_role');

-- Categories table parent_type column
alter table categories add column if not exists parent_type text default 'collections';

-- Products table custom_fields JSONB column for multi-customizable fields
alter table products add column if not exists custom_fields jsonb default '[]'::jsonb;

