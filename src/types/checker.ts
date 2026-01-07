// Database checker type
export interface DbChecker {
  id: string;
  user_id: string;
  display_name: string;
  age: number | null;
  gender: string | null;
  price: number | null;
  rating: number | null;
  tests_count: number | null;
  reviews_count: number | null;
  is_online: boolean | null;
  is_active: boolean | null;
  avatar_url: string | null;
  languages: string[] | null;
  description: string | null;
  social_media: Record<string, string> | null;
  gallery_images: string[] | null;
  created_at: string;
  updated_at: string;
}
