export interface MaterialRatio {
  name: string;
  amount: number | '';
  unit: string;
}

export interface Product {
  id: string;
  serial_number?: string;
  name: string;
  status: 'pending' | 'archived';
  material_ratio: MaterialRatio[];
  humidity?: number;
  kiln_temperature?: number;
  other_conditions?: string;
  defects?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  firing_date?: string;
  kiln_type?: string;
  operator?: string;
  firing_time?: number;
}
