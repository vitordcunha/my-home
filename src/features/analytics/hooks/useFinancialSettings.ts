import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { FinancialSettings } from "@/features/expenses/types";

export function useFinancialSettings(householdId: string | undefined) {
    return useQuery({
        queryKey: ["financial-settings", householdId],
        queryFn: async () => {
            if (!householdId) throw new Error("Household ID is required");

            const { data, error } = await supabase
                .from("financial_settings")
                .select("*")
                .eq("household_id", householdId)
                .single();

            if (error) throw error;
            return data as FinancialSettings;
        },
        enabled: !!householdId,
    });
}

export function useUpdateFinancialSettings() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (settings: Partial<FinancialSettings> & { household_id: string }) => {
            const { data, error } = await supabase
                .from("financial_settings")
                .update(settings)
                .eq("household_id", settings.household_id)
                .select()
                .single();

            if (error) throw error;
            return data as FinancialSettings;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["financial-settings", data.household_id] });
            queryClient.invalidateQueries({ queryKey: ["financial-health"] });
        },
    });
}
