import type { Garden } from "@/types";

export interface GardenImpact {
  id: string;
  name: string;
  areaM2: number;
  yieldMinKg: number;
  yieldMaxKg: number;
  yieldMidKg: number;
}

export interface ImpactEstimate {
  totalAreaM2: number;
  gardenCount: number;
  yieldMinKg: number;
  yieldMaxKg: number;
  yieldMidKg: number;
  co2MinKg: number;
  co2MaxKg: number;
  co2MidKg: number;
  savingsMin: number;
  savingsMax: number;
  packagesMin: number;
  packagesMax: number;
  milesNotDriven: number;
  servings: number;
  parkingSpaces: number;
  byGarden: GardenImpact[];
}

// Sprout doesn't track actual harvests yet, so seasonal impact is estimated
// from planted area using typical home-garden benchmarks rather than
// per-crop measurements:
//  - yield: ~2.5-4.8 kg of produce per m^2 per growing season
//  - avoided emissions: ~1.2-2.1 kg CO2e per kg of produce, from the
//    transport, packaging, and cold storage a store-bought equivalent needs
//  - savings: a blended $4.50/kg grocery price for common vegetables
//  - packaging: a typical store-bought serving comes in a ~0.4kg unit of
//    single-use plastic/cardboard (a clamshell, a bag)
// Equivalents below use midpoint yield/CO2 for a single illustrative figure,
// since the precise range is already shown alongside them.
const YIELD_KG_PER_M2 = { min: 2.5, max: 4.8 };
const CO2E_KG_PER_KG_PRODUCE = { min: 1.2, max: 2.1 };
const AVG_PRODUCE_PRICE_PER_KG = 4.5;
const PRODUCE_PER_PACKAGE_KG = 0.4;
const CO2_KG_PER_MILE_DRIVEN = 0.404; // EPA average passenger vehicle
const VEGETABLE_SERVING_KG = 0.15;
const PARKING_SPACE_M2 = 15;

function gardenArea(g: Garden) {
  return g.width_m * g.length_m;
}

export function estimateImpact(gardens: Garden[]): ImpactEstimate {
  const byGarden: GardenImpact[] = gardens
    .map((g) => {
      const areaM2 = gardenArea(g);
      const yieldMinKg = areaM2 * YIELD_KG_PER_M2.min;
      const yieldMaxKg = areaM2 * YIELD_KG_PER_M2.max;
      return {
        id: g.id,
        name: g.name,
        areaM2,
        yieldMinKg,
        yieldMaxKg,
        yieldMidKg: (yieldMinKg + yieldMaxKg) / 2,
      };
    })
    .sort((a, b) => b.yieldMidKg - a.yieldMidKg);

  const totalAreaM2 = gardens.reduce((sum, g) => sum + gardenArea(g), 0);
  const yieldMinKg = totalAreaM2 * YIELD_KG_PER_M2.min;
  const yieldMaxKg = totalAreaM2 * YIELD_KG_PER_M2.max;
  const yieldMidKg = (yieldMinKg + yieldMaxKg) / 2;

  const co2MinKg = yieldMinKg * CO2E_KG_PER_KG_PRODUCE.min;
  const co2MaxKg = yieldMaxKg * CO2E_KG_PER_KG_PRODUCE.max;
  const co2MidKg = (co2MinKg + co2MaxKg) / 2;

  return {
    totalAreaM2,
    gardenCount: gardens.length,
    yieldMinKg,
    yieldMaxKg,
    yieldMidKg,
    co2MinKg,
    co2MaxKg,
    co2MidKg,
    savingsMin: yieldMinKg * AVG_PRODUCE_PRICE_PER_KG,
    savingsMax: yieldMaxKg * AVG_PRODUCE_PRICE_PER_KG,
    packagesMin: yieldMinKg / PRODUCE_PER_PACKAGE_KG,
    packagesMax: yieldMaxKg / PRODUCE_PER_PACKAGE_KG,
    milesNotDriven: co2MidKg / CO2_KG_PER_MILE_DRIVEN,
    servings: yieldMidKg / VEGETABLE_SERVING_KG,
    parkingSpaces: totalAreaM2 / PARKING_SPACE_M2,
    byGarden,
  };
}
