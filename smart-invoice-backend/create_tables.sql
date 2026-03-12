
CREATE TABLE users (
	id SERIAL NOT NULL, 
	name VARCHAR, 
	email VARCHAR, 
	hashed_password VARCHAR, 
	is_active BOOLEAN, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
)


CREATE INDEX ix_users_name ON users (name)
CREATE INDEX ix_users_id ON users (id)
CREATE UNIQUE INDEX ix_users_email ON users (email)

CREATE TABLE clients (
	id SERIAL NOT NULL, 
	name VARCHAR, 
	email VARCHAR, 
	address VARCHAR, 
	company VARCHAR, 
	phone VARCHAR, 
	abn VARCHAR, 
	role VARCHAR, 
	notes TEXT, 
	state VARCHAR, 
	owner_id TEXT,
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
)


CREATE INDEX ix_clients_email ON clients (email)
CREATE INDEX ix_clients_name ON clients (name)
CREATE INDEX ix_clients_id ON clients (id)

CREATE TABLE invoices (
	id SERIAL NOT NULL, 
	invoice_number VARCHAR, 
	description VARCHAR, 
	issue_date TIMESTAMP WITHOUT TIME ZONE, 
	due_date TIMESTAMP WITHOUT TIME ZONE, 
	status VARCHAR, 
	subtotal FLOAT, 
	tax_amount FLOAT, 
	total_amount FLOAT, 
	notes VARCHAR,
	client_id INTEGER,
	owner_id INTEGER,
	accent_color VARCHAR(50),
	header_layout VARCHAR(50),
	created_at TIMESTAMP WITHOUT TIME ZONE,
	updated_at TIMESTAMP WITHOUT TIME ZONE,
	PRIMARY KEY (id),
	FOREIGN KEY(client_id) REFERENCES clients (id)
)

-- Migration (run in Supabase if table already exists):
-- ALTER TABLE invoices ADD COLUMN accent_color VARCHAR(50);
-- ALTER TABLE invoices ADD COLUMN header_layout VARCHAR(50);


CREATE INDEX ix_invoices_id ON invoices (id)
CREATE UNIQUE INDEX ix_invoices_invoice_number ON invoices (invoice_number)

CREATE TABLE invoice_items (
	id SERIAL NOT NULL, 
	invoice_id INTEGER NOT NULL, 
	description VARCHAR NOT NULL, 
	quantity FLOAT, 
	unit_price FLOAT NOT NULL, 
	amount FLOAT NOT NULL, 
	tax_rate FLOAT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(invoice_id) REFERENCES invoices (id)
)


CREATE INDEX ix_invoice_items_id ON invoice_items (id)

CREATE TABLE expenses (
	id SERIAL NOT NULL, 
	description VARCHAR NOT NULL, 
	amount FLOAT NOT NULL, 
	gst_included FLOAT, 
	category VARCHAR NOT NULL, 
	expense_date TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	receipt_url VARCHAR, 
	client_id INTEGER, 
	invoice_id INTEGER, 
	owner_id TEXT NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id),
	FOREIGN KEY(client_id) REFERENCES clients (id),
	FOREIGN KEY(invoice_id) REFERENCES invoices (id)
)


CREATE INDEX ix_expenses_id ON expenses (id)

