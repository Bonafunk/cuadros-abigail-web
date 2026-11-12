create table if not exists public.catalog_products (
  item_id text primary key,
  seller_id bigint not null,
  title text not null,
  price numeric(12,2) not null default 0,
  currency_id text not null default 'MXN',
  permalink text not null,
  thumbnail text,
  pictures jsonb not null default '[]'::jsonb,
  category_id text,
  listing_status text not null default 'active',
  is_active boolean not null default true,
  is_hidden boolean not null default false,
  source_updated_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists catalog_products_active_idx
  on public.catalog_products (is_active, is_hidden, updated_at desc);

alter table public.catalog_products enable row level security;
-- Public website reads are performed server-side with the service role key.
-- Never expose SUPABASE_SERVICE_ROLE_KEY in browser code.
