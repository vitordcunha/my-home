import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type {
  ProcessStatementRequest,
  ProcessStatementResponse,
} from "./import-types";

interface UseImportStatementParams {
  onSuccess?: (data: ProcessStatementResponse) => void;
  onError?: (error: Error) => void;
}

export function useImportStatement({
  onSuccess,
  onError,
}: UseImportStatementParams = {}) {
  return useMutation({
    mutationFn: async (request: ProcessStatementRequest) => {
      // Get the current session to pass the auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Você precisa estar autenticado para importar extratos");
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke<ProcessStatementResponse>(
        "process-statement",
        {
          body: request,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        console.error("Error calling process-statement function:", error);
        throw new Error(
          error.message || "Erro ao processar o extrato. Tente novamente."
        );
      }

      if (!data) {
        throw new Error("Nenhum dado retornado ao processar o extrato");
      }

      return data;
    },
    onSuccess,
    onError,
  });
}



