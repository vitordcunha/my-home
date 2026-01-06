import { Database } from "@/types/database";

export type ShoppingItem =
  Database["public"]["Tables"]["shopping_items"]["Row"];

export interface ShoppingItemWithProfile extends ShoppingItem {
  added_by_profile?: {
    nome: string;
    avatar: string | null;
  };
}

export interface CompleteShoppingTripResult {
  items_count: number;
  xp_earned: number;
}

export type ShoppingCategory = "alimentos" | "limpeza" | "higiene" | "outros";

export interface FrequentItem {
  name: string;
  category: string;
  emoji: string;
  purchase_count: number;
}



