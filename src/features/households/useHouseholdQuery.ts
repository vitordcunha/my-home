import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Household = Database["public"]["Tables"]["households"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type HouseholdWithMembers = Household & {
  members?: Profile[];
};

export function useHouseholdQuery(householdId: string | null | undefined) {
  return useQuery({
    queryKey: ["household", householdId],
    queryFn: async (): Promise<HouseholdWithMembers | null> => {
      if (!householdId) return null;

      // Buscar household
      const { data: household, error: householdError } = await supabase
        .from("households")
        .select("*")
        .eq("id", householdId)
        .single();

      if (householdError) throw householdError;

      // Buscar membros
      const { data: members, error: membersError } = await supabase
        .from("profiles")
        .select("*")
        .eq("household_id", householdId);

      if (membersError) throw membersError;

      return {
        ...household,
        members: members || [],
      } as HouseholdWithMembers;
    },
    enabled: !!householdId,
  });
}

