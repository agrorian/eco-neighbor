// ENB Shared Constants — professions, business categories, business types
// Import from here everywhere to keep lists in sync

export const PROFESSIONS = [
  // Healthcare
  'Allopathic Doctor',
  'Homeopathic Doctor',
  'Nurse / Midwife',
  'Community Health Worker',
  'Pharmacist',
  // Trades & Services  
  'Electrician',
  'Plumber',
  'Carpenter',
  'Mechanic / Auto Technician',
  'Painter / Mason',
  'Welder',
  'Tailor / Seamstress',
  'Cobbler / Shoe Repairer',
  // Food & Provisions
  'Baker / Confectioner',
  'Chef / Cook',
  'Milkman / Dairy',
  'Street Vendor',
  'Fruit & Veg Vendor',
  // Transport
  'Rickshaw / Auto Driver',
  'Delivery Rider',
  'Driver (Taxi/Car)',
  // Education
  'Teacher',
  'Private Tutor',
  'Student',
  // Business & Commerce
  'Shopkeeper / Retailer',
  'Business Owner',
  'Wholesale Trader',
  // Environment & Sanitation
  'Waste Collector / Recycler',
  'Park / Garden Worker',
  'Street Sweeper',
  // Community & Social
  'Social Worker',
  'Volunteer',
  'Religious Scholar',
  'Community Food Guardian',
  'Food Runner',
  // Other
  'Engineer',
  'Developer / IT',
  'Artist',
  'Farmer',
  'Contractor',
  'Security Guard / Watchman',
  'Retired',
  'Other',
];

// Business categories — used in PartnerManager, PartnerSignup, BusinessDirectory
export const BUSINESS_CATEGORIES = [
  // Food & Drink
  'Dhaba / Tea Stall',
  'Restaurant / Food',
  'Bakery',
  'Sweet Shop / Mithai',
  // Retail & Provisions
  'Grocery / General Store',
  'Fruit & Vegetable Shop',
  'Wholesale Market',
  // Healthcare
  'Pharmacy',
  'Allopathic Clinic / Doctor',
  'Homeopathic Doctor / Shop',
  'Pansar (Unani / Herbal)',
  // Trades & Services
  'Auto Garage / Mechanic',
  'Electrical Supplies',
  'Hardware / Plumbing Supply',
  'Printing / Stationery',
  'Tailor / Alteration Shop',
  'Cobbler / Shoe Repair',
  'Barber / Salon',
  'Laundry / Dry Cleaner',
  // Education
  'School / Academy',
  'Tuition Centre',
  // Other
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
  'Other': '🏬',
};
