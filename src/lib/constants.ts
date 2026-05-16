// ENB Shared Constants — professions, business categories, business types
// Import from here everywhere to keep lists in sync

export const PROFESSIONS = [
  'Allopathic Doctor',
  'Artist',
  'Baker / Confectioner',
  'Business Owner',
  'Carpenter',
  'Chef / Cook',
  'Cobbler / Shoe Repairer',
  'Community Food Guardian',
  'Community Health Worker',
  'Contractor',
  'Delivery Rider',
  'Developer / IT',
  'Driver (Taxi/Car)',
  'Dry Fruit Merchant',
  'Electrical Shop (Wires, Lights, Fittings)',
  'Electrician',
  'Electronic Appliances Shop',
  'Electronics Technician',
  'Mobile Repairman',
  'Engineer',
  'Farmer',
  'Food Runner',
  'Fruit & Veg Vendor',
  'Homeopathic Doctor',
  'Mechanic / Auto Technician',
  'Milkman / Dairy',
  'Nurse / Midwife',
  'Other',
  'Painter / Mason',
  'Park / Garden Worker',
  'Pharmacist',
  'Plumber',
  'Private Tutor',
  'Religious Scholar',
  'Retired',
  'Rickshaw / Auto Driver',
  'Security Guard / Watchman',
  'Shopkeeper / Retailer',
  'Social Worker',
  'Street Sweeper',
  'Street Vendor',
  'Student',
  'Tailor / Seamstress',
  'Teacher',
  'Volunteer',
  'Waste Collector / Recycler',
  'Welder',
  'Wholesale Trader',
];

// ── TRADE_PROFESSIONS — single source of truth ────────────────────────────────
// Maps each PROFESSIONS value that represents a trade to its trade type key.
// Used by: Profile.tsx (section visibility), TradesDirectory.tsx (query filter),
// TradesProfile.tsx (badge display).
// NEVER define this mapping in more than one place.
export const TRADE_PROFESSIONS: Record<string, string> = {
  'Plumber':                                  'plumbing',
  'Electrician':                              'electrical',
  'Electronics Technician':                   'appliance_repair',
  'Mobile Repairman':                         'appliance_repair',
  'Electrical Shop (Wires, Lights, Fittings)':'electrical',
  'Carpenter':                                'carpentry',
  'Painter / Mason':                          'masonry',
  'Welder':                                   'welding',
  'Mechanic / Auto Technician':               'auto_repair',
  'Cobbler / Shoe Repairer':                  'general',
  'Tailor / Seamstress':                      'general',
  'Contractor':                               'general',
  'Baker / Confectioner':                     'general',
  'Chef / Cook':                              'general',
};

// All profession strings that qualify as trade professions (for UI checks)
export const TRADE_PROFESSION_LIST = Object.keys(TRADE_PROFESSIONS);

// Business categories — used in PartnerManager, PartnerSignup, BusinessDirectory
export const BUSINESS_CATEGORIES = [
  'Allopathic Clinic / Doctor',
  'Auto Garage / Mechanic',
  'Bakery',
  'Barber / Salon',
  'Cobbler / Shoe Repair',
  'Dhaba / Tea Stall',
  'Dry Fruit Merchant',
  'Electrical Shop (Wires, Lights, Fittings)',
  'Electrical Supplies',
  'Electronic Appliances Shop',
  'Mobile Repair Shop',
  'Fruit & Vegetable Shop',
  'Grocery / General Store',
  'Hardware / Plumbing Supply',
  'Homeopathic Doctor / Shop',
  'Laundry / Dry Cleaner',
  'Pansar (Unani / Herbal)',
  'Pharmacy',
  'Printing / Stationery',
  'Restaurant / Food',
  'School / Academy',
  'Sweet Shop / Mithai',
  'Tailor / Alteration Shop',
  'Tuition Centre',
  'Wholesale Market',
  'Other',
];

// Business types with emoji — for display in directory
export const BUSINESS_TYPE_EMOJI: Record<string, string> = {
  'Dhaba / Tea Stall': '☕',
  'Restaurant / Food': '🍽️',
  'Bakery': '🥖',
  'Sweet Shop / Mithai': '🍬',
  'Grocery / General Store': '🛒',
  'Fruit & Vegetable Shop': '🥕',
  'Wholesale Market': '🏪',
  'Pharmacy': '💊',
  'Allopathic Clinic / Doctor': '🏥',
  'Homeopathic Doctor / Shop': '🌿',
  'Pansar (Unani / Herbal)': '🌱',
  'Auto Garage / Mechanic': '🔧',
  'Electrical Supplies': '⚡',
  'Hardware / Plumbing Supply': '🪛',
  'Printing / Stationery': '🖨️',
  'Tailor / Alteration Shop': '🪡',
  'Cobbler / Shoe Repair': '👞',
  'Barber / Salon': '✂️',
  'Laundry / Dry Cleaner': '👕',
  'School / Academy': '🏫',
  'Tuition Centre': '📚',
  'Electrical Shop (Wires, Lights, Fittings)': '💡',
  'Electronic Appliances Shop': '📱',
  'Dry Fruit Merchant': '🥜',
  'Other': '🏬',
};

// ── ENB DOCTRINE: Single source of truth ─────────────────────────────────────
// UserTier and UserRole TYPE definitions live exclusively in store/user.ts.
// Import types from there — never from this file.
// These arrays are for UI dropdowns only (option rendering). They must match
// the canonical values in store/user.ts exactly.

// User tiers — for admin dropdown display only. Values must match store/user.ts UserTier.
export const USER_TIERS = [
  'Newcomer',
  'Helper',
  'Guardian',
  'Pillar',
  'Founder',       // ← canonical string from store/user.ts (NOT 'Founder Tier')
] as const;

// User roles — for admin dropdown display only. Values must match store/user.ts UserRole.
export const USER_ROLES = [
  'member',
  'moderator',
  'business',
  'founder',
  'admin',
  'super_admin',
] as const;
