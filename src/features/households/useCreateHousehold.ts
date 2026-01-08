import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface CreateHouseholdParams {
  name: string;
  userId: string;
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ name, userId }: CreateHouseholdParams) => {
      const { data, error } = await supabase.rpc("create_household_for_user", {
        p_user_id: userId,
        p_household_name: name,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async (_data, variables) => {
      // Invalidate and refetch profile query to get updated household_id
      queryClient.invalidateQueries({
        queryKey: ["profile", variables.userId],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["profiles"],
        refetchType: "active",
      });
      queryClient.invalidateQueries({
        queryKey: ["household"],
        refetchType: "active",
      });

      // Force refetch to ensure immediate update
      await queryClient.refetchQueries({
        queryKey: ["profile", variables.userId],
        type: "active",
      });

      toast({
        title: "Casa criada!",
        description: "Sua casa foi criada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar casa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
