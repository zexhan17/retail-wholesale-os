export interface PriceTier {
  minQuantity: number;
  pricePerUnit: number;
  label?: string; // e.g. "Bulk Slab 1 (10-49)", "Master Carton (50+)"
}

export interface ProductBatch {
  id: string;
  batchNumber: string;
  expiryDate?: string;
  manufacturingDate?: string;
  quantity: number;
  costPrice: number;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  primaryUnit: string;        // e.g. "Piece", "Kg", "Bottle"
  packagingUnit: string;      // e.g. "Box", "Carton", "Crate"
  packagingMultiplier: number; // e.g. 24 -> 1 Carton = 24 Pieces
  costPrice: number;          // Purchase cost per primary unit
  retailPrice: number;        // Standard single-unit retail price
  wholesaleTiers: PriceTier[];// Volume-based wholesale pricing slabs
  stockQuantity: number;      // Current stock in primary units
  reorderLevel: number;       // Minimum stock trigger
  taxRate: number;            // VAT/GST percentage (e.g. 0, 5, 12, 18)
  hsnCode?: string;           // Harmonized System of Nomenclature code
  batches: ProductBatch[];    // Batch and lot breakdown
  imageUrl?: string;
  active: boolean;
}
