
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
