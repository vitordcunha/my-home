import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { vibrate } from "@/lib/utils";
import { Database } from "@/types/database";
import { HouseholdWithMembers } from "./useHouseholdQuery";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface RemoveMemberParams {
  adminId: string;
  memberId: string;
  householdId?: string;
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ adminId, memberId }: RemoveMemberParams) => {
      const { data, error } = await supabase.rpc("remove_household_member", {
        p_admin_id: adminId,
        p_member_id: memberId,
      });

      if (error) throw error;
      return data;
    },
    onMutate: async ({ memberId, householdId }: RemoveMemberParams) => {
      // Vibrate for tactile feedback
      vibrate(50);

      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["profiles"] });
      if (householdId) {
        await queryClient.cancelQueries({
          queryKey: ["household", householdId],
        });
      }

      // Snapshot previous values
      const previousProfiles = queryClient.getQueryData<Profile[]>([
        "profiles",
      ]);
      const previousHousehold = householdId
        ? queryClient.getQueryData<HouseholdWithMembers>([
          "household",
          householdId,
        ])
        : undefined;

      // Optimistic update - remove member from profiles list
      queryClient.setQueryData<Profile[]>(["profiles"], (old) => {
        if (!old) return old;
        return old.filter((profile) => profile.id !== memberId);
      });

      // Optimistic update - remove member from household members
      if (householdId && previousHousehold) {
        queryClient.setQueryData<HouseholdWithMembers>(
          ["household", householdId],
          (old) => {
            if (!old || !old.members) return old;
            return {
              ...old,
              members: old.members.filter((member) => member.id !== memberId),
            };
          }
        );
      }

      // Show success toast
      toast({
        title: "Membro removido",
        description: "O membro foi removido da casa.",
      });

      return { previousProfiles, previousHousehold };
    },
    onError: (error: Error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousProfiles !== undefined) {
        queryClient.setQueryData(["profiles"], context.previousProfiles);
      }
      if (context?.previousHousehold && variables.householdId) {
        queryClient.setQueryData(
          ["household", variables.householdId],
          context.previousHousehold
        );
      }

      // Vibração de erro
      if (navigator.vibrate) {
        navigator.vibrate([100, 30, 100]);
      }

      toast({
        title: "Erro ao remover membro",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}
