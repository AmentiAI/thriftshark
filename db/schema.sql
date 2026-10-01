-- Thrift Shark schema. Safe to re-run.

create table if not exists categories (
  id          serial primary key,
  slug        text not null unique,
  name        text not null,
  blurb       text,
  sort_order  int  not null default 0
);

create table if not exists items (
  id                   serial primary key,
  slug                 text not null unique,
  title                text not null,
  description          text not null default '',
  price_cents          int  not null check (price_cents >= 0),
  compare_at_cents     int  check (compare_at_cents >= 0),
  category_id          int  references categories(id) on delete set null,
  brand                text,
  item_size            text,
  condition            text not null default 'good'
                         check (condition in ('new-with-tags','excellent','good','fair','worn')),
  color                text,
  status               text not null default 'available'
                         check (status in ('draft','available','reserved','sold')),
  featured             boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists items_status_created_idx on items (status, created_at desc);
create index if not exists items_category_idx       on items (category_id);

create table if not exists item_images (
  id        serial primary key,
  item_id   int not null references items(id) on delete cascade,
  url       text not null,
  alt       text,
  position  int  not null default 0
);

create index if not exists item_images_item_idx on item_images (item_id, position);

create table if not exists orders (
  id              serial primary key,
  order_number    text not null unique,
  email           text not null,
  customer_name   text not null,
  phone           text,
  address_line1   text,
  address_line2   text,
  city            text,
  region          text,
  postal_code     text,
  country         text not null default 'US',
  subtotal_cents  int  not null default 0,
  shipping_cents  int  not null default 0,
  total_cents     int  not null default 0,
  fulfilment      text not null default 'ship'
                    check (fulfilment in ('ship','pickup')),
  status          text not null default 'new'
                    check (status in ('new','packed','shipped','picked-up','cancelled')),
  payment_status  text not null default 'pending'
                    check (payment_status in ('pending','paid','refunded')),
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists orders_created_idx on orders (created_at desc);

create table if not exists order_items (
  id           serial primary key,
  order_id     int not null references orders(id) on delete cascade,
  item_id      int references items(id) on delete set null,
  title        text not null,
  price_cents  int  not null
);

create index if not exists order_items_order_idx on order_items (order_id);

create table if not exists messages (
  id          serial primary key,
  name        text not null,
  email       text not null,
  subject     text,
  body        text not null,
  item_id     int references items(id) on delete set null,
  handled     boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists subscribers (
  email       text primary key,
  created_at  timestamptz not null default now()
);
