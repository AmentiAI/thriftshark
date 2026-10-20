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

-- ---------------------------------------------------------------------------
-- Marketplace: sellers run their own storefronts and get paid via Stripe Connect.
-- ---------------------------------------------------------------------------

create table if not exists images (
  id          serial primary key,
  seller_id   int,
  mime        text not null,
  bytes       bytea not null,
  byte_size   int  not null,
  purpose     text not null default 'item'
                check (purpose in ('item','logo','banner','cashapp-qr')),
  created_at  timestamptz not null default now()
);

create table if not exists sellers (
  id              serial primary key,
  handle          text not null unique,
  shop_name       text not null,
  email           text not null unique,
  password_hash   text not null,
  tagline         text,
  bio             text,
  location        text,
  cashapp_tag     text,
  logo_image_id   int references images(id) on delete set null,
  banner_image_id int references images(id) on delete set null,
  qr_image_id     int references images(id) on delete set null,
  status          text not null default 'active'
                    check (status in ('active','suspended')),
  featured        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists sellers_status_idx on sellers (status, created_at desc);

alter table images add column if not exists seller_id int references sellers(id) on delete cascade;

alter table items       add column if not exists seller_id int references sellers(id) on delete cascade;
alter table item_images add column if not exists image_id  int references images(id)  on delete set null;
alter table orders      add column if not exists seller_id int references sellers(id) on delete set null;
alter table orders      add column if not exists group_token text;

create index if not exists items_seller_idx       on items  (seller_id, status);
create index if not exists orders_seller_idx      on orders (seller_id, created_at desc);
create index if not exists orders_group_idx       on orders (group_token);

-- Legacy QR columns (unused); kept so older rows migrate cleanly.
alter table sellers add column if not exists qr_is_custom boolean not null default false;

-- Where the banner and profile photo sit inside their frames (object-position %).
alter table sellers add column if not exists banner_x smallint not null default 50;
alter table sellers add column if not exists banner_y smallint not null default 50;
alter table sellers add column if not exists logo_x smallint not null default 50;
alter table sellers add column if not exists logo_y smallint not null default 50;

-- ---------------------------------------------------------------------------
-- Auction house. A listing can be put up for timed bidding instead of a fixed
-- price; the winning bid becomes a normal order so it is paid the same way.
-- ---------------------------------------------------------------------------

-- Items on the block get their own status so they stay out of buy-now listings.
alter table items drop constraint if exists items_status_check;
alter table items add constraint items_status_check
  check (status in ('draft','available','reserved','sold','auction'));

create table if not exists auctions (
  id               serial primary key,
  item_id          int not null unique references items(id) on delete cascade,
  seller_id        int not null references sellers(id) on delete cascade,
  start_cents      int not null check (start_cents >= 0),
  reserve_cents    int check (reserve_cents >= 0),
  increment_cents  int not null default 100 check (increment_cents > 0),
  starts_at        timestamptz not null default now(),
  ends_at          timestamptz not null,
  status           text not null default 'live'
                     check (status in ('live','ended','sold','cancelled')),
  settled_at       timestamptz,
  order_id         int references orders(id) on delete set null,
  created_at       timestamptz not null default now()
);

create index if not exists auctions_status_ends_idx on auctions (status, ends_at);
create index if not exists auctions_seller_idx      on auctions (seller_id, created_at desc);

create table if not exists bids (
  id            serial primary key,
  auction_id    int not null references auctions(id) on delete cascade,
  bidder_name   text not null,
  bidder_email  text not null,
  amount_cents  int  not null check (amount_cents > 0),
  created_at    timestamptz not null default now()
);

create index if not exists bids_auction_idx on bids (auction_id, amount_cents desc, id);

-- Direct messages. A buyer is a browser cookie, not an account: one thread per
-- shop, and staff can read every thread.
create table if not exists dm_threads (
  id           serial primary key,
  seller_id    int not null references sellers(id) on delete cascade,
  item_id      int references items(id) on delete set null,
  buyer_name   text not null,
  buyer_email  text not null,
  buyer_key    text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create unique index if not exists dm_threads_pair_idx on dm_threads (seller_id, buyer_key);
create index if not exists dm_threads_seller_idx on dm_threads (seller_id, updated_at desc);
create index if not exists dm_threads_buyer_idx on dm_threads (buyer_key, updated_at desc);

create table if not exists dm_messages (
  id          serial primary key,
  thread_id   int not null references dm_threads(id) on delete cascade,
  sender      text not null check (sender in ('buyer', 'seller')),
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists dm_messages_thread_idx on dm_messages (thread_id, created_at, id);

-- Stripe Connect: sellers get paid on their own Express account (direct charges).
alter table sellers
  add column if not exists stripe_account_id text unique,
  add column if not exists stripe_charges_enabled boolean not null default false,
  add column if not exists stripe_payouts_enabled boolean not null default false;

alter table orders
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text;

-- Flat platform fee (buyer-paid) collected via Stripe application_fee_amount.
alter table orders
  add column if not exists platform_fee_cents int not null default 0
    check (platform_fee_cents >= 0);

create index if not exists orders_stripe_session_idx
  on orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

-- Verified seller plan ($20/mo) — billed on the platform Stripe account.
alter table sellers
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_status text not null default 'none'
    check (subscription_status in (
      'none','active','trialing','past_due','canceled','unpaid','incomplete'
    )),
  add column if not exists subscription_current_period_end timestamptz,
  -- Platform / staff shops: always show Verified without a paid subscription.
  add column if not exists official boolean not null default false;

create index if not exists sellers_subscription_idx
  on sellers (subscription_status)
  where subscription_status in ('active', 'trialing');

create index if not exists sellers_official_idx
  on sellers (official)
  where official;
