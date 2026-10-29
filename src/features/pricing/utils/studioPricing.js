

// NOTE: module id: 59011
import { isOfferActive } from '@/features/pricing/utils/packSlugs'; // NOTE: module id: 825740

export const STUDIO_CYCLE_MONTHS = {
  quarterly: 3,
  yearly: 12
};

export const STUDIO_MIN_SEATS = 2;
export const STUDIO_MAX_SEATS = 20;

const pppDiscounts = {
  T2: 30,
  T3: 50
};

export function studioTotalCents(seats, baseCents, months = 1) {
  // Volume discount logic:
  // Base price per month = baseCents / months
  // Discount factor = (10 - min(max(0, seats - 1), 4)) / 10
  // e.g. 1 seat: 10/10 (100%), 2 seats: 9/10 (90%), 5+ seats: 6/10 (60%)
  const monthlyBase = baseCents / months;
  const discountFactor = (10 - Math.min(Math.max(0, seats - 1), 4)) / 10;
  
  // Calculate price per seat, round down to nearest cent, then multiply by months and seats
  const pricePerSeat = Math.floor((monthlyBase * discountFactor) / 100 + 1e-9) * 100;
  
  return pricePerSeat * months * seats;
}

export function studioPppTotalCents(seats, baseCents, pppTier, months = 1) {
  const pppDiscount = pppDiscounts[pppTier];
  const totalCents = studioTotalCents(seats, baseCents, months);
  
  if (pppDiscount) {
    return Math.round(totalCents * (100 - pppDiscount) / 100);
  }
  
  return totalCents;
}
