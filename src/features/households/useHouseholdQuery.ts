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
        .maybeSingle();

      if (householdError) throw householdError;

      // Buscar membros
      const { data: members, error: membersError } = await supabase
        .from("profiles")
        .select("*")
        .eq("household_id", householdId);

      if (membersError) throw membersError;

      if (!household) return null;

      // @ts-ignore - Supabase type inference issue
      const householdData: any = household;
      const result: HouseholdWithMembers = {
        id: householdData.id,
        name: householdData.name,
        invite_code: householdData.invite_code,
        created_at: householdData.created_at,
        created_by: householdData.created_by,
        members: members || [],
      };

      return result;
    },
    enabled: !!householdId,
  });
}
