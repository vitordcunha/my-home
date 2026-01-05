import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export function useRestoreTask() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await supabase
        .from("tasks_master")
        // @ts-expect-error - Supabase type mismatch
        .update({ is_active: true })
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "archived"] });
      toast({
        title: "✅ Tarefa restaurada!",
        description: "A tarefa foi restaurada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao restaurar tarefa",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
