// ════════════════════════════════════════════════════════════
// CHECKOUT TYPE DEFINITIONS
// Extracted from Checkout.tsx — logic unchanged
// ════════════════════════════════════════════════════════════

export interface Item {
  _id: string;
  name: string;
  quantity?: number;
  innerQty?: number;
  piecesPerInner?: number;
  piecesPerUnit?: number; // ✅ Matches product model
  minOrderQty?: number;   // ✅ Manual MQ field
  isBulkOnly?: boolean;   // ✅ Bulk restriction
  unit?: string;          // ✅ Piece/Set/Box
  image?: string;
  images?: string[];
  price?: number;
  sku?: string;
  stock?: number;
  gstRate?: number;
}

export interface Address {
  _id?: string;
  shopName?: string;
  fullName: string;
  phone: string;
  street: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  type: string;
  isDefault?: boolean;
  gstNumber?: string;
  isDifferentShipping?: boolean;
  shippingStreet?: string;
  shippingArea?: string;
  shippingPincode?: string;
  shippingCity?: string;
  shippingState?: string;
}

export interface OrderData {
  orderNumber: string;
  items: any[];
  total: number;
  date: string;
  paymentMode?: string;
  paymentId?: string;
  shippingAddress?: any;
  advancePaid?: number;
  itemsPrice?: number;
  shippingPrice?: number;
  discountAmount?: number;
}

export interface DiscountRule {
  minAmount: number;
  discountPercentage: number;
}

export const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Puducherry",
];
