import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useRegenerateInviteCode() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (householdId: string) => {
      const { data, error } = await supabase.rpc("regenerate_invite_code", {
        p_household_id: householdId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household"] });
      toast({
        title: "Código regenerado",
        description: "Um novo código de convite foi gerado.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao regenerar código",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
