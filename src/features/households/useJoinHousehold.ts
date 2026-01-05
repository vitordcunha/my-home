import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface JoinHouseholdParams {
  inviteCode: string;
  userId: string;
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ inviteCode, userId }: JoinHouseholdParams) => {
      // @ts-expect-error - Supabase RPC type inference issue
      const { data, error } = await supabase.rpc("join_household_by_code", {
        p_user_id: userId,
        p_invite_code: inviteCode.toUpperCase(),
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
        title: "Bem-vindo!",
        description: "Você entrou na casa com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao entrar na casa",
        description:
          error.message === "Invalid invite code"
            ? "Código de convite inválido"
            : error.message,
        variant: "destructive",
      });
    },
  });
}