create table organizations (
  id            bigint primary key generated always as identity,
  owner_id      text not null unique,
  name          text not null,
  abn           text,
  industry      text,
  tax_reg_number text,
  phone         text,
  email         text,
  country       text,
  state         text,
  city          text,
  address_line1 text,
  address_line2 text,
  postcode      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table invoice_branding_settings (
  id                        uuid primary key default gen_random_uuid(),
  owner_id                  text not null unique,

  -- Brand
  logo_url                  text,
  header_image_url          text,
  display_name              text,
  business_name             text,
  address                   text,
  phone                     text,
  email                     text,
  abn                       text,
  colour_text               text not null default '#333333',
  colour_graphical          text not null default '#C0392B',

  -- Font
  font_family               text not null default 'Inter',
  font_size                 text not null default 'regular',

  -- Design
  template_id               text not null default 'tradie_classic',
  header_layout             text not null default 'full_bar',
  footer_layout             text not null default 'full_width',
  table_style               text not null default 'bordered',
  logo_position             text not null default 'top_left',

  -- Content: Visibility Toggles
  show_client_address       boolean not null default false,
  show_client_abn           boolean not null default false,
  show_quantity_column      boolean not null default true,
  show_quantity_type        boolean not null default true,
  show_currency_prefix      boolean not null default false,
  show_gst_breakdown        boolean not null default true,
  show_discount_row         boolean not null default false,
  show_surcharge_row        boolean not null default false,
  show_balance_due          boolean not null default true,
  show_po_number            boolean not null default false,
  show_deposit_due_date     boolean not null default false,
  show_payment_details      boolean not null default true,
  show_footer_message       boolean not null default true,
  show_terms_conditions     boolean not null default false,

  -- Content: Payment & Messages
  payment_details           text default 'Please make payments via direct deposit to:\nAcc Name: \nBSB: \nAcc No: ',
  payment_terms             text not null default '14_days',
  footer_message            text default 'Thank you for your business.\nI''m looking forward to working with you again in the future.',
  terms_conditions          text,
  invoice_prefix            text,
  default_notes             text,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table invoice_custom_labels (
  id          uuid primary key default gen_random_uuid(),
  owner_id    text not null,
  label_key   text not null,
  label_value text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint unique_user_label unique (owner_id, label_key)
);

-- ─── Migration: owner_id INTEGER → TEXT (run on existing databases) ────────
-- ALTER TABLE clients ALTER COLUMN owner_id TYPE text USING owner_id::text;
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS state TEXT;
-- ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT;
-- ALTER TABLE invoices ALTER COLUMN owner_id TYPE text USING owner_id::text;
-- ALTER TABLE expenses ALTER COLUMN owner_id TYPE text USING owner_id::text;
-- ALTER TABLE organizations ALTER COLUMN owner_id TYPE text USING owner_id::text;
-- ALTER TABLE invoice_branding_settings ALTER COLUMN owner_id TYPE text USING owner_id::text;
-- ALTER TABLE invoice_custom_labels ALTER COLUMN owner_id TYPE text USING owner_id::text;

-- ─── Auth: Profiles ─────────────────────────────────────────────────────────

create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text,
  business_name      text,
  abn                text,
  role               text not null default 'tradie',
  instagram_username text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on new user signup (reads fields from metadata)
-- COALESCE handles Google OAuth which uses 'name' instead of 'full_name'
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, business_name, abn)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'business_name',
    new.raw_user_meta_data ->> 'abn'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Persistent Memory: Conversations ─────────────────────────────────────────

CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT NOT NULL,
  title       TEXT,
  summary     TEXT,
  agent_state JSONB,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_conversations_owner ON conversations (owner_id, updated_at DESC);

-- ─── Persistent Memory: Conversation Messages ────────────────────────────────

CREATE TABLE conversation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON conversation_messages (conversation_id, created_at ASC);

-- ─── Persistent Memory: User Memories (pgvector enabled) ─────────────────────
-- Requires: CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE user_memories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (category IN ('client_pricing', 'preference', 'behavioral')),
  subject     TEXT,
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  source      TEXT NOT NULL DEFAULT 'agent',
  confidence  FLOAT NOT NULL DEFAULT 1.0,
  embedding   VECTOR(1536),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_owner_memory UNIQUE (owner_id, category, subject, key)
);

CREATE INDEX idx_memories_owner ON user_memories (owner_id, category);
CREATE INDEX idx_memories_subject ON user_memories (owner_id, subject);
CREATE INDEX idx_memories_embedding ON user_memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ─── RPC: Vector similarity search for memories ─────────────────────────────
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 10,
  filter_owner_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  owner_id TEXT,
  category TEXT,
  subject TEXT,
  key TEXT,
  value TEXT,
  source TEXT,
  confidence FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    um.id, um.owner_id, um.category, um.subject,
    um.key, um.value, um.source, um.confidence,
    1 - (um.embedding <=> query_embedding) AS similarity
  FROM user_memories um
  WHERE um.owner_id = filter_owner_id
    AND um.embedding IS NOT NULL
  ORDER BY um.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
