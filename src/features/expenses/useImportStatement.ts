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
      // Explicitly pass the auth token to ensure it reaches the Edge Function
      const response = await supabase.functions.invoke<ProcessStatementResponse>(
        "process-statement",
        {
          body: request,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      // Log full response for debugging
      console.log("Edge Function Response:", response);

      if (response.error) {
        console.error("Error calling process-statement function:", response.error);

        // Try to extract more details from the error
        let errorMessage = "Erro ao processar o extrato. Tente novamente.";

        if (response.error.message) {
          errorMessage = response.error.message;
        }

        // If there's a context with more details, include it
        if (response.error.context) {
          errorMessage += ` (${JSON.stringify(response.error.context)})`;
        }

        throw new Error(errorMessage);
      }

      if (!response.data) {
        throw new Error("Nenhum dado retornado ao processar o extrato");
      }

      return response.data;
    },
    onSuccess,
    onError,
  });
}



