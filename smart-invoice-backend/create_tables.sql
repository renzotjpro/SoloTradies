
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
	notes VARCHAR, 
	owner_id INTEGER, 
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
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id),
	FOREIGN KEY(client_id) REFERENCES clients (id)
)


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
	owner_id INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id),
	FOREIGN KEY(client_id) REFERENCES clients (id),
	FOREIGN KEY(invoice_id) REFERENCES invoices (id)
)


CREATE INDEX ix_expenses_id ON expenses (id)

create table organizations (
  id            bigint primary key generated always as identity,
  owner_id      integer not null unique,
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
  owner_id                  integer not null unique,

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
  owner_id    integer not null,
  label_key   text not null,
  label_value text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint unique_user_label unique (owner_id, label_key)
);
