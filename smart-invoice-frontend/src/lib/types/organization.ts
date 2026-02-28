export type Organization = {
  id: number;
  owner_id: number;
  name: string;
  abn: string | null;
  industry: string | null;
  tax_reg_number: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address_line1: string | null;
  address_line2: string | null;
  postcode: string | null;
  created_at: string;
  updated_at: string;
};
