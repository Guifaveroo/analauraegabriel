import type { PixKeyType } from "./pix/brcode";
import type { Section, ThemeTokens } from "./content/schemas";

export type GiftOrderStatus = "PENDING" | "PAID" | "CANCELLED";
export type GiftStockStatus = "AVAILABLE" | "PENDING" | "PAID";
export type GiftMode = "single" | "limited" | "unlimited";

export type WeddingSettings = {
  partner1_name: string;
  partner2_name: string;
  wedding_at: string;
  timezone: string;
  ceremony_name: string;
  ceremony_address: string;
  ceremony_time: string;
  ceremony_lat: number | null;
  ceremony_lng: number | null;
  reception_name: string;
  reception_address: string;
  reception_time: string;
  reception_lat: number | null;
  reception_lng: number | null;
  pix_key_type: PixKeyType | null;
  pix_key: string;
  pix_beneficiary: string;
  pix_city: string;
  rsvp_mode: "open" | "closed";
  rsvp_allow_edit: boolean;
  rsvp_deadline: string | null;
  open_rsvp_max_companions: number;
  site_title: string;
  site_description: string;
  og_photo_id: string | null;
  allow_indexing: boolean;
  active_theme_id: string | null;
};

export const PUBLIC_SETTINGS_COLUMNS =
  "partner1_name,partner2_name,wedding_at,timezone,ceremony_name,ceremony_address,ceremony_time,ceremony_lat,ceremony_lng,reception_name,reception_address,reception_time,reception_lat,reception_lng,pix_key_type,pix_key,pix_beneficiary,pix_city,rsvp_mode,rsvp_allow_edit,rsvp_deadline,open_rsvp_max_companions,site_title,site_description,og_photo_id,allow_indexing,active_theme_id";

export type Photo = {
  id: string;
  storage_path: string;
  thumb_path: string;
  width: number;
  height: number;
  caption: string;
  album: string;
  position: number;
  is_featured: boolean;
};

export type Gift = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  mode: GiftMode;
  quantity: number | null;
  photo_id: string | null;
  active: boolean;
  position: number;
};

export type GiftWithStock = Gift & { remaining: number | null; stock_status: GiftStockStatus };

export type PublicMessage = { id: string; name: string; message: string; created_at: string };

export type SiteData = {
  settings: WeddingSettings;
  theme: ThemeTokens;
  sections: Section[];
  photos: Record<string, Photo>;
  gallery: Photo[];
  gifts: GiftWithStock[];
  messages: PublicMessage[];
  pixEnabled: boolean;
};
