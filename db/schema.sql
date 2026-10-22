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
  -- Legacy in-DB storage. New uploads use blob_url (Vercel Blob) and leave bytes null.
  bytes       bytea,
  byte_size   int  not null,
  purpose     text not null default 'item'
                check (purpose in ('item','logo','banner','cashapp-qr','cover')),
  blob_url    text,
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

-- New uploads store the public Blob URL here; legacy rows may use /api/images/:id.
alter table images
  add column if not exists blob_url text,
  alter column bytes drop not null;

alter table item_images
  alter column url drop not null,
  alter column url set default '';
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

-- Verified is a 30-day pass. verified_until is when the badge drops.
alter table sellers
  add column if not exists verified_until timestamptz,
  add column if not exists verified_reminded_for timestamptz;

update sellers
set verified_until = subscription_current_period_end
where subscription_status in ('active', 'trialing')
  and subscription_current_period_end is not null
  and verified_until is null;

create index if not exists sellers_verified_until_idx
  on sellers (verified_until)
  where verified_until is not null;

-- One row per Stripe Checkout so a webhook retry cannot add 30 days twice.
create table if not exists verified_payments (
  id                 serial primary key,
  seller_id          int not null references sellers(id) on delete cascade,
  stripe_session_id  text not null unique,
  created_at         timestamptz not null default now()
);

