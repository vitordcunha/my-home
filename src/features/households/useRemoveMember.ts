import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface RemoveMemberParams {
  adminId: string;
  memberId: string;
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ adminId, memberId }: RemoveMemberParams) => {
      // @ts-expect-error - Supabase RPC type inference issue
      const { data, error } = await supabase.rpc("remove_household_member", {
        p_admin_id: adminId,
        p_member_id: memberId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast({
        title: "✅ Membro removido",
        description: "O membro foi removido da casa.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover membro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
