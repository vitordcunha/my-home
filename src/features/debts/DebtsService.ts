import { supabase } from "@/lib/supabase";

export interface Debt {
    id: string;
    household_id: string;
    name: string;
    interest_rate: number;
    due_day?: number;
    minimum_payment_percentage?: number;
    minimum_payment_fixed?: number;
    is_active: boolean;
    created_at?: string;
}

export const DebtsService = {
    async list(householdId: string) {
        const { data, error } = await supabase
            .from("debts" as any)
            .select("*")
            .eq("household_id", householdId)
            .eq("is_active", true)
            .order("name");

        if (error) throw error;
        return data as unknown as Debt[];
    },

    async create(debt: Omit<Debt, "id" | "created_at" | "household_id" | "is_active">) {
        // Retrieve user to get household_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user");

        // Get household_id from profile (assuming we have a way, or we query it. 
        // Usually we expect householdId to be passed or derived safely. 
        // For now let's query the profile)
        const { data: profile } = await supabase
            .from("profiles")
            .select("household_id")
            .eq("id", user.id)
            .single();

        if (!profile?.household_id) throw new Error("No household");

        const { data, error } = await supabase
            .from("debts" as any)
            .insert({
                ...debt,
                household_id: profile.household_id,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, debt: Partial<Omit<Debt, "id" | "created_at" | "household_id">>) {
        const { data, error } = await supabase
            .from("debts" as any)
            .update(debt)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from("debts" as any)
            .update({ is_active: false })
            .eq("id", id);

        if (error) throw error;
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from("debts" as any)
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data as unknown as Debt;
    }
};
