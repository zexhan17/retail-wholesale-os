import { Product } from '../types/product';

export interface PricingCalculationResult {
  unitPrice: number;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  total: number;
  appliedTierLabel?: string;
  totalPrimaryUnits: number;
}

/**
 * Calculates item pricing accurately based on:
 * - Retail vs Wholesale mode
 * - Selected Unit (Primary e.g. Piece vs Packaging e.g. Carton)
 * - Packaging multiplier (e.g. 1 Carton = 24 Pieces)
 * - Wholesale tiered quantity breaks (e.g. 1-9 pcs: $10, 10-49: $8.50, 50+: $7.00)
 * - Discount percentage
 * - Tax rate percentage
 */
export function calculateItemPrice(
  product: Product,
  quantity: number,
  unitType: 'primary' | 'packaging',
  mode: 'retail' | 'wholesale',
  discountPercentage: number = 0
): PricingCalculationResult {
  const multiplier = unitType === 'packaging' ? Math.max(1, product.packagingMultiplier) : 1;
  const totalPrimaryUnits = quantity * multiplier;

  let effectiveUnitPrice = product.retailPrice;
  let appliedTierLabel: string | undefined = undefined;

  if (mode === 'wholesale') {
    // Sort tiers descending to find highest matched minimum quantity
    const sortedTiers = [...(product.wholesaleTiers || [])].sort((a, b) => b.minQuantity - a.minQuantity);
    const matchedTier = sortedTiers.find((t) => totalPrimaryUnits >= t.minQuantity);

    if (matchedTier) {
      effectiveUnitPrice = matchedTier.pricePerUnit;
      appliedTierLabel = matchedTier.label || `Wholesale Slab (${matchedTier.minQuantity}+ units)`;
    } else if (product.wholesaleTiers && product.wholesaleTiers.length > 0) {
      // If below lowest tier, apply base wholesale or retail price
      effectiveUnitPrice = product.wholesaleTiers[0].pricePerUnit;
      appliedTierLabel = 'Base Wholesale Rate';
    }
  }

  // If selling by packaging (e.g. Carton), the unit price of one carton is unitPrice * multiplier
  const pricePerSelectedUnit = effectiveUnitPrice * multiplier;

  const grossSubtotal = pricePerSelectedUnit * quantity;
  const discountAmount = (grossSubtotal * (discountPercentage || 0)) / 100;
  const taxableAmount = grossSubtotal - discountAmount;
  const taxAmount = (taxableAmount * (product.taxRate || 0)) / 100;
  const total = taxableAmount + taxAmount;

  return {
    unitPrice: pricePerSelectedUnit,
    subtotal: grossSubtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
    appliedTierLabel,
    totalPrimaryUnits,
  };
}
