import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface UpdateRewardParams {
  id: string;
  nome?: string;
  custo_pontos?: number;
  is_active?: boolean;
}

export function useUpdateReward() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateRewardParams) => {
      const { data, error } = await supabase
        .from("rewards")
        // @ts-expect-error - Supabase type mismatch
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      toast({
        title: "Prêmio atualizado!",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar prêmio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
