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
      // @ts-expect-error - Supabase RPC type inference issue
      const { data, error } = await supabase.rpc("create_household_for_user", {
        p_user_id: userId,
        p_household_name: name,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate profile query with the correct key
      queryClient.invalidateQueries({
        queryKey: ["profile", variables.userId],
      });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["household"] });
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