-- In-app notes to a shop (Verified expiry warning, etc.).
create table if not exists seller_notices (
  id          serial primary key,
  seller_id   int not null references sellers(id) on delete cascade,
  kind        text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists seller_notices_seller_idx
  on seller_notices (seller_id, created_at desc);

-- Weekly giveaway: shop accounts enter once per Mon–Sun UTC week.
create table if not exists weekly_giveaways (
  id              serial primary key,
  week_start      date not null unique,
  title           text not null default 'Weekly giveaway',
  prize_text      text not null default 'A surprise prize from Thrift Sharks',
  status          text not null default 'open'
    check (status in ('open', 'closed', 'drawn')),
  winner_seller_id int references sellers(id) on delete set null,
  drawn_at        timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists giveaway_entries (
  id           serial primary key,
  giveaway_id  int not null references weekly_giveaways(id) on delete cascade,
  seller_id    int not null references sellers(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (giveaway_id, seller_id)
);

create index if not exists giveaway_entries_giveaway_idx
  on giveaway_entries (giveaway_id, created_at desc);

-- One review per paid order. Buyers leave it from their receipt.
create table if not exists seller_reviews (
  id             serial primary key,
  seller_id      int not null references sellers(id) on delete cascade,
  order_id       int not null unique references orders(id) on delete cascade,
  rating         smallint not null check (rating between 1 and 5),
  body           text,
  reviewer_name  text not null,
  created_at     timestamptz not null default now()
);

create index if not exists seller_reviews_seller_idx
  on seller_reviews (seller_id, created_at desc);

-- Buyer accounts. Verified is a $10 / 30-day pass (green check).
create table if not exists buyers (
  id                  serial primary key,
  name                text not null,
  email               text not null unique,
  password_hash       text not null,
  stripe_customer_id  text unique,
  verified_until      timestamptz,
  status              text not null default 'active'
                        check (status in ('active','suspended')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists buyer_verified_payments (
  id                 serial primary key,
  buyer_id           int not null references buyers(id) on delete cascade,
  stripe_session_id  text not null unique,
  created_at         timestamptz not null default now()
);

-- Giveaways can include verified buyers as well as shops.
alter table giveaway_entries alter column seller_id drop not null;
alter table giveaway_entries
  add column if not exists buyer_id int references buyers(id) on delete cascade;
create unique index if not exists giveaway_entries_buyer_idx
  on giveaway_entries (giveaway_id, buyer_id)
  where buyer_id is not null;

alter table weekly_giveaways
  add column if not exists winner_buyer_id int references buyers(id) on delete set null;

-- Stripe Identity for new seller accounts. Existing shops stay verified.
alter table sellers
  add column if not exists identity_status text not null default 'verified'
    check (identity_status in ('required','pending','verified','failed'));
alter table sellers
  add column if not exists identity_session_id text;
alter table sellers
  add column if not exists identity_verified_at timestamptz;

-- A buyer or shop names a piece they want. Shops reply with something they have.
create table if not exists hunts (
  id           serial primary key,
  buyer_id     int references buyers(id) on delete cascade,
  seller_id    int references sellers(id) on delete cascade,
  title        text not null,
  details      text not null default '',
  size_label   text,
  budget_cents int check (budget_cents is null or budget_cents >= 0),
  status       text not null default 'open' check (status in ('open','closed')),
  created_at   timestamptz not null default now(),
  check (((buyer_id is not null)::int + (seller_id is not null)::int) = 1)
);

create index if not exists hunts_open_idx on hunts (created_at desc) where status = 'open';

create table if not exists hunt_replies (
  id         serial primary key,
  hunt_id    int not null references hunts(id) on delete cascade,
  seller_id  int not null references sellers(id) on delete cascade,
  item_id    int references items(id) on delete set null,
  note       text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists hunt_replies_hunt_idx on hunt_replies (hunt_id, created_at);

-- A price offer on one listing. Accepting it drops that listing to the offer.
create table if not exists offers (
  id              serial primary key,
  item_id         int not null references items(id) on delete cascade,
  from_buyer_id   int references buyers(id) on delete cascade,
  from_seller_id  int references sellers(id) on delete cascade,
  amount_cents    int not null check (amount_cents > 0),
  note            text not null default '',
  status          text not null default 'pending'
                    check (status in ('pending','accepted','declined')),
  created_at      timestamptz not null default now(),
  check (((from_buyer_id is not null)::int + (from_seller_id is not null)::int) = 1)
);

create unique index if not exists offers_buyer_pending_idx
  on offers (item_id, from_buyer_id)
  where status = 'pending' and from_buyer_id is not null;

create unique index if not exists offers_seller_pending_idx
  on offers (item_id, from_seller_id)
  where status = 'pending' and from_seller_id is not null;

create index if not exists offers_item_idx on offers (item_id, created_at desc);

-- Buyer fit. Inches, except shoe size which stays a label ("9", "9.5").
alter table buyers add column if not exists chest_in numeric(4,1);
alter table buyers add column if not exists waist_in numeric(4,1);
alter table buyers add column if not exists inseam_in numeric(4,1);
alter table buyers add column if not exists shoe_size text;

-- Listing measurements and a scheduled drop. A future drops_at stays off the rack.
alter table items add column if not exists chest_in numeric(4,1);
alter table items add column if not exists waist_in numeric(4,1);
alter table items add column if not exists inseam_in numeric(4,1);
alter table items add column if not exists shoe_size text;
alter table items add column if not exists drops_at timestamptz;

-- Existing live pieces are already public, so they do not get hunt replies retroactively.
alter table items add column if not exists hunt_matched boolean;
update items set hunt_matched = true where hunt_matched is null;
alter table items alter column hunt_matched set default false;
alter table items alter column hunt_matched set not null;

alter table orders add column if not exists shipped_at timestamptz;

create unique index if not exists hunt_replies_item_idx
  on hunt_replies (hunt_id, item_id)
  where item_id is not null;

create index if not exists items_drop_idx on items (drops_at) where drops_at is not null;
create index if not exists items_unmatched_idx on items (id) where hunt_matched = false;

-- A live auction show. The auction rows stay the source of truth for bids,
-- winners, and orders. The show is the stage and the camera session.
create table if not exists live_shows (
  id                   serial primary key,
  seller_id            int not null references sellers(id) on delete cascade,
  title                text not null,
  status               text not null default 'draft'
                         check (status in ('draft','live','ended')),
  current_auction_id   int references auctions(id) on delete set null,
  started_at           timestamptz,
  ended_at             timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists live_shows_seller_idx on live_shows (seller_id, created_at desc);
create unique index if not exists live_shows_one_live_idx
  on live_shows (seller_id) where status = 'live';

create table if not exists live_show_lots (
  id          serial primary key,
  show_id     int not null references live_shows(id) on delete cascade,
  auction_id  int not null unique references auctions(id) on delete cascade,
  position    int not null,
  unique (show_id, position)
);

create index if not exists live_show_lots_show_idx on live_show_lots (show_id, position);

-- RTMP details for YouTube or Instagram. The stream key is ciphertext.
create table if not exists live_destinations (
  id                 serial primary key,
  seller_id          int not null references sellers(id) on delete cascade,
  platform           text not null check (platform in ('youtube','instagram')),
  label              text not null default '',
  rtmp_url           text not null,
  stream_key_cipher  text not null,
  created_at         timestamptz not null default now()
);

-- Pieces opened on a live show are not rack listings. An unsold one stays off the shop.
alter table items add column if not exists live_only boolean not null default false;

create index if not exists live_destinations_seller_idx
  on live_destinations (seller_id, created_at desc);

-- Likes and comments belong to one auction. The next piece is a new auction, so both start over.
create table if not exists auction_likes (
  id          serial primary key,
  auction_id  int not null references auctions(id) on delete cascade,
  buyer_id    int references buyers(id) on delete cascade,
  seller_id   int references sellers(id) on delete cascade,
  created_at  timestamptz not null default now(),
  check (((buyer_id is not null)::int + (seller_id is not null)::int) = 1)
);

create unique index if not exists auction_likes_buyer_idx
  on auction_likes (auction_id, buyer_id) where buyer_id is not null;

create unique index if not exists auction_likes_seller_idx
  on auction_likes (auction_id, seller_id) where seller_id is not null;

create table if not exists auction_comments (
  id          serial primary key,
  auction_id  int not null references auctions(id) on delete cascade,
  buyer_id    int references buyers(id) on delete cascade,
  seller_id   int references sellers(id) on delete cascade,
  author_name text not null,
  body        text not null check (char_length(body) between 1 and 280),
  created_at  timestamptz not null default now(),
  check (((buyer_id is not null)::int + (seller_id is not null)::int) = 1)
);

create index if not exists auction_comments_auction_idx
  on auction_comments (auction_id, created_at);

-- Cover the host picks before going live. It is the picture on the live card.
alter table live_shows add column if not exists cover_image_id int references images(id) on delete set null;

alter table images drop constraint if exists images_purpose_check;
alter table images add constraint images_purpose_check
  check (purpose in ('item','logo','banner','cashapp-qr','cover'));

-- Chat for the whole show, so people can talk as soon as they join.
create table if not exists live_show_messages (
  id          serial primary key,
  show_id     int not null references live_shows(id) on delete cascade,
  buyer_id    int references buyers(id) on delete cascade,
  seller_id   int references sellers(id) on delete cascade,
  author_name text not null,
  body        text not null check (char_length(body) between 1 and 280),
  created_at  timestamptz not null default now(),
  check (((buyer_id is not null)::int + (seller_id is not null)::int) = 1)
);

create index if not exists live_show_messages_show_idx
  on live_show_messages (show_id, created_at);

create table if not exists live_show_outputs (
  id              serial primary key,
  show_id         int not null references live_shows(id) on delete cascade,
  destination_id  int not null references live_destinations(id) on delete cascade,
  egress_id       text,
  status          text not null default 'starting'
                    check (status in ('starting','live','failed','stopped')),
  error_message   text,
  unique (show_id, destination_id)
);

-- Who won, tied to their account when they bid while signed in.
alter table bids add column if not exists buyer_id int references buyers(id) on delete set null;
alter table orders add column if not exists buyer_id int references buyers(id) on delete set null;
alter table dm_threads add column if not exists buyer_id int references buyers(id) on delete set null;

create index if not exists bids_buyer_idx on bids (buyer_id) where buyer_id is not null;
create index if not exists orders_buyer_idx on orders (buyer_id) where buyer_id is not null;
create index if not exists dm_threads_buyer_account_idx on dm_threads (buyer_id) where buyer_id is not null;

update bids b
set buyer_id = u.id
from buyers u
where b.buyer_id is null
  and lower(b.bidder_email) = lower(u.email)
  and u.status = 'active';

update orders o
set buyer_id = u.id
from buyers u
where o.buyer_id is null
  and lower(o.email) = lower(u.email)
  and u.status = 'active';

-- A card on file. Live bids are refused until this is set. Nothing is charged here.
alter table buyers add column if not exists payment_method_id text;
alter table sellers add column if not exists payment_method_id text;

-- Camera signaling only (offers and answers). The video itself stays peer to peer.
create table if not exists live_signals (
  id          serial primary key,
  show_id     int not null references live_shows(id) on delete cascade,
  viewer_key  text not null,
  kind        text not null check (kind in ('join','offer','answer','ice')),
  from_host   boolean not null default false,
  payload     text not null default '',
  created_at  timestamptz not null default now()
);

create index if not exists live_signals_show_idx on live_signals (show_id, id);

-- Host tab presence. A closed tab sets host_gone_at; the read path ends the show.
alter table live_shows add column if not exists host_seen_at timestamptz;
alter table live_shows add column if not exists host_gone_at timestamptz;
alter table live_shows add column if not exists host_token text;

update live_shows
set host_seen_at = now()
where status = 'live' and host_seen_at is null;

-- What the host puts over the camera, and a note pinned above chat.
alter table live_shows add column if not exists screen_text text;
alter table live_shows add column if not exists screen_style text not null default 'banner';
alter table live_shows add column if not exists screen_spot text not null default 'top';
alter table live_shows add column if not exists pinned_text text;
alter table live_shows drop constraint if exists live_shows_screen_style_check;
alter table live_shows add constraint live_shows_screen_style_check
  check (screen_style in ('banner','headline','sticker'));
alter table live_shows drop constraint if exists live_shows_screen_spot_check;
alter table live_shows add constraint live_shows_screen_spot_check
  check (screen_spot in ('top','middle','low'));

-- Who is watching. One row per signed-in person per show, refreshed by their open tab.
create table if not exists live_viewers (
  show_id     int not null references live_shows(id) on delete cascade,
  viewer_key  text not null,
  seen_at     timestamptz not null default now(),
  primary key (show_id, viewer_key)
);

create index if not exists live_viewers_seen_idx on live_viewers (show_id, seen_at);

-- Shop notices: unread until the shop opens Messages.
alter table seller_notices add column if not exists read_at timestamptz;
alter table seller_notices add column if not exists href text;

create index if not exists seller_notices_unread_idx
  on seller_notices (seller_id) where read_at is null;
